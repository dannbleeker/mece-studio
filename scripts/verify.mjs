// Full local gate: lint -> test -> typecheck -> build.
//
// Each tool is spawned directly (shell:false, node-form entry point) so the
// gate runs under this machine's AppLocker policy, which blocks pnpm's script
// shell and the .bin tool shims. The same script runs unchanged on CI.
import { spawnSync } from 'node:child_process';

function step(label, cmd, args) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.stderr.write(`\n${label} failed (exit ${result.status}).\n`);
    process.exit(result.status ?? 1);
  }
}

step('lint', 'node', ['./node_modules/@biomejs/biome/bin/biome', 'check', 'src', 'tests']);
step('test', 'node', ['./node_modules/vitest/vitest.mjs', 'run']);
step('typecheck', 'node', ['./node_modules/typescript/bin/tsc', '--noEmit']);
step('build', 'node', ['./node_modules/vite/bin/vite.js', 'build']);

process.stdout.write('\n✓ verify passed\n');
