#!/usr/bin/env python3
"""Read-only Digital Pass inventory preflight. Never creates Firestore documents."""
import json
import pathlib
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/digital-pass-inventory-2026-27.canonical.review.json"
EXPECTED = {
    "wk-area": 8050, "wk-dns": 6760, "sk-area": 4810,
    "sk-dns": 4460, "complimentary": 125,
    "sk-instructor": 150, "press": 60,
}

def main():
    snap = json.loads(SOURCE.read_text(encoding="utf-8"))
    assert snap["schema"] == "dns.digital-pass-inventory.v1"
    assert snap["seasonId"] == "2026-27"
    assert snap["approved"] is False, "Do not use an approved production object as a review source"
    rows = sorted(snap["rows"], key=lambda row: row["from"])
    assert len(rows) == 86
    next_number, totals = 1, {}
    for row in rows:
        assert row["from"] == next_number and row["to"] >= row["from"]
        assert row["organizationId"] and row["itemCode"] in EXPECTED
        totals[row["itemCode"]] = totals.get(row["itemCode"], 0) + row["to"] - row["from"] + 1
        next_number = row["to"] + 1
    assert next_number == 24416 and totals == EXPECTED
    print("NUMBERING: PASS; 86 ranges, 24,415 cards, 4,460 DNS seasonal cards")
    print("REVIEW STATUS: approved=false; no Firestore writes")
    cmd = ["gcloud", "firestore", "backups", "list", "--project=dns-core", "--format=json"]
    try:
        result = subprocess.run(cmd, text=True, capture_output=True, check=True, timeout=30)
        backups = json.loads(result.stdout or "[]")
    except (subprocess.SubprocessError, json.JSONDecodeError, FileNotFoundError) as error:
        print("BACKUP: UNVERIFIED; " + type(error).__name__)
        return 2
    ready = [b for b in backups if b.get("state") == "READY" and
             b.get("database") == "projects/dns-core/databases/(default)"]
    if not ready:
        print("BACKUP: BLOCKED (no verified READY backup of default database)")
        return 2
    print("BACKUP: READY found (" + str(len(ready)) + ")")
    print("NEXT: Review service-account effective access and obtain production import approval.")
    return 0

if __name__ == "__main__":
    sys.exit(main())
