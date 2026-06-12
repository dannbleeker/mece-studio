// Run the Playwright e2e suite. Sets PLAYWRIGHT_BROWSERS_PATH=0 so Playwright
// uses the project-local browser download (under C:\devtools, AppLocker-allowed)
// and invokes the CLI in node form (no shell / .bin shim) for the same reason.
import { spawnSync } from 'node:child_process';

process.env.PLAYWRIGHT_BROWSERS_PATH = '0';

const result = spawnSync(
  process.execPath,
  ['./node_modules/@playwright/test/cli.js', 'test', ...process.argv.slice(2)],
  { stdio: 'inherit', env: process.env }
);

process.exit(result.status ?? 1);
