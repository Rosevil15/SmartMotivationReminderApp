import { Task, DashboardStats } from '../types/index';
import { getBadgesForStreak } from './badgeHelpers';

/**
 * Computes dashboard statistics from an array of tasks.
 *
 * - totalTasks: number of tasks in the array
 * - completedTasks: count of tasks with status === 'done'
 * - currentStreak: maximum streak value across all tasks (0 for empty array)
 * - motivationScore: Math.round((completedTasks / totalTasks) * 100), or 0 for empty array
 * - badges: badge array derived from currentStreak via getBadgesForStreak
 */
export function computeDashboardStats(tasks: Task[]): DashboardStats {
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === 'done').length;
  const currentStreak = tasks.length > 0 ? Math.max(...tasks.map((t) => t.streak)) : 0;
  const motivationScore =
    totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const badges = getBadgesForStreak(currentStreak);

  return {
    totalTasks,
    completedTasks,
    currentStreak,
    motivationScore,
    badges,
  };
}
