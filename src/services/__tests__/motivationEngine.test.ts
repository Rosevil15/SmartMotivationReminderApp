/**
 * Feature: smart-motivation-task-reminder
 * Tests for motivationEngine — unit tests and property-based tests.
 *
 * The function is kept pure in all tests by passing `now` (a Date with a
 * controlled hour) and `rotationIndex` explicitly, avoiding any localStorage
 * or system-clock side effects.
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getMessage, DEFAULT_MESSAGES } from '../motivationEngine';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a Date whose getHours() returns the given hour. */
function dateWithHour(hour: number): Date {
  const d = new Date();
  d.setHours(hour, 0, 0, 0);
  return d;
}

/** A neutral hour that triggers no prefix (e.g. 14 = 2 pm). */
const NEUTRAL_HOUR = 14;
const NEUTRAL_NOW = dateWithHour(NEUTRAL_HOUR);

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('motivationEngine — unit tests', () => {
  // Rule 1: streak >= 3
  it('returns "on fire" message when streak >= 3', () => {
    const msg = getMessage({ streak: 3, doneTasks: 0, overdueTasks: 0, now: NEUTRAL_NOW, rotationIndex: 0 });
    expect(msg).toContain('on fire');
  });

  it('returns "on fire" message when streak is well above 3', () => {
    const msg = getMessage({ streak: 10, doneTasks: 5, overdueTasks: 5, now: NEUTRAL_NOW, rotationIndex: 0 });
    expect(msg).toContain('on fire');
  });

  // Rule 2: doneTasks > overdueTasks (streak < 3)
  it('returns "improving" message when streak < 3 and doneTasks > overdueTasks', () => {
    const msg = getMessage({ streak: 2, doneTasks: 5, overdueTasks: 2, now: NEUTRAL_NOW, rotationIndex: 0 });
    expect(msg).toContain('improving');
  });

  it('returns "improving" message when streak is 0 and doneTasks > overdueTasks', () => {
    const msg = getMessage({ streak: 0, doneTasks: 1, overdueTasks: 0, now: NEUTRAL_NOW, rotationIndex: 0 });
    expect(msg).toContain('improving');
  });

  // Rule 3: overdueTasks > 0 (streak < 3, doneTasks <= overdueTasks)
  it('returns "back on track" message when streak < 3, doneTasks <= overdueTasks, overdueTasks > 0', () => {
    const msg = getMessage({ streak: 1, doneTasks: 2, overdueTasks: 3, now: NEUTRAL_NOW, rotationIndex: 0 });
    expect(msg).toContain('back on track');
  });

  it('returns "back on track" when doneTasks equals overdueTasks and overdueTasks > 0', () => {
    const msg = getMessage({ streak: 0, doneTasks: 2, overdueTasks: 2, now: NEUTRAL_NOW, rotationIndex: 0 });
    expect(msg).toContain('back on track');
  });

  // Rule 4: default pool
  it('returns a default message when no rule fires', () => {
    const msg = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: NEUTRAL_NOW, rotationIndex: 0 });
    expect(DEFAULT_MESSAGES).toContain(msg);
  });

  // Time-of-day prefix — morning
  it('prefixes with "Start strong!" for morning hour (8)', () => {
    const msg = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: dateWithHour(8), rotationIndex: 0 });
    expect(msg.startsWith('Start strong!')).toBe(true);
  });

  it('prefixes with "Start strong!" for boundary hour 5', () => {
    const msg = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: dateWithHour(5), rotationIndex: 0 });
    expect(msg.startsWith('Start strong!')).toBe(true);
  });

  it('prefixes with "Start strong!" for boundary hour 11', () => {
    const msg = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: dateWithHour(11), rotationIndex: 0 });
    expect(msg.startsWith('Start strong!')).toBe(true);
  });

  // Time-of-day prefix — evening
  it('prefixes with "Finish your tasks!" for evening hour (21)', () => {
    const msg = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: dateWithHour(21), rotationIndex: 0 });
    expect(msg.startsWith('Finish your tasks!')).toBe(true);
  });

  it('prefixes with "Finish your tasks!" for boundary hour 20', () => {
    const msg = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: dateWithHour(20), rotationIndex: 0 });
    expect(msg.startsWith('Finish your tasks!')).toBe(true);
  });

  it('prefixes with "Finish your tasks!" for boundary hour 23', () => {
    const msg = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: dateWithHour(23), rotationIndex: 0 });
    expect(msg.startsWith('Finish your tasks!')).toBe(true);
  });

  // No prefix for midday
  it('has no prefix for midday hour (14)', () => {
    const msg = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: dateWithHour(14), rotationIndex: 0 });
    expect(msg.startsWith('Start strong!')).toBe(false);
    expect(msg.startsWith('Finish your tasks!')).toBe(false);
  });

  // Rotation index cycling
  it('rotation index 0 and 1 return different default messages', () => {
    const msg0 = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: NEUTRAL_NOW, rotationIndex: 0 });
    const msg1 = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: NEUTRAL_NOW, rotationIndex: 1 });
    expect(msg0).not.toBe(msg1);
  });

  it('rotation index wraps around the pool correctly', () => {
    const poolSize = DEFAULT_MESSAGES.length;
    const msg0 = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: NEUTRAL_NOW, rotationIndex: 0 });
    const msgWrapped = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now: NEUTRAL_NOW, rotationIndex: poolSize });
    expect(msg0).toBe(msgWrapped);
  });
});

// ---------------------------------------------------------------------------
// Property-based tests
// ---------------------------------------------------------------------------

// Arbitraries
const nonNegInt = fc.nat({ max: 1_000 });

// Arbitrary for hours in [5, 11]
const morningHourArb = fc.integer({ min: 5, max: 11 });

// Arbitrary for hours in [20, 23]
const eveningHourArb = fc.integer({ min: 20, max: 23 });

// Arbitrary for neutral hours (not morning, not evening)
const neutralHourArb = fc.integer({ min: 12, max: 19 });

// ---------------------------------------------------------------------------
// Property 10a: streak >= 3 → output contains "on fire"
// Validates: Requirements 5.1 / Property 10
// ---------------------------------------------------------------------------
describe('Property 10a: streak >= 3 always produces "on fire" message', () => {
  it('for any streak >= 3, output contains "on fire" regardless of other inputs', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 3, max: 1_000 }),  // streak >= 3
        nonNegInt,                             // doneTasks
        nonNegInt,                             // overdueTasks
        neutralHourArb,                        // neutral hour (no prefix interference)
        nonNegInt,                             // rotationIndex
        (streak, doneTasks, overdueTasks, hour, rotationIndex) => {
          const msg = getMessage({
            streak,
            doneTasks,
            overdueTasks,
            now: dateWithHour(hour),
            rotationIndex,
          });
          return msg.includes('on fire');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10b: streak < 3 and doneTasks > overdueTasks → output contains "improving"
// Validates: Requirements 5.1 / Property 10
// ---------------------------------------------------------------------------
describe('Property 10b: streak < 3 and doneTasks > overdueTasks always produces "improving" message', () => {
  it('for any streak < 3 and doneTasks > overdueTasks, output contains "improving"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),  // streak < 3
        fc.integer({ min: 1, max: 500 }) // overdueTasks (at least 1 so doneTasks can be strictly greater)
          .chain((overdue) =>
            fc.tuple(
              fc.integer({ min: overdue + 1, max: overdue + 500 }), // doneTasks > overdueTasks
              fc.constant(overdue)
            )
          ),
        neutralHourArb,
        nonNegInt,
        (streak, [doneTasks, overdueTasks], hour, rotationIndex) => {
          const msg = getMessage({
            streak,
            doneTasks,
            overdueTasks,
            now: dateWithHour(hour),
            rotationIndex,
          });
          return msg.includes('improving');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('also works when overdueTasks is 0 and doneTasks > 0', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),       // streak < 3
        fc.integer({ min: 1, max: 500 }),      // doneTasks > 0
        neutralHourArb,
        nonNegInt,
        (streak, doneTasks, hour, rotationIndex) => {
          const msg = getMessage({
            streak,
            doneTasks,
            overdueTasks: 0,
            now: dateWithHour(hour),
            rotationIndex,
          });
          return msg.includes('improving');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 10c: streak < 3, doneTasks <= overdueTasks, overdueTasks > 0 → "back on track"
// Validates: Requirements 5.1 / Property 10
// ---------------------------------------------------------------------------
describe('Property 10c: streak < 3, doneTasks <= overdueTasks, overdueTasks > 0 → "back on track"', () => {
  it('for any such inputs, output contains "back on track"', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 2 }),       // streak < 3
        fc.integer({ min: 1, max: 500 })       // overdueTasks > 0
          .chain((overdue) =>
            fc.tuple(
              fc.integer({ min: 0, max: overdue }), // doneTasks <= overdueTasks
              fc.constant(overdue)
            )
          ),
        neutralHourArb,
        nonNegInt,
        (streak, [doneTasks, overdueTasks], hour, rotationIndex) => {
          const msg = getMessage({
            streak,
            doneTasks,
            overdueTasks,
            now: dateWithHour(hour),
            rotationIndex,
          });
          return msg.includes('back on track');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 11: hours in [5, 11] → output starts with "Start strong!"
// Validates: Requirements 5.3 / Property 11
// ---------------------------------------------------------------------------
describe('Property 11: morning hours [5, 11] always prefix with "Start strong!"', () => {
  it('for any inputs and now.getHours() in [5, 11], output starts with "Start strong!"', () => {
    fc.assert(
      fc.property(
        nonNegInt,       // streak
        nonNegInt,       // doneTasks
        nonNegInt,       // overdueTasks
        morningHourArb,  // hour in [5, 11]
        nonNegInt,       // rotationIndex
        (streak, doneTasks, overdueTasks, hour, rotationIndex) => {
          const msg = getMessage({
            streak,
            doneTasks,
            overdueTasks,
            now: dateWithHour(hour),
            rotationIndex,
          });
          return msg.startsWith('Start strong!');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 12: hours in [20, 23] → output starts with "Finish your tasks!"
// Validates: Requirements 5.4 / Property 12
// ---------------------------------------------------------------------------
describe('Property 12: evening hours [20, 23] always prefix with "Finish your tasks!"', () => {
  it('for any inputs and now.getHours() in [20, 23], output starts with "Finish your tasks!"', () => {
    fc.assert(
      fc.property(
        nonNegInt,       // streak
        nonNegInt,       // doneTasks
        nonNegInt,       // overdueTasks
        eveningHourArb,  // hour in [20, 23]
        nonNegInt,       // rotationIndex
        (streak, doneTasks, overdueTasks, hour, rotationIndex) => {
          const msg = getMessage({
            streak,
            doneTasks,
            overdueTasks,
            now: dateWithHour(hour),
            rotationIndex,
          });
          return msg.startsWith('Finish your tasks!');
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ---------------------------------------------------------------------------
// Property 13: consecutive rotation indices produce different default messages
// Validates: Requirements 5.5 / Property 13
// ---------------------------------------------------------------------------
describe('Property 13: consecutive rotation indices produce different default messages', () => {
  it('for any n where no rule fires, getMessage(n) !== getMessage(n+1)', () => {
    // We need DEFAULT_MESSAGES.length > 1 for this to hold.
    // The pool has 4 messages, so consecutive indices always differ
    // (as long as n % 4 !== (n+1) % 4, which is always true).
    fc.assert(
      fc.property(
        // Generate rotation indices that won't wrap to the same message
        // i.e., avoid n where (n % poolSize) === ((n+1) % poolSize) — impossible for pool > 1
        fc.nat({ max: 10_000 }),
        neutralHourArb,
        (n, hour) => {
          const now = dateWithHour(hour);
          // No rule fires: streak=0, doneTasks=0, overdueTasks=0
          const msgN = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now, rotationIndex: n });
          const msgN1 = getMessage({ streak: 0, doneTasks: 0, overdueTasks: 0, now, rotationIndex: n + 1 });
          return msgN !== msgN1;
        }
      ),
      { numRuns: 100 }
    );
  });
});
