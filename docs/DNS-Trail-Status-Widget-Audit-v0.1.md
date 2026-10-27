# Trail Status Widget — source audit and rollout gate

## What was confirmed in code (27 October 2026)
- DNS Partner Portal v2 has a `src/components/WidgetCreator.tsx` with a pre-existing Trails toggle.
- The current builder emits an iframe pointing to `https://www.dolomitinordicski.com/widget`. **The widget URL and returned live data have not been verified.**
- Shared Data canonical model includes `reportingAreas` and destinations; its existing KP `openedKm` is seasonal reporting and **is not an acceptable source for live open trail kilometres**.
- There is no verified Contwise response schema, API contract, permission or upstream caching SLA available in this audit.

## Architecture
Contwise approved read-only feed → controlled ingestion/cache (DNS platform) → normalized TrailStatusSummary by canonical reportingAreaId → Partner Portal's embed endpoint → hotel websites. Shared Data owns types and canonical IDs, not provider credentials or live mutable data. Do not make each iframe call the provider directly.

## Before enabling live values
1. Obtain approved endpoint, authentication model, terms, attribution, expected refresh frequency and outage semantics from Contwise/General Solutions.
2. Inspect real samples with segment ID, geometry/length, open status, update timestamp and area mapping.
3. Confirm whether provider reports partial opening and nested routes; prevent double-counting overlapping route geometries.
4. Map provider entities to the canonical reportingArea IDs; test all DNS areas, cross-area segments and full-network total.
5. Implement TTL/cache and visible fetched/source timestamps. On stale/unknown data show “unavailable”, never a false zero or invented live value.
6. Expose official `/widget` or equivalent read endpoint, confirm it exists and works in all languages and with regional accent.
7. Add automated tests for duplicates, unknown states, stale timestamps, per-area/network reconciliation, and API failures.

## Deliberately out of scope
Last groomed time is optional until the Fleet Management feed is actually validated; do not invent it or infer it from trail-open status. Do not use commercial route totals (800+/1000 km) as live denominators.
