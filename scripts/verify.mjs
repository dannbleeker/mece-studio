// THE gate — the single "green before done" command (see CLAUDE.md).
//
// Fail-fast order: typecheck -> lint/format -> dead-code -> tests -> build ->
// size budget. Each tool is spawned directly (shell:false, node-form) so the
// gate runs under this machine's AppLocker policy (which blocks pnpm's `&&`
// script shell and the .bin tool shims) and identically on the Linux CI runner.
import { spawnSync } from 'node:child_process';

function step(label, cmd, args) {
  process.stdout.write(`\n=== ${label} ===\n`);
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.stderr.write(`\n${label} failed (exit ${result.status}).\n`);
    process.exit(result.status ?? 1);
  }
}

step('typecheck', 'node', ['./node_modules/typescript/bin/tsc', '--noEmit']);
step('lint/format', 'node', ['./node_modules/@biomejs/biome/bin/biome', 'check', 'src', 'tests']);
step('dead-code', 'node', ['./node_modules/knip/bin/knip.js']);
step('feature catalogue', 'node', ['./scripts/check-feature-coverage.mjs']);
step('test', 'node', ['./node_modules/vitest/vitest.mjs', 'run']);
step('build', 'node', ['./node_modules/vite/bin/vite.js', 'build']);
step('size budget', 'node', ['./scripts/check-bundle-size.mjs']);

process.stdout.write('\n✓ verify passed\n');
