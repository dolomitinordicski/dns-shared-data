"""Extract 2024-25 from verified, private DNS source snapshots."""
import hashlib
import json
import pathlib
import re
import sys

import openpyxl
from pypdf import PdfReader


ROOT = pathlib.Path(sys.argv[1])
OUTPUT = pathlib.Path(sys.argv[2])
SEASON = "2024-25"
FILES = {
    "reportDocx": ("01-ZUKUNFTSF-HIGE-LOIPENENTWICKLUNG-IM-DOLOMITI-NORDICSKI-NETZWERK-UND-S-DTIROL-internal-use-only.docx", "f2ebc123ee5c0f6922adf03fbcb7cc70611739926f004c8d90ee6e4ac4c5eba4"),
    "reportPdf": ("02-2.-DNS-Report-2024-25-Schnee-und-Loipen.pdf", "7824999bc55762b46cdbfbe55eee86a5171a5bc7d393aadf93e37043b590b457"),
    "sales": ("03-VERKAUFSTATISTIK-STATISTICHE-DI-VENDITA-2024-25.xlsx", "f026dce115db43bfe67bfef52880408e1af911d168f6aeb44efbe4fa9ccbbcf0"),
}

source_hashes = {}
source_read_hashes = {}
for key, (filename, expected) in FILES.items():
    actual = hashlib.sha256((ROOT / filename).read_bytes()).hexdigest()
    source_hashes[key] = expected
    source_read_hashes[key] = actual
    if key != "sales" and actual != expected:
        raise ValueError(f"Source changed: {filename}")

def number(value):
    value = value.replace("\u2009", "").strip()
    if "," in value:
        return float(value.replace(".", "").replace(",", "."))
    if re.fullmatch(r"\d{1,3}(?:\.\d{3})+", value):
        return float(value.replace(".", ""))
    return float(value)

def one(pattern, text, description):
    text = re.sub(r"\s+", " ", text.replace("ﬁ", "fi").replace("\u2009", " "))
    match = re.search(pattern, text, flags=re.IGNORECASE | re.DOTALL)
    if not match:
        raise ValueError(f"Could not extract {description} from the supplied PDF")
    return match

def pct(value):
    return round(value, 2)

pdf = PdfReader(ROOT / FILES["reportPdf"][0])
def page_text(page_index):
    return pdf.pages[page_index].extract_text(extraction_mode="layout")

regional_text = page_text(3)
regional_rows = [
    ("antholzertal", "Valle di Anterselva", r"Antholzertal mit OK\s+Biathlon"),
    ("gsiesertal-welsberg-taisten", "Val Casies–Monguelfo–Tesido", r"Gsiesertal-Welsberg-\s*Taisten"),
    ("drei-zinnen", "3 Cime Dolomites", r"3 Zinnen Dolomites"),
    ("osttirol", "Osttirol", r"Osttirol"),
    ("cortina-d-ampezzo", "Cortina d’Ampezzo", r"Cortina"),
    ("val-comelico", "Comelico", r"Comelico"),
    ("ahrntal", "Valle Aurina / Sand in Taufers", r"Ahrntal mit Sand in T\."),
    ("seiser-alm-dolomites-val-gardena", "Alpe di Siusi / Val Gardena", r"Seiser Alm mit Gr[oö]den"),
]
snow_values = {}
for area_id, label, name_pattern in regional_rows:
    match = one(name_pattern + r"\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)%\s+([\d,.]+)%\s+([\d,.]+)%", regional_text, f"regional trail row {area_id}")
    snow_values[area_id] = {
        "label": label, "potentialKm": number(match.group(1)), "openKm": number(match.group(2)),
        "artificialSnowSharePct": number(match.group(3)), "naturalSnowSharePct": number(match.group(4)),
        "openSharePct": number(match.group(5)),
    }

network_row = one(r"Dolomiti NordicSki\s+([\d,.]+)\s+([\d,.]+)\s+([\d,.]+)%\s+([\d,.]+)%\s+([\d,.]+)%", regional_text, "network trail table total")
network_table_potential = number(network_row.group(1))
network_open = number(network_row.group(2))
network_artificial = number(network_row.group(3))
network_natural = number(network_row.group(4))
network_table_pct = number(network_row.group(5))
regional_potential_sum = round(sum(value["potentialKm"] for value in snow_values.values()), 2)
regional_open_sum = round(sum(value["openKm"] for value in snow_values.values()), 2)

narrative_text = page_text(2)
narrative = one(r"insgesamt\s+([\d,.]+)\s+von\s+([\d,.]+)\s+km.*?([\d,.]+)\s*%", narrative_text, "network trail narrative")
narrative_open = number(narrative.group(1))
narrative_potential = number(narrative.group(2))
narrative_pct = number(narrative.group(3))

south_tyrol_text = page_text(5)
south_potential = number(one(r"insgesamt\s+([\d,.]+)\s+Loipenkilometer", south_tyrol_text, "South Tyrol potential km").group(1))
south_open = number(one(r"Davon\s+konnten\s+([\d,.]+)\s+km\s+pr[aä]pariert", south_tyrol_text, "South Tyrol open km").group(1))
south_open_pct = number(one(r"durchschnittlichen\s+Öffnungsgrad\s+von\s+([\d,.]+)\s*%", south_tyrol_text, "South Tyrol open percent").group(1))
south_artificial = number(one(r"durchschnittlich(?:en|er)\s+Kunstschnee\s+Anteil\s+([\d,.]+)\s*%", south_tyrol_text, "South Tyrol artificial-snow share").group(1))
south_natural = number(one(r"durchschnittlich(?:en|er)\s+Naturschnee\s+Anteil\s+([\d,.]+)\s*%", south_tyrol_text, "South Tyrol natural-snow share").group(1))

workbook = openpyxl.load_workbook(ROOT / FILES["sales"][0], data_only=True, read_only=True)
analysis = workbook["DNS ANALYSE"]
annual = workbook["JAHRESVERGLEICH"]
change_row_for_fingerprint = None
for row_index, row in enumerate(annual.iter_rows(values_only=True), 1):
    if any(isinstance(value, str) and value.strip().upper() == "GESAMT" for value in row):
        change_row_for_fingerprint = {"row": row_index, "values": list(row)}
        break
projection = {
    "analysis": [[analysis.cell(row, col).value for col in range(1, 17)] for row in range(8, 17)],
    "annual": [[annual.cell(row, col).value for col in range(1, 8)] for row in range(6, 12)],
    "changeRow": change_row_for_fingerprint,
}
fingerprint = hashlib.sha256(json.dumps(projection, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode()).hexdigest()
if fingerprint != "833665b94e5008f099c0d447fe8cbf189be0f68ce2e0395a25ccaf0064be0040":
    raise ValueError("Sales workbook content differs from the supplied immutable snapshot")
areas = [
    ("antholzertal", "Valle di Anterselva", 8),
    ("gsiesertal-welsberg-taisten", "Val Casies–Monguelfo–Tesido", 9),
    ("drei-zinnen", "3 Cime Dolomites", 10),
    ("osttirol", "Osttirol", 11),
    ("ahrntal", "Valle Aurina / Sand in Taufers", 12),
    ("seiser-alm-dolomites-val-gardena", "Alpe di Siusi / Val Gardena", 13),
    ("cortina-d-ampezzo", "Cortina d’Ampezzo", 14),
    ("val-comelico", "Comelico", 15),
]
products = [("day", "DAY", 3, 4), ("wk-area", "WK AREA", 5, 6),
            ("wk-dns", "WK DNS", 7, 8), ("sk-area", "SK AREA", 9, 10),
            ("sk-dns", "SK DNS", 11, 12), ("sk-instructor", "SK DNS Langlauflehrer", 13, 14)]
records = []
for area_id, label, row in areas:
    facts = []
    for code, source_label, quantity_col, amount_col in products:
        quantity = analysis.cell(row, quantity_col).value
        amount = analysis.cell(row, amount_col).value
        if not isinstance(quantity, (int, float)) or quantity < 0 or quantity != int(quantity):
            raise ValueError(f"Invalid quantity at DNS ANALYSE!{analysis.cell(row, quantity_col).coordinate}")
        if not isinstance(amount, (int, float)) or amount < 0:
            raise ValueError(f"Invalid amount at DNS ANALYSE!{analysis.cell(row, amount_col).coordinate}")
        facts.append({"productCode": code, "productLabelSource": source_label,
                      "quantity": int(quantity), "amount": amount, "currency": "EUR",
                      "sourceCells": [analysis.cell(row, quantity_col).coordinate, analysis.cell(row, amount_col).coordinate]})
    if sum(f["quantity"] for f in facts) != analysis.cell(row, 15).value or sum(f["amount"] for f in facts) != analysis.cell(row, 16).value:
        raise ValueError(f"Sales categories do not reconcile for row {row}")
    records.append({"id": f"{SEASON}__sales__{area_id}", "seasonId": SEASON, "domain": "sales",
                    "organizationId": "", "reportingAreaId": area_id, "label": label,
                    "sheet": "DNS ANALYSE", "recordType": "reporting-area-product-totals",
                    "facts": facts, "readOnly": True,
                    "provenance": {"sourceFile": FILES["sales"][0], "sourceSha256": source_hashes["sales"],
                                   "sourceSheet": "DNS ANALYSE", "sourceRow": row, "dataStatus": "provisional"}})

network_category_totals = []
for product_code, product_label, *_ in products:
    category_facts = [fact for record in records for fact in record["facts"] if fact["productCode"] == product_code]
    network_category_totals.append({"productCode": product_code, "productLabelSource": product_label,
                                    "quantity": sum(fact["quantity"] for fact in category_facts),
                                    "amount": sum(fact["amount"] for fact in category_facts), "currency": "EUR"})
network_quantity = sum(f["quantity"] for f in network_category_totals)
network_amount = sum(f["amount"] for f in network_category_totals)
if network_quantity != analysis.cell(16, 15).value or network_amount != analysis.cell(16, 16).value:
    raise ValueError("Regional sales do not reconcile with the network total")

annual_totals = []
for year, quantity_col, amount_col in [("2022-23", 2, 3), ("2023-24", 4, 5), ("2024-25", 6, 7)]:
    quantity, amount = annual.cell(11, quantity_col).value, annual.cell(11, amount_col).value
    annual_totals.append({"seasonId": year, "quantity": quantity, "amount": amount, "currency": "EUR",
                          "sourceCells": [annual.cell(11, quantity_col).coordinate, annual.cell(11, amount_col).coordinate]})
if annual_totals[-1]["quantity"] != network_quantity or annual_totals[-1]["amount"] != network_amount:
    raise ValueError("Annual and area sales totals do not reconcile")
annual_categories = []
for label, row in [("DAY", 6), ("Area WK", 7), ("Area SK", 8), ("DNS WK", 9), ("DNS SK incl. Langlauflehrer", 10)]:
    values = []
    for year, q_col, amount_col in [("2022-23", 2, 3), ("2023-24", 4, 5), ("2024-25", 6, 7)]:
        values.append({"seasonId": year, "quantity": annual.cell(row, q_col).value,
                       "amount": annual.cell(row, amount_col).value, "currency": "EUR"})
    annual_categories.append({"sourceProductLabel": label, "values": values})

source_delta = None
for row in annual.iter_rows(values_only=True):
    if any(isinstance(value, str) and value.strip().upper() == "GESAMT" for value in row):
        values = list(row)
        if len(values) > 3 and isinstance(values[2], (int, float)) and isinstance(values[3], (int, float)):
            source_delta = {"quantity": values[2], "amount": values[3]}
if source_delta is None:
    raise ValueError("Could not find the source workbook's change-total row")
actual_delta = {"quantity": annual_totals[2]["quantity"] - annual_totals[1]["quantity"],
                "amount": annual_totals[2]["amount"] - annual_totals[1]["amount"]}

records.append({"id": f"{SEASON}__sales__network-annual-comparison", "seasonId": SEASON,
                "domain": "sales", "organizationId": "", "reportingAreaId": "",
                "label": "Dolomiti NordicSki", "sheet": "JAHRESVERGLEICH",
                "recordType": "annual-network-comparison",
                "facts": [{"kind": "annualTotal", **fact} for fact in annual_totals]
                         + [{"kind": "annualCategory", **category} for category in annual_categories]
                         + [{"kind": "networkCategory", **fact} for fact in network_category_totals]
                         + [{"kind": "calculatedChange", "fromSeasonId": "2023-24", "toSeasonId": "2024-25",
                             **actual_delta,
                             "quantityPct": round(actual_delta["quantity"] / annual_totals[1]["quantity"] * 100, 4),
                             "amountPct": round(actual_delta["amount"] / annual_totals[1]["amount"] * 100, 4),
                             "sourceChangeRow": source_delta}],
                "readOnly": True,
                "provenance": {"sourceFile": FILES["sales"][0], "sourceSha256": source_hashes["sales"],
                               "sourceSheet": "JAHRESVERGLEICH", "dataStatus": "provisional"}})

for area_id, snow in snow_values.items():
    records.append({"id": f"{SEASON}__snow__{area_id}", "seasonId": SEASON, "domain": "snow",
                    "organizationId": "", "reportingAreaId": area_id, "label": snow["label"],
                    "sheet": "DNS Report regional table", "recordType": "seasonal-area-trail-summary",
                    "facts": [{**{key: value for key, value in snow.items() if key != "label"},
                               "sourcePage": "PDF p.3 (table); file page 4"}], "readOnly": True,
                    "provenance": {"sourceFile": FILES["reportPdf"][0], "sourceSha256": source_hashes["reportPdf"],
                                   "sourcePage": 4, "dataStatus": "provisional"}})

records.append({"id": f"{SEASON}__snow__network-summary", "seasonId": SEASON, "domain": "snow",
                "organizationId": "", "reportingAreaId": "", "label": "Dolomiti NordicSki",
                "sheet": "DNS Report narrative and regional table", "recordType": "seasonal-network-trail-summary",
                "facts": [{"reportedPotentialKm": narrative_potential, "regionalTablePotentialKm": network_table_potential,
                           "regionalTableSumPotentialKm": regional_potential_sum, "reportedOpenKm": narrative_open,
                           "regionalTableOpenKm": network_open, "regionalTableSumOpenKm": regional_open_sum,
                           "reportedOpenSharePct": narrative_pct, "openSharePctFromRegionalTable": network_table_pct,
                           "openSharePctCalculatedFromRegionalTable": pct(network_open / network_table_potential * 100),
                           "artificialSnowSharePct": network_artificial, "naturalSnowSharePct": network_natural,
                           "sourcePage": "PDF p.2 narrative and p.3 table"}], "readOnly": True,
                "provenance": {"sourceFile": FILES["reportPdf"][0], "sourceSha256": source_hashes["reportPdf"],
                               "sourcePage": 3, "dataStatus": "provisional"}})

records.append({"id": f"{SEASON}__snow__south-tyrol-summary", "seasonId": SEASON, "domain": "snow",
                "organizationId": "", "reportingAreaId": "", "label": "Dolomiti NordicSki Südtirol",
                "sheet": "DNS Report Südtirol summary", "recordType": "seasonal-subnetwork-trail-summary",
                "facts": [{"potentialKm": south_potential, "regionalTableSumPotentialKm": round(sum(snow_values[area]["potentialKm"] for area in ["antholzertal", "gsiesertal-welsberg-taisten", "drei-zinnen", "ahrntal", "seiser-alm-dolomites-val-gardena"]), 2),
                           "openKm": south_open,
                           "regionalTableSumOpenKm": round(sum(snow_values[area]["openKm"] for area in ["antholzertal", "gsiesertal-welsberg-taisten", "drei-zinnen", "ahrntal", "seiser-alm-dolomites-val-gardena"]), 2),
                           "reportedOpenSharePct": south_open_pct, "artificialSnowSharePct": south_artificial,
                           "naturalSnowSharePct": south_natural, "sourcePage": "PDF p.5"}], "readOnly": True,
                "provenance": {"sourceFile": FILES["reportPdf"][0], "sourceSha256": source_hashes["reportPdf"],
                               "sourcePage": 6, "dataStatus": "provisional"}})

def parse_euro(text):
    return number(text.replace("€", "").strip())

cost_text = page_text(10)
snowmaking_specs = [
    ("snowmaking-gsies", "gsiesertal-welsberg-taisten", "Val Casies–Monguelfo–Tesido", r"Gsiesertal-Welsberg-Taisten\s+([\d,.]+)\s+km\s+([\d.]+)€\s+([\d.]+)€"),
    ("snowmaking-3zinnen", "drei-zinnen", "3 Cime Dolomites · area Toblach", r"Tourismusverein Toblach\s*-\s*3ZD\s+([\d,.]+)\s+km\s+([\d.]+)€\s+([\d.]+)€"),
    ("snowmaking-antholz", "antholzertal", "Valle di Anterselva · Biathlonzentrum", r"\*?Biathlon Komitee Antholz\*?\s+([\d,.]+)\s+km\s+(/\*)\s+([\d.]+)€"),
]
snowmaking = {}
for key, area_id, label, pattern in snowmaking_specs:
    match = one(pattern, cost_text, key)
    km, total, per_km = number(match.group(1)), None, None
    if match.group(2) == "/*":
        reported_amount_text = match.group(2)
        per_km = parse_euro(match.group(3))
    else:
        total = parse_euro(match.group(2))
        per_km = parse_euro(match.group(3))
        reported_amount_text = None
    snowmaking[key] = {"areaId": area_id, "label": label, "km": km, "total": total, "perKm": per_km,
                       "reportedAmountText": reported_amount_text}

def cost_record(key, area_id, label, facts, page_index, note):
    records.append({"id": f"{SEASON}__costs__{key}", "seasonId": SEASON, "domain": "costs",
                    "organizationId": "", "reportingAreaId": area_id, "label": label,
                    "sheet": "DNS Report cost example", "recordType": "illustrative-regional-cost-context",
                    "facts": facts, "readOnly": True,
                    "provenance": {"sourceFile": FILES["reportPdf"][0], "sourceSha256": source_hashes["reportPdf"],
                                   "sourcePage": page_index + 1, "dataStatus": "estimated-or-reported-example",
                                   "sourceNote": note}})

for key, data in snowmaking.items():
    cost_record(key, data["areaId"], data["label"], [{"item": "Technical snow production and delivery",
        "snowmakingKm": data["km"], "reportedAmount": data["total"], "reportedAmountText": data["reportedAmountText"],
        "costPerKm": data["perKm"], "currency": "EUR", "vatIncluded": False,
        "basis": "Electricity, water and snow transport; excludes maintenance, staff and infrastructure."}],
        10, "Surveyed example for selected regions, not a network-wide cost total.")

investment_text = page_text(13) + "\n" + page_text(14)
operating_days = number(one(r"insgesamt\s+(\d+)\s+Tage\s+[OÖ]ffnung", investment_text, "reported operating days").group(1))
def investment_row(area_pattern, description):
    return one(area_pattern + r"\s+([\d.]+)€\s+([\d.]+)€", investment_text, description)
gsies = investment_row(r"Gsiesertal-Welsberg-Taisten", "Gsiesertal investment values")
toblach = investment_row(r"Tourismusverein Toblach\s*-\s*3ZD", "Toblach investment values")
gsies_investment, gsies_day = parse_euro(gsies.group(1)), parse_euro(gsies.group(2))
toblach_text, toblach_day = gsies.group(1), None
toblach_line = one(r"Tourismusverein Toblach\s*-\s*3ZD\s+([\d.]+)€\s+([\d.]+)€", investment_text, "Toblach investment values")
toblach_text, toblach_day = toblach_line.group(1) + "€", parse_euro(toblach_line.group(2))
# Keep the printed amount. The correlated combined figure may be displayed as a separate inference.
toblach_reported_amount = parse_euro(toblach_line.group(1))
combined_text = page_text(13) + "\n" + page_text(14)
combined_gsies_line = one(r"Gsiesertal-Welsberg-Taisten\s+([\d.]+)€\s+([\d.]+)€", combined_text[combined_text.find("Wenn"):] if "Wenn" in combined_text else combined_text, "Gsiesertal combined investment and snowmaking")
combined_toblach_line = one(r"Tourismusverein Toblach\s*-\s*3ZD\s+([\d.]+)€\s+([\d.]+)€", combined_text[combined_text.find("Wenn"):] if "Wenn" in combined_text else combined_text, "Toblach combined investment and snowmaking")
gsies_combined, gsies_combined_day = parse_euro(combined_gsies_line.group(1)), parse_euro(combined_gsies_line.group(2))
toblach_combined, toblach_combined_day = parse_euro(combined_toblach_line.group(1)), parse_euro(combined_toblach_line.group(2))
cost_record("investment-gsies", "gsiesertal-welsberg-taisten", "Val Casies–Monguelfo–Tesido", [
    {"item": "Overall investment costs", "reportedAmount": gsies_investment, "perOperatingDay": gsies_day, "currency": "EUR", "reportedOperatingDays": operating_days},
    {"item": "Investment plus technical snow production", "reportedAmount": gsies_combined, "perOperatingDay": gsies_combined_day, "currency": "EUR", "reportedOperatingDays": operating_days},
], 13, "Source presents selected regional examples. Daily figures are retained as published and not recalculated.")
toblach_inferred = toblach_combined - snowmaking["snowmaking-3zinnen"]["total"]
cost_record("investment-3zinnen", "drei-zinnen", "3 Cime Dolomites · area Toblach", [
    {"item": "Overall investment costs", "reportedAmount": toblach_reported_amount,
     "sourceText": toblach_text, "amountStatus": "source-as-printed", "perOperatingDay": toblach_day,
     "currency": "EUR", "reportedOperatingDays": operating_days},
    {"item": "Implied investment component from combined total less snowmaking", "reportedAmount": toblach_inferred,
     "sourceText": toblach_text, "amountStatus": "inferred", "perOperatingDay": toblach_day,
     "currency": "EUR", "reportedOperatingDays": operating_days,
     "note": "Derived from the combined total and the technical snow production amount; source investment line is retained as printed."},
    {"item": "Investment plus technical snow production", "reportedAmount": toblach_combined,
     "perOperatingDay": toblach_combined_day, "currency": "EUR", "reportedOperatingDays": operating_days},
], 13, "Source presents selected regional examples. Daily figures are retained as published and not recalculated.")

snowfarm = page_text(11)
snowfarm_values = {
    "costPerKm": one(r"Kosten pro km beschneiter Loipe\s+([\d.]+)[–-]([\d.]+)\s*€", snowfarm, "snowfarming cost per km").groups(),
    "snowVolume": one(r"Snowfarming:\s+([\d.]+)[–-]([\d.]+)\s*m[³3]", snowfarm, "snowfarming volume").groups(),
    "summerLoss": one(r"Schneeverlust im Sommer\s+([\d.]+)[–-]([\d.]+)\s*%", snowfarm, "snowfarming summer loss").groups(),
    "depotCost": one(r"Gesamtkosten Schneedepot:\s*[~∼]?\s*([\d.]+)\s*€", snowfarm, "snowfarming depot cost").group(1),
    "electricity": one(r"Stromverbrauch:\s*([\d.]+)\s*kWh\s*[→>-]+\s*([\d.]+)\s*€", snowfarm, "snowfarming electricity").groups(),
}
cost_record("snowfarming-osttirol", "osttirol", "Osttirol · Snowfarming Obertilliach", [
    {"item": "Cost per km of snowmaking track", "minimum": parse_euro(snowfarm_values["costPerKm"][0]),
     "maximum": parse_euro(snowfarm_values["costPerKm"][1]), "currency": "EUR", "amountBasis": "net / km"},
    {"item": "Stored snow volume", "snowVolumeMinM3": number(snowfarm_values["snowVolume"][0]),
     "snowVolumeMaxM3": number(snowfarm_values["snowVolume"][1]),
     "summerLossMinPct": number(snowfarm_values["summerLoss"][0]), "summerLossMaxPct": number(snowfarm_values["summerLoss"][1])},
    {"item": "Snow depot total cost", "reportedAmount": parse_euro(snowfarm_values["depotCost"]),
     "currency": "EUR", "amountBasis": "per season (report estimate)"},
    {"item": "Electricity use", "electricityKWh": number(snowfarm_values["electricity"][0]),
     "reportedAmount": parse_euro(snowfarm_values["electricity"][1]), "currency": "EUR"},
], 11, "Snowfarming example from Obertilliach; contextual estimate, not an Osttirol network cost total.")

notes = [
    {"noteType": "season-status", "text": "First provisional historical season; source figures are retained."},
    {"noteType": "trail-reconciliation", "text": "Narrative totals and regional table totals are retained separately when they differ."},
    {"noteType": "sales-reconciliation", "text": "Annual change is recalculated from annual totals; any differing source change-row values are preserved alongside it."},
    {"noteType": "cost-scope", "text": "Regional cost figures are examples, not a complete network-wide survey. Printed inconsistencies and estimates are labelled."},
]
records.append({"id": f"{SEASON}__sources__methodology-notes", "seasonId": SEASON, "domain": "snow",
                "organizationId": "", "reportingAreaId": "", "label": "Source and reconciliation notes",
                "sheet": "DNS supplied sources", "recordType": "source-notes", "facts": notes,
                "readOnly": True,
                "provenance": {"sourceFiles": [entry[0] for entry in FILES.values()],
                               "sourceHashes": source_hashes, "dataStatus": "provisional"}})

sources = [{"id": f"{SEASON}__{key}", "seasonId": SEASON, "sourceKey": key,
            "filename": filename, "sha256": source_hashes[key],
            "driveReadSha256": source_read_hashes[key],
            "contentFingerprint": fingerprint if key == "sales" else None,
            "archivePolicy": "metadata-and-cell-references-only", "access": "trusted-admin-only"}
           for key, (filename, _) in FILES.items()]
summary = {"seasonId": SEASON, "readOnly": True, "status": "provisional",
           "reportedQuantity": network_quantity, "reportedAmount": network_amount, "currency": "EUR",
           "sourceHashes": source_hashes, "driveReadHashes": source_read_hashes,
           "salesWorkbookContentFingerprint": fingerprint,
           "sourceCount": len(sources), "annualTotals": annual_totals,
           "reconciliations": {"salesCategories": {"quantity": network_quantity, "amount": network_amount,
                                                      "matchesWorkbook": True},
                               "salesChangeFrom2023_24": {**actual_delta, "sourceChangeRow": source_delta},
                               "networkTrails": {"narrativePotentialKm": narrative_potential,
                                                 "regionalTablePotentialKm": network_table_potential,
                                                 "regionalTableSumPotentialKm": regional_potential_sum,
                                                 "narrativeOpenKm": narrative_open, "regionalTableOpenKm": network_open,
                                                 "narrativeOpenPct": narrative_pct, "regionalTableOpenPct": network_table_pct,
                                                 "calculatedOpenPctFromRegionalTable": pct(network_open / network_table_potential * 100)}},
           "notes": ["Historical sales for this season are regional product-category totals, not partner-level transactions.",
                     "The annual comparison includes two earlier seasons' network totals only; their separate records were not imported.",
                     "The DOCX and PDF reports overlap on the season report; source file hashes are retained.",
                     "Regional costs are illustrative examples. Uncertain source values are not promoted to exact totals."]}

OUTPUT.write_text(json.dumps({"schemaVersion": 1, "seasonId": SEASON, "records": records,
                              "sources": sources, "summary": summary}, ensure_ascii=False, separators=(",", ":")))
print(json.dumps({"seasonId": SEASON, "records": len(records), "sources": len(sources),
                  "networkQuantity": network_quantity, "networkAmount": network_amount,
                  "annualTotals": annual_totals, "snowAreaCount": len(snow_values)}, ensure_ascii=False))
