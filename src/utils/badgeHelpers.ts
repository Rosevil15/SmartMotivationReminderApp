import { Badge } from '../types';

const BADGE_MILESTONES: Array<{ milestone: 3 | 7 | 30; label: string }> = [
  { milestone: 3, label: '3-Day Streak' },
  { milestone: 7, label: '7-Day Streak' },
  { milestone: 30, label: '30-Day Streak' },
];

/**
 * Returns an array of Badge objects for the given streak value.
 * A badge is earned (earned=true) for each milestone that is <= streak.
 * Badges for milestones > streak have earned=false.
 *
 * Property 15: for any streak s, earned badges are exactly the milestones
 * in {3, 7, 30} that are <= s.
 */
export function getBadgesForStreak(streak: number): Badge[] {
  return BADGE_MILESTONES.map((bm) => ({
    milestone: bm.milestone,
    label: bm.label,
    earned: streak >= bm.milestone,
  }));
}
