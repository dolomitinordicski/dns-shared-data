#!/usr/bin/env python3
"""Read-only check of DNS Digital Pass runtime permissions; no changes to IAM."""
import json
import subprocess
import sys

PROJECT = "dns-core"
SA = "serviceAccount:dns-digital-pass-runtime@dns-core.iam.gserviceaccount.com"
EXPR = 'resource.name=="projects/dns-core/databases/(default)"'
TITLE = "DNSDigitalPassDefaultDB"

def run(*args):
    return json.loads(subprocess.check_output(
        ["gcloud", *args, "--project=" + PROJECT, "--format=json"], text=True))

def main():
    try:
        policy = run("projects", "get-iam-policy", PROJECT)
        matches = [
            b for b in policy.get("bindings", [])
            if b.get("role") == "roles/datastore.user" and SA in b.get("members", [])
        ]
        if len(matches) != 1 or matches[0].get("condition", {}).get("expression") != EXPR or matches[0].get("condition", {}).get("title") != TITLE:
            print("FAIL: unexpected database IAM binding; no changes made")
            return 2
        print("PASS: datastore.user limited to dns-core/(default) with expected IAM condition")
        account = run("iam", "service-accounts", "describe", SA.removeprefix("serviceAccount:"))
        if account.get("disabled") is True:
            print("FAIL: runtime service account disabled")
            return 2
        print("PASS: runtime service account exists and is enabled")
        auth_role = "projects/dns-core/roles/DNSDigitalPassAuthReader"
        auth_bindings = [b for b in policy.get("bindings", []) if b.get("role") == auth_role and SA in b.get("members", [])]
        if len(auth_bindings) != 1 or auth_bindings[0].get("condition"):
            print("FAIL: reviewed Auth read binding is missing or conditional; no changes made")
            return 2
        role = run("iam", "roles", "describe", "DNSDigitalPassAuthReader")
        if role.get("deleted") is True or set(role.get("includedPermissions", [])) != {"firebaseauth.users.get"}:
            print("FAIL: Auth runtime role must contain only firebaseauth.users.get")
            return 2
        print("PASS: minimal Auth user-read role configured for revoked-token checks")
        secret = run("secrets", "get-iam-policy", "DNS_PASS_HMAC_KEY")
        permitted = [b for b in secret.get("bindings", []) if b.get("role") == "roles/secretmanager.secretAccessor" and SA in b.get("members", [])]
        if len(permitted) != 1:
            print("FAIL: secret accessor binding not found")
            return 2
        print("PASS: runtime has secretAccessor for DNS_PASS_HMAC_KEY")
        print("NOTE: IAM policy checks do not prove effective application access; verify with authenticated runtime integration test before deploy.")
        return 0
    except (subprocess.CalledProcessError, ValueError, OSError) as exc:
        print("UNVERIFIED: " + type(exc).__name__)
        return 2

if __name__ == "__main__":
    sys.exit(main())
