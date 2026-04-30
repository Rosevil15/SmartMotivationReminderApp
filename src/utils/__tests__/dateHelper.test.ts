import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { isFuture, formatDueTime } from '../dateHelper';

// Feature: smart-motivation-task-reminder

describe('isFuture', () => {
  // --- Unit tests ---

  it('returns true for a date 1 hour in the future', () => {
    const future = new Date(Date.now() + 1000 * 60 * 60);
    expect(isFuture(future)).toBe(true);
  });

  it('returns false for a date 1 hour in the past', () => {
    const past = new Date(Date.now() - 1000 * 60 * 60);
    expect(isFuture(past)).toBe(false);
  });

  it('returns false for the Unix epoch (far past)', () => {
    expect(isFuture(new Date(0))).toBe(false);
  });

  it('returns false for a date exactly at Date.now() (not strictly future)', () => {
    // We freeze time by using a timestamp slightly in the past to avoid race conditions
    const justNow = new Date(Date.now() - 1);
    expect(isFuture(justNow)).toBe(false);
  });

  // --- Property-based tests ---

  // Property 3: for any timestamp strictly before Date.now(), isFuture returns false
  // Validates: Requirements 1.4 / Property 3
  it('Property 3: for any timestamp strictly before Date.now(), isFuture returns false', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: Date.now() - 1 }),
        (ts) => {
          return isFuture(new Date(ts)) === false;
        }
      )
    );
  });

  // Property: for any timestamp strictly after Date.now(), isFuture returns true
  it('Property: for any timestamp strictly after Date.now(), isFuture returns true', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: Date.now() + 1, max: Date.now() + 1000 * 60 * 60 * 24 * 365 }),
        (ts) => {
          return isFuture(new Date(ts)) === true;
        }
      )
    );
  });
});

describe('formatDueTime', () => {
  // --- Unit tests ---

  it('formats a known ISO string into the expected human-readable format', () => {
    // Use a fixed date: Monday, April 28, 2025 at 3:00 PM UTC
    // We test the structure rather than exact locale output to avoid TZ issues
    const iso = '2025-04-28T15:00:00.000Z';
    const result = formatDueTime(iso);
    // Should contain "at" separator
    expect(result).toContain(' at ');
    // Should contain AM or PM
    expect(result).toMatch(/AM|PM/);
  });

  it('returns a non-empty string for any valid ISO date', () => {
    const iso = new Date(Date.now() + 86400000).toISOString();
    const result = formatDueTime(iso);
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes the weekday abbreviation in the output', () => {
    const iso = '2025-04-28T15:00:00.000Z';
    const result = formatDueTime(iso);
    // Should contain a 3-letter weekday abbreviation
    expect(result).toMatch(/Mon|Tue|Wed|Thu|Fri|Sat|Sun/);
  });

  it('includes the month abbreviation in the output', () => {
    const iso = '2025-04-28T15:00:00.000Z';
    const result = formatDueTime(iso);
    expect(result).toMatch(/Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec/);
  });
});
