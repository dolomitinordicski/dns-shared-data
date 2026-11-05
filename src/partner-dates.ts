/** Internal shared date validation; not a package entry point. */
export function partnerDateTime(value: string): number {
  const iso = /^\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2}))?$/;
  const time = Date.parse(value);
  const day = Date.parse(value.slice(0, 10) + 'T00:00:00Z');
  if (!iso.test(value) || !Number.isFinite(time) || !Number.isFinite(day)
      || new Date(day).toISOString().slice(0, 10) !== value.slice(0, 10)) {
    throw new Error('Invalid partner date: ' + value);
  }
  return time;
}

export function effectiveAt(from: string, to: string | undefined, asOf: number): boolean {
  const start = partnerDateTime(from);
  const end = to === undefined ? Infinity : partnerDateTime(to);
  if (end <= start) throw new Error('Invalid partner date interval');
  return start <= asOf && asOf < end;
}

