import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { DNS_TOOL_ICON_CATEGORIES as categories, DNS_TOOL_ICON_ASSIGNMENTS as tools, getDNSToolIcon } from '@dolomitinordicski/dns-shared-data/tool-icons';
const catalog=JSON.parse(fs.readFileSync(new URL('../assets/tool-icons/catalog.json',import.meta.url),'utf8'));

test('package export and JSON catalog agree',()=>{
  assert.equal(catalog.schemaVersion,1);
  assert.deepEqual(categories,catalog.categories);
  assert.deepEqual(tools,catalog.tools);
});

test('every known tool resolves to a valid category with icon and colors',()=>{
  for(const [tool,category] of Object.entries(tools)) {
    assert.ok(Object.hasOwn(categories,category));
    const result=getDNSToolIcon(tool);
    assert.deepEqual(result,{category,...categories[category]});
    assert.match(result.icon,/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.match(result.accent,/^#[0-9a-f]{6}$/i);
    assert.match(result.tint,/^#[0-9a-f]{6}$/i);
  }
});

test('unknown and built-in property names consistently use the general icon',()=>{
  for(const name of ['unknown-tool','','toString','constructor','__proto__','hasOwnProperty']) {
    assert.deepEqual(getDNSToolIcon(name),{category:'general',...categories.general});
  }
});

