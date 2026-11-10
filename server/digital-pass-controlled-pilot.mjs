/** Server-only, single-card acceptance window. No cloud or inventory mutations. */
export function controlledPilotSettings({ enabled = 'false', organizationId = '', passNumber = '', operatorUid = '', until = '' } = {}, now = Date.now()) {
  if (enabled === 'false' || enabled === '') return null;
  if (enabled !== 'true' || !/^[A-Za-z0-9_-]{1,128}$/.test(organizationId)
      || !/^[A-Za-z0-9_-]{1,128}$/.test(operatorUid)
      || !/^\d{1,12}$/.test(passNumber) || !Number.isSafeInteger(Number(passNumber)) || Number(passNumber) < 1
      || !/T.*(?:Z|[+-]\d{2}:\d{2})$/.test(until)) throw Error('PILOT_CONFIGURATION_REQUIRED');
  const deadline = Date.parse(until);
  if (!Number.isFinite(deadline) || deadline > now + 4 * 3600000) throw Error('PILOT_CONFIGURATION_REQUIRED');
  // An expired configuration stays restricted, rather than reverting to an
  // unrestricted service. Existing holder reads/admin revocation can continue.
  return Object.freeze({ organizationId, operatorUid, printedNumber: String(Number(passNumber)).padStart(6, '0'), until: deadline });
}
export function assertControlledPilotOpen(pilot, now = Date.now()) {
  if (pilot && (!Number.isFinite(pilot.until) || now >= pilot.until)) throw Error('PILOT_WINDOW_CLOSED');
}
export function assertControlledPilotOperator(pilot, actor) {
  if (pilot && actor?.uid !== pilot.operatorUid) throw Error('FORBIDDEN');
}
export function assertControlledPilotAssignment(pilot, assignment) {
  if (pilot && (assignment?.organizationId !== pilot.organizationId || assignment?.printedNumber !== pilot.printedNumber)) throw Error('FORBIDDEN');
}

export function assertControlledPilotNumber(pilot, passNumber) {
  if (pilot && (typeof passNumber !== 'string' || !/^\d{1,12}$/.test(passNumber.trim())
      || String(Number(passNumber.trim())).padStart(6, '0') !== pilot.printedNumber)) throw Error('FORBIDDEN');
}
