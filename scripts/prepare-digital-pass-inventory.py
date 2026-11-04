#!/usr/bin/env python3
"""Safe offline preparation of a review-only Firestore inventory payload.

No network access and no database writes. Explicitly remains approved=false.
The separate production import must require approval and a verified backup.
"""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "data/digital-pass-inventory-2026-27.canonical.review.json"
OUTPUT = ROOT / "data/digital-pass-inventory-2026-27.import-preview.json"
EXPECTED = {"wk-area":8050,"wk-dns":6760,"sk-area":4810,"sk-dns":4460,
            "complimentary":125,"sk-instructor":150,"press":60}

def prepare(data):
    assert data.get("schema") == "dns.digital-pass-inventory.v1"
    assert data.get("seasonId") == "2026-27"
    assert data.get("approved") is False
    rows = sorted(data.get("rows", []), key=lambda r: r["from"])
    assert len(rows) == 86
    totals, current = {}, 1
    for r in rows:
        assert r["from"] == current and r["to"] >= r["from"]
        assert isinstance(r["organizationId"], str) and r["organizationId"]
        assert r["itemCode"] in EXPECTED
        totals[r["itemCode"]] = totals.get(r["itemCode"], 0) + r["to"]-r["from"]+1
        current = r["to"]+1
    assert current == 24416 and totals == EXPECTED
    canonical = json.dumps(rows, ensure_ascii=False, separators=(",",":"),sort_keys=True).encode()
    digest = hashlib.sha256(canonical).hexdigest()
    return {
        "schema":"dns.digital-pass-inventory.v1",
        "seasonId":"2026-27",
        "revision":"printed-2026-27-"+digest[:16],
        "approved":False,
        "rows":rows,
        "sourceSha256":digest,
        "provenance":{
            "source":"DNS Data Entry Ticket-Nummerierung; numbers printed 2026/27",
            "sourceFile":"data/digital-pass-inventory-2026-27.canonical.review.json",
            "totalPrinted":24415,
            "dnsSeasonal":4460,
            "approvalStatus":"PENDING"
        }
    }

if __name__ == "__main__":
    result = prepare(json.loads(SOURCE.read_text(encoding="utf-8")))
    OUTPUT.write_text(json.dumps(result,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print("READY FOR REVIEW: "+str(OUTPUT))
    print("REVISION: "+result["revision"])
    print("APPROVED: false (never upload automatically)")
