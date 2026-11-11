/**
 * Pushes the ration-only dishes (src/data/rationSeed.ts) into Supabase `partner_products`
 * with target_channels = ["site"] — they show up in the admin panel under "site rations"
 * and never in the hall (POS) showcase. Safe to re-run: rows are upserted by id.
 *
 *   node --experimental-strip-types scripts/seed_ration_dishes.mts          # dry run
 *   node --experimental-strip-types scripts/seed_ration_dishes.mts --write  # really write
 */
import fs from 'node:fs';
import { rationSeedRows } from '../src/data/rationSeed.ts';

const env = Object.fromEntries(
  fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => [l.slice(0, l.indexOf('=')), l.slice(l.indexOf('=') + 1).trim()])
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const write = process.argv.includes('--write');

console.log(`${rationSeedRows.length} dishes:`);
for (const r of rationSeedRows) console.log(` ${r.day} ${r.meal_type.padEnd(9)} ${r.calories} kcal  ${r.slug}`);
if (!write) {
  console.log('\nDry run — add --write to upsert into partner_products.');
  process.exit(0);
}

const res = await fetch(`${url}/rest/v1/partner_products?on_conflict=id`, {
  method: 'POST',
  headers: {
    apikey: key,
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
    Prefer: 'resolution=merge-duplicates,return=minimal',
  },
  body: JSON.stringify(rationSeedRows),
});
console.log(res.ok ? `\nUpserted ${rationSeedRows.length} rows.` : `\nFAILED ${res.status}: ${await res.text()}`);
