# Immutable 2025-26 source history

Season ID is `2025-26` (the canonical equivalent of 2025–2026). The active season stays unchanged.

`historicalSeasonRecords` stores scoped documents with `seasonId`, `domain`, `organizationId`, `reportingAreaId`, original labels and `facts`. Domains are `orders`, `sales`, `pricing`, `kp`. Analytics must flatten only the requested domain's facts. Historical observations are intentionally separate from editable operational drafts and are denied all client writes, including administrator writes.

Sales facts are leaf partner observations, split by product, channel and sales period. Amounts preserve the workbook's amounts, including valued tickets financed by the region. These amounts are not proof of cash receipts. Season tickets have no online/track split in the source: their columns represent presale, regular and complimentary tickets. Missing quantities are omitted, not replaced with zeros. Instructor tickets remain a separate product. Unspecified complimentary periods are not inferred.

`historicalSeasonImports/2025-26` contains the independent reported regional controls, differences against leaf details, snapshot digest and immutable import marker. Never add reported controls to detail facts. This administrator-only document reports existing discrepancies without silently adjusting partner facts. Five regional controls reconcile exactly; three remain source discrepancies.

KP facts retain three cumulative milestones (23 December 2025, 6 January 2026, 20 January 2026), natural/artificial kilometres and source reference kilometres. Never sum cumulative milestones or interpret observed kilometres above reference as a corrected capacity. Osttirol/Obertilliach are separate source observations; overlap is not inferred. The inconsistent derived `analysed data` worksheet is archived, not promoted to validated KP metrics.

Orders use only the 2025-26 sections of the primary sheets. Copied sections, previous seasons, stock balances and supplier notes remain in the archive but do not enter order totals. Pricing preserves each region's actual source labels and unit prices, including missing values.

`historicalSeasonSources` archives original nonempty cells, cached values, formula text, workbook checksum and sheet name. Readable by administrators only. Workbook macros are never executed. Source sheets may contain older periods; archive membership does not relabel those cells as 2025-26 observations.

Import is atomic and create-only. A matching digest makes a rerun harmless; a different digest or pre-existing unmatched record aborts. Persisted documents are read back and compared with every imported value. The extraction script validates all three original file checksums and reconciles source order totals and sales differences.

Public Git contains code and, when private Drive access is unavailable, an encrypted payload only. Payload encryption uses AES-256-GCM with a random data key wrapped by RSA-OAEP/SHA-256 for the Firebase service account. The private key stays in the existing repository secret and trusted Actions runner. Never commit decrypted JSON, the workbooks or credentials. The authenticated ciphertext must remain available until its import has been verified.
