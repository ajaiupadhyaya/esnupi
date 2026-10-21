import assert from 'node:assert/strict';
import { build } from 'esbuild';
import ts from 'typescript';
import { readFile, writeFile, mkdir, mkdtemp, symlink, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';
import { once } from 'node:events';

const shaderSource = await readFile(new URL('../src/lib/shaderLab.ts', import.meta.url), 'utf8');
const shaderCode = ts.transpileModule(shaderSource, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const shader = await import(`data:text/javascript;base64,${Buffer.from(shaderCode).toString('base64')}`);
assert.deepEqual(shader.normalizeShaderLabParams({ speed: Infinity, noise: 'malicious', kaleid: -3 }), { speed: 0.5, noise: 0.35, kaleid: 0 });
assert.equal(shader.normalizeShaderLabParams({ speed: 100 }).speed, 1);
assert.ok(!shader.buildShaderLabSketch('DEAD_CHANNEL', { speed: NaN, noise: Infinity, kaleid: 'bad' }).includes('NaN'));
let writes = 0;
const denied = { from() { return { insert() { writes++; return { select() { return { single: async () => ({error: new Error('denied')}) }; } }; } }; } };
globalThis.__testSupabase = denied;
const output = await build({ entryPoints: ['src/lib/photobookStore.ts'], bundle: true, write: false, format: 'esm', plugins: [{name:'test-boundaries', setup(b) {
 b.onResolve({filter:/^\.\/(supabaseClient|visitorIdentity)$/}, args => ({path:args.path, namespace:'mock'}));
 b.onLoad({filter:/.*/, namespace:'mock'}, args => ({contents:args.path.endsWith('supabaseClient') ? 'export const supabase = globalThis.__testSupabase; export const hasSupabaseConfig = true;' : 'export const getVisitorDisplayName = () => "visitor";'}));
}}] });
const photos = await import(`data:text/javascript;base64,${Buffer.from(output.outputFiles[0].text).toString('base64')}`);
for (const bad of ['https://tracker.example/pixel', 'javascript:alert(1)', 'data:image/svg+xml;base64,PHN2Zz4=', 'data:image/jpeg;base64,' + 'A'.repeat(1000000), null]) assert.equal(photos.isSafeImageUrl(bad), false);
assert.equal(photos.isSafeImageUrl('data:image/jpeg;base64,/9j/2Q=='), true);
await assert.rejects(photos.addSharedPhoto('data:image/jpeg;base64,/9j/2Q=='), /denied/);
assert.equal(writes, 1, 'a denied submission must not be retried');
delete globalThis.__testSupabase;

// Exercise the actual preview server with disposable fixtures.
const root = await mkdtemp(join(tmpdir(), 'esnupi-preview-test-'));
let server;
try {
 await mkdir(join(root, 'scripts')); await mkdir(join(root, 'dist'));
 await writeFile(join(root, 'scripts/serve-with-headers.mjs'), await readFile('scripts/serve-with-headers.mjs'));
 await writeFile(join(root, 'vercel.json'), await readFile('vercel.json'));
 await writeFile(join(root, 'dist/index.html'), '<!doctype html><title>test</title>');
 await writeFile(join(root, 'secret.txt'), 'do not serve');
 await symlink(join(root, 'secret.txt'), join(root, 'dist/leak.txt'));
 const port = 45000 + Math.floor(Math.random() * 10000);
 server = spawn(process.execPath, [join(root, 'scripts/serve-with-headers.mjs')], {env:{...process.env, PORT:String(port)}, stdio:['ignore','pipe','pipe']});
 await Promise.race([once(server.stdout, 'data'), once(server, 'exit').then(() => {throw new Error('preview server failed to start');}), new Promise((_,reject) => setTimeout(() => reject(new Error('preview startup timeout')), 5000))]);
 const base = `http://127.0.0.1:${port}`;
 assert.equal((await fetch(`${base}/%ZZ`)).status, 400);
 assert.equal((await fetch(`${base}/%00`)).status, 400);
 assert.equal((await fetch(`${base}/leak.txt`)).status, 403);
 assert.equal((await fetch(`${base}/assets/missing.js`)).status, 404);
 const response = await fetch(`${base}/film`);
 assert.equal(response.status, 200);
 assert.ok(response.headers.get('content-security-policy'));
 assert.ok((await response.text()).includes('<title>test</title>'));
} finally {
 if (server && server.exitCode === null) { server.kill(); await once(server, 'exit'); }
 await rm(root, {recursive:true, force:true});
}
console.log('Image, shader, denied-write, and preview-server security regressions passed');
