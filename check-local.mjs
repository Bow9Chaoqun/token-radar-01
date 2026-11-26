// Local self-check for the token-radar-01 entry (dev tool, not part of grading).
// Usage: node check-local.mjs [out-dir]
// Checks the gate's board rules against out/board.json + the kit snapshot, rebuilds the dossier
// with the kit's vendor library and compares bytes, and checks dashboard size / no-network rules.
// Screenshots must exist in <out-dir>/screenshots for main.ts to have produced a dossier.
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = dirname(fileURLToPath(import.meta.url));
const outDir = process.argv[2] ? join(root, process.argv[2]) : join(root, 'out');
const kit = '/home/hatch/workspace/makefun/token-radar-01-kit';

const snap = JSON.parse(readFileSync(join(kit, 'input/snapshot.json'), 'utf8'));
const board = JSON.parse(readFileSync(join(outDir, 'board.json'), 'utf8'));
const rows = board.rows;
const fails = [];
const ok = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) fails.push(name);
};

const slugs = new Set(rows.map((r) => r.slug));
ok('watchlist coverage 40/40', snap.watchlist.every((s) => slugs.has(s)));
ok('ranks 1..N continuous', rows.map((r) => r.rank).sort((a, b) => a - b).every((r, i) => r === i + 1), `N=${rows.length}`);
let mono = true;
for (let i = 1; i < rows.length; i++) if (rows[i].implied_value_usd > rows[i - 1].implied_value_usd) mono = false;
ok('implied_value non-increasing', mono, `top=${rows[0].implied_value_usd} bottom=${rows[rows.length - 1].implied_value_usd}`);
ok('implied values vary', rows[0].implied_value_usd !== rows[rows.length - 1].implied_value_usd);
let badSteps = 0;
for (const r of rows) {
  if (r.farm_steps.length < 3 || r.farm_steps.length > 12) badSteps++;
  for (const s of r.farm_steps) if (s.trim().length < 20 || s.trim().length > 600) badSteps++;
}
ok('farm steps 3-12/row, 20-600 chars', badSteps === 0);
ok('slugs unique, all in snapshot', new Set(rows.map((r) => r.slug)).size === rows.length && rows.every((r) => snap.protocols.some((p) => p.slug === r.slug)));
ok('implied positive safe integers', rows.every((r) => Number.isSafeInteger(r.implied_value_usd) && r.implied_value_usd > 0 && r.implied_value_usd <= 1e14));

const model = await import(join(root, 'lib/model.ts'));
const rebuilt = model.buildBoard(snap);
ok('model recompute matches board.json', rebuilt.every((r, i) => r.slug === rows[i].slug && r.implied_value_usd === rows[i].implied_value_usd));

const bsize = statSync(join(outDir, 'board.json')).size;
ok('board.json < 8 MiB', bsize < 8 * 1024 * 1024, `${(bsize / 1024).toFixed(0)} KB`);
const dashDir = join(root, 'dashboard');
let dtotal = 0;
for (const f of readdirSync(dashDir)) dtotal += statSync(join(dashDir, f)).size;
ok('dashboard source < 55 KB total', dtotal < 55 * 1024, `${dtotal} bytes`);
let httpHits = [];
for (const f of readdirSync(dashDir)) if (/https?:\/\//.test(readFileSync(join(dashDir, f), 'utf8'))) httpHits.push(f);
ok('no http(s) in dashboard files', httpHits.length === 0, httpHits.join(','));

const vendor = await import(join(kit, 'starter/vendor/makefun-board.ts'));
const rebuiltDossier = vendor.buildDossier(outDir, { text_max_bytes: 65536, screenshots: { max: 4, max_bytes: 524288 }, dashboard: { max_files: 400, max_bytes: 4194304 } });
const mine = readFileSync(join(outDir, 'dossier.json'));
ok('dossier.json byte-matches buildDossier', Buffer.compare(Buffer.from(rebuiltDossier), mine) === 0, `${mine.length} bytes`);
const dossier = JSON.parse(mine.toString('utf8'));
ok('dossier text <= 65536 bytes, nothing cut', Buffer.byteLength(dossier.text, 'utf8') <= 65536 && !dossier.text.includes('[Cut at'), `${Buffer.byteLength(dossier.text, 'utf8')} bytes`);

console.log('TOP 5:', rows.slice(0, 5).map((r) => `#${r.rank} ${r.slug} $${r.implied_value_usd.toLocaleString()}`).join(' | '));
console.log(fails.length === 0 ? 'ALL CHECKS PASSED' : `FAILURES: ${fails.join(', ')}`);
process.exit(fails.length ? 1 : 0);
