import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { getBadgesForStreak } from '../../utils/badgeHelpers';

// Feature: smart-motivation-task-reminder, Property 15: Badge awards exactly match earned milestones

const MILESTONES = [3, 7, 30] as const;

describe('getBadgesForStreak', () => {
  it('returns no earned badges for streak 0', () => {
    const badges = getBadgesForStreak(0);
    const earned = badges.filter((b) => b.earned);
    expect(earned).toHaveLength(0);
  });

  it('returns no earned badges for streak 2', () => {
    const badges = getBadgesForStreak(2);
    const earned = badges.filter((b) => b.earned);
    expect(earned).toHaveLength(0);
  });

  it('returns 1 earned badge for streak 3', () => {
    const badges = getBadgesForStreak(3);
    const earned = badges.filter((b) => b.earned);
    expect(earned).toHaveLength(1);
    expect(earned[0].milestone).toBe(3);
  });

  it('returns 2 earned badges for streak 7', () => {
    const badges = getBadgesForStreak(7);
    const earned = badges.filter((b) => b.earned);
    expect(earned).toHaveLength(2);
    expect(earned.map((b) => b.milestone)).toContain(3);
    expect(earned.map((b) => b.milestone)).toContain(7);
  });

  it('returns all 3 earned badges for streak 30', () => {
    const badges = getBadgesForStreak(30);
    const earned = badges.filter((b) => b.earned);
    expect(earned).toHaveLength(3);
  });

  it('returns all 3 earned badges for streak > 30', () => {
    const badges = getBadgesForStreak(100);
    const earned = badges.filter((b) => b.earned);
    expect(earned).toHaveLength(3);
  });

  it('always returns exactly 3 badge objects total', () => {
    expect(getBadgesForStreak(0)).toHaveLength(3);
    expect(getBadgesForStreak(5)).toHaveLength(3);
    expect(getBadgesForStreak(30)).toHaveLength(3);
  });

  // Property 15: for any streak s, earned badges are exactly the milestones
  // in {3, 7, 30} that are <= s
  // Validates: Requirements 7.1, 7.2, 7.3, 7.4
  describe('Property 15: earned badges exactly match milestones <= streak', () => {
    it('property: earned badges are exactly milestones <= streak', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (streak) => {
          const badges = getBadgesForStreak(streak);

          // Every milestone that is <= streak must be earned
          for (const milestone of MILESTONES) {
            const badge = badges.find((b) => b.milestone === milestone);
            if (!badge) return false;
            if (milestone <= streak && !badge.earned) return false;
            if (milestone > streak && badge.earned) return false;
          }

          // Earned badges count must equal number of milestones <= streak
          const expectedEarnedCount = MILESTONES.filter((m) => m <= streak).length;
          const actualEarnedCount = badges.filter((b) => b.earned).length;
          return actualEarnedCount === expectedEarnedCount;
        }),
        { numRuns: 100 }
      );
    });

    it('property: no badge is awarded for a milestone not yet reached', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (streak) => {
          const badges = getBadgesForStreak(streak);
          const earnedMilestones = badges
            .filter((b) => b.earned)
            .map((b) => b.milestone);
          return earnedMilestones.every((m) => m <= streak);
        }),
        { numRuns: 100 }
      );
    });

    it('property: no earned badge is omitted for reached milestones', () => {
      fc.assert(
        fc.property(fc.integer({ min: 0, max: 100 }), (streak) => {
          const badges = getBadgesForStreak(streak);
          const reachedMilestones = MILESTONES.filter((m) => m <= streak);
          return reachedMilestones.every((m) =>
            badges.some((b) => b.milestone === m && b.earned)
          );
        }),
        { numRuns: 100 }
      );
    });
  });
});
