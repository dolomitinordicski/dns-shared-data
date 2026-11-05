function normalized(value) {
  return Array.isArray(value) ? value.map(normalized)
    : value && typeof value === 'object'
      ? Object.fromEntries(Object.keys(value).sort().map(key => [key, normalized(value[key])]))
      : value;
}

function comparable(collection, id, data, exportChanged) {
  const copy = structuredClone(data);
  // Only XLSX-export byte diagnostics may vary. Canonical source hashes,
  // cell fingerprints, every record and every other metadata field stay strict.
  if (exportChanged && collection === 'historicalSeasonSources' && id === '2024-25__sales') {
    delete copy.driveReadSha256;
  }
  if (exportChanged && collection === 'historicalSeasonImports' && id === '2024-25') {
    delete copy.importHash;
    if (copy.driveReadHashes) delete copy.driveReadHashes.sales;
  }
  return JSON.stringify(normalized(copy));
}

export function assertHistoryMatches(entries, documents, exportChanged = false) {
  if (documents.length !== entries.length) throw new Error('Historical document count mismatch. No overwrite allowed.');
  documents.forEach((document, index) => {
    const [collection, id, expected] = entries[index];
    if (!document.exists || comparable(collection, id, document.data(), exportChanged)
        !== comparable(collection, id, expected, exportChanged)) {
      throw new Error(`Historical content differs at ${collection}/${id}. No overwrite allowed.`);
    }
  });
}

/** db is an Admin Firestore adapter. Existing history is always read-only here. */
export async function persistHistory2024_25(db, entries, importHash) {
  const season = await db.doc('seasons/2024-25').get();
  if (!season.exists) throw new Error('Canonical season seasons/2024-25 is missing; import aborted without writes.');
  const refs = entries.map(([collection, id]) => db.collection(collection).doc(id));
  const exportChanged = await db.runTransaction(async transaction => {
    const marker = await transaction.get(db.doc('historicalSeasonImports/2024-25'));
    const existing = await transaction.getAll(...refs);
    if (marker.exists) {
      const changed = marker.data().importHash !== importHash;
      assertHistoryMatches(entries, existing, changed);
      return changed;
    }
    if (existing.some(document => document.exists)) {
      throw new Error('Historical 2024-25 documents exist without an import marker. No overwrite allowed.');
    }
    entries.forEach(([, , data], index) => transaction.create(refs[index], data));
    return false;
  });
  assertHistoryMatches(entries, await db.getAll(...refs), exportChanged);
  return { exportChanged };
}
