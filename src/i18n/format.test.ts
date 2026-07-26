import { describe, expect, it } from 'vitest';
import { formatDate, formatNumber, formatPercent, formatRelativeTime } from './format';

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

describe('formatNumber', () => {
  it('groups thousands in the locale conventions', () => {
    expect(formatNumber('en', 1234567)).toBe('1,234,567');
  });

  it('passes options through', () => {
    expect(formatNumber('en', 0.5, { style: 'percent' })).toBe('50%');
  });
});

describe('formatPercent', () => {
  it('takes a raw ratio, not a pre-multiplied number', () => {
    expect(formatPercent('en', 0.023)).toBe('2.3%');
  });

  it('rounds to one fraction digit by default', () => {
    expect(formatPercent('en', 0.12345)).toBe('12.3%');
  });
});

describe('formatDate', () => {
  it('formats an absolute timestamp', () => {
    // Asserting it produced *something* locale-shaped rather than pinning a
    // format string — the format is Intl's business, not ours.
    expect(formatDate('en', Date.UTC(2026, 0, 15))).toMatch(/2026/);
  });
});

describe('formatRelativeTime', () => {
  const now = Date.UTC(2026, 5, 1, 12, 0, 0);

  it('reads as "now" under a minute', () => {
    expect(formatRelativeTime('en', now - 5_000, now)).toBe('now');
  });

  it('uses minutes, hours, days as the gap grows', () => {
    expect(formatRelativeTime('en', now - 5 * MINUTE, now)).toBe('5 minutes ago');
    expect(formatRelativeTime('en', now - 3 * HOUR, now)).toBe('3 hours ago');
    expect(formatRelativeTime('en', now - 2 * DAY, now)).toBe('2 days ago');
  });

  it('singularises via Intl rather than hand-rolled plural logic', () => {
    expect(formatRelativeTime('en', now - HOUR, now)).toBe('1 hour ago');
  });

  it('clamps a future timestamp to the present instead of saying "in 3 hours"', () => {
    expect(formatRelativeTime('en', now + 3 * HOUR, now)).toBe('now');
  });
});
