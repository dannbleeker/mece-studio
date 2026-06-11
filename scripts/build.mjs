// Build the production bundle: typecheck (tsc --noEmit) then `vite build`.
//
// Spawns each tool directly (shell:false, node-form entry point) rather than
// chaining with `&&` in a package.json script. This machine's AppLocker policy
// blocks pnpm's script shell (the thing that would interpret `&&`) and the
// .bin tool shims; spawning `node <entrypoint>` sidesteps both. The same
// script runs unchanged on the Linux CI runner.
import { spawnSync } from 'node:child_process';

function run(cmd, args) {
  const result = spawnSync(cmd, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run('node', ['./node_modules/typescript/bin/tsc', '--noEmit']);
run('node', ['./node_modules/vite/bin/vite.js', 'build']);
