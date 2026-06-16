import { expect, type Route, test } from '@playwright/test';

// The standalone project dashboard (public/dashboard.html) fetches two things:
// the committed stats.json (served from /) and the live GitHub API. We stub the
// GitHub API in every test so the suite never depends on its (rate-limited,
// unauthenticated) availability from a CI runner.

const NOW = new Date().toISOString();

/** Fulfil the GitHub endpoints loadLive() calls with minimal fixtures. */
function githubFixtures(route: Route) {
  const path = route.request().url().split('?')[0];
  let body: unknown = [];
  if (/\/repos\/dannbleeker\/mece-studio$/.test(path)) {
    body = {
      full_name: 'dannbleeker/mece-studio',
      language: 'TypeScript',
      stargazers_count: 7,
      open_issues_count: 2,
      pushed_at: NOW,
    };
  } else if (path.includes('/commits')) {
    body = [
      { sha: 'abc1234', commit: { message: 'feat: add a thing', author: { name: 'Dann', date: NOW } }, author: { login: 'dannbleeker' } },
      { sha: 'def5678', commit: { message: 'fix: a bug', author: { name: 'Dann', date: NOW } }, author: { login: 'dannbleeker' } },
    ];
  } else if (path.includes('/pulls')) {
    body = [{ number: 1, title: 'A merged PR', merged_at: NOW, user: { login: 'dannbleeker' } }];
  }
  return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) });
}

test('dashboard loads and renders project metrics from stats.json', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  // Force the GitHub section down its graceful-failure path so the test never
  // flakes on the API; the metrics section is independent of it.
  await page.route('https://api.github.com/**', (route) => route.abort());

  await page.goto('/dashboard.html');

  await expect(page.getByRole('heading', { name: 'MECE Studio' })).toBeVisible();
  // Headline stats only render once stats.json has loaded + parsed.
  await expect(page.getByText('lines of TS/JS')).toBeVisible();
  await expect(page.getByText('automated tests')).toBeVisible();
  await expect(page.getByText('catalogued features')).toBeVisible();
  await expect(page.getByText('eager bundle (gz)')).toBeVisible();
  // The "not published yet" fallback must NOT be showing.
  await expect(page.getByText(/stats\.json not published yet/)).toHaveCount(0);
  // GitHub was aborted → the graceful card, not a crash.
  await expect(page.getByText('GitHub unavailable')).toBeVisible();

  expect(errors).toEqual([]);
});

test('dashboard renders the live repo pulse from the GitHub API', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('https://api.github.com/**', githubFixtures);

  await page.goto('/dashboard.html');

  await expect(page.locator('#repo-line')).toContainText('dannbleeker/mece-studio');
  await expect(page.getByText('commits / 30d')).toBeVisible();
  await expect(page.getByText('merged PRs / 30d')).toBeVisible();
  await expect(page.getByText('contributors')).toBeVisible();
  // The metrics section still renders alongside the pulse.
  await expect(page.getByText('catalogued features')).toBeVisible();

  expect(errors).toEqual([]);
});

test('dashboard shows a graceful notice when stats.json is unavailable', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(String(e)));
  await page.route('https://api.github.com/**', (route) => route.abort());
  // Block both the relative fetch and the raw.githubusercontent fallback.
  await page.route('**/stats.json', (route) => route.abort());
  await page.route('**/stats-history.json', (route) => route.abort());

  await page.goto('/dashboard.html');

  await expect(page.getByText(/stats\.json not published yet/)).toBeVisible();
  expect(errors).toEqual([]);
});
