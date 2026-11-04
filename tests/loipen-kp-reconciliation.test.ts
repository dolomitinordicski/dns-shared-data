import assert from 'node:assert/strict';
import test from 'node:test';
import { compareDNSLoipenWithValidatedKP } from '../src/loipen-kp-reconciliation.js';
const trails = { sourceRegionId: 5, areaId: 'gsiesertal-welsberg-taisten', openTrails: 2, totalTrails: 4, openKm: 18, totalKm: 40 };
const kp = { seasonId: '2026-27', reportingAreaId: 'gsiesertal-welsberg-taisten', milestoneId: 'a', openedKm: 20, naturalSnowKm: 15, artificialSnowKm: 5, potentialOperationalKm: 40 };
const scope = { seasonId: '2026-27', milestoneDate: '2026-12-10T12:00:00Z', loipenObservedAt: '2026-12-10T12:00:00Z' };
test('compares aligned open km', () => assert.equal(compareDNSLoipenWithValidatedKP(trails as any, kp as any, scope).deltaOpenKm, -2));
test('does not compare when time is unknown', () => assert.equal(compareDNSLoipenWithValidatedKP(trails as any, kp as any, { ...scope, loipenObservedAt: null }).deltaOpenKm, null));
test('rejects cross-area KP', () => assert.throws(() => compareDNSLoipenWithValidatedKP(trails as any, { ...kp, reportingAreaId: 'drei-zinnen' } as any, scope), /mismatch/));
