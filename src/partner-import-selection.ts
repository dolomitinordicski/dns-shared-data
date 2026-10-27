export const PARTNER_IMPORT_COLUMNS = [4,5,6,7,8,9,10,11,12,16,17,19,21,23,24,25,27,28,29,30,31] as const;
export function selectPartnerImportValues(row: readonly unknown[]) {
  return PARTNER_IMPORT_COLUMNS.map(column => ({column, value: row[column - 1]}))
    .filter(entry => entry.value !== null && entry.value !== undefined && String(entry.value).trim() !== '');
}
