// Copy decks from data/ into the R2 bucket the deployed site reads from.
//
//   npm run seed:r2                      every deck in data/ not yet in R2
//   npm run seed:r2 -- <filename> ...    just these decks (no .json)
//   npm run seed:r2 -- --force ...       overwrite decks already in R2
//
// Without --force, a deck that already exists in R2 is skipped, so this never
// clobbers edits made on the deployed site. Images in public/images/ don't
// need seeding: they ship with the build as static assets.

import { execFileSync } from 'node:child_process';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';

const BUCKET = 'byrne-decks';
const DATA_DIR = join(process.cwd(), 'data');

const args = process.argv.slice(2);
const force = args.includes('--force');
const requested = args.filter((a) => a !== '--force');

const filenames = requested.length
  ? requested
  : readdirSync(DATA_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));

function wrangler(...wranglerArgs) {
  return execFileSync('npx', ['wrangler', ...wranglerArgs], { stdio: ['ignore', 'pipe', 'pipe'] });
}

function existsInR2(key) {
  try {
    wrangler('r2', 'object', 'get', `${BUCKET}/${key}`, '--remote', '--pipe');
    return true;
  } catch {
    return false;
  }
}

for (const filename of filenames) {
  const key = `decks/${filename}.json`;
  if (!force && existsInR2(key)) {
    console.log(`skip     ${key} (already in R2; pass --force to overwrite)`);
    continue;
  }
  wrangler(
    'r2', 'object', 'put', `${BUCKET}/${key}`,
    '--file', join(DATA_DIR, `${filename}.json`),
    '--content-type', 'application/json',
    '--remote',
  );
  console.log(`uploaded ${key}`);
}
