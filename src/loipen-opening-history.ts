export interface DNSDailyOpeningRecord {
  date: string;
  openKm: number;
  verification: string;
}

/** Analytics activation: first observed growth, not the first archival day. */
export function findDNSOpeningStart(rows: readonly DNSDailyOpeningRecord[]): string | null {
  const sorted = [...rows].sort((a,b) => a.date.localeCompare(b.date));
  const seen = new Set<string>();
  let baseline: number | null = null;
  for (const row of sorted) {
    if (seen.has(row.date) || !/^\\d{4}-\\d{2}-\\d{2}$/.test(row.date) ||
        !Number.isFinite(row.openKm) || row.openKm < 0 ||
        row.verification !== 'website-counter-captured') {
      throw new Error('Invalid daily Loipen historical series');
    }
    seen.add(row.date);
    if (baseline !== null && row.openKm > baseline) return row.date;
    baseline = row.openKm;
  }
  return null;
}
