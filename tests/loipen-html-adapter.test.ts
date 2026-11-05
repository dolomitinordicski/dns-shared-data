import assert from 'node:assert/strict';
import test from 'node:test';
import { parseDNSLoipenHTML } from '../src/loipen-html-adapter.js';

function page(region = 5, trails = '0 / 4', km = '0 / 40') {
  return '<div class="trails__header"></div>' +
    '<div class="trails_regions-item" data-entity-id="' + region + '"></div>' +
    '<div class="liveinfos__badges">' +
    '<div class="liveinfos__badges-item"><div><strong>' + trails + '</strong><br>open trails</div></div>' +
    '<div class="liveinfos__badges-item"><div><strong>' + km + '</strong><br>open km</div></div></div>' +
    '<div class="trails__legend-container"></div><table id="table-trails"></table>';
}
test('extracts published Gsies regional counts without summing trail rows', () => {
  assert.deepEqual(parseDNSLoipenHTML(page(), 5), {
    sourceRegionId: 5, areaId: 'gsiesertal-welsberg-taisten',
    openTrails: 0, totalTrails: 4, openKm: 0, totalKm: 40
  });
});
test('rejects mismatched region', () => assert.throws(() => parseDNSLoipenHTML(page(6), 5), /mismatch/));
test('rejects missing badges', () => assert.throws(() => parseDNSLoipenHTML(page().replace('open km', 'unknown'), 5), /badge/));
test('rejects open kilometres exceeding total', () => assert.throws(() => parseDNSLoipenHTML(page(5, '0 / 4', '41 / 40'), 5), /Invalid/));
test('rejects a changed page structure', () => assert.throws(() => parseDNSLoipenHTML(page().replace('id="table-trails"', 'id="missing"'), 5), /structure/));
