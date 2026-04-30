import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { computeDashboardStats } from '../../utils/dashboardStats';
import { Task } from '../../types/index';

// Feature: smart-motivation-task-reminder, Property 14: Dashboard stats are always computed correctly from task array

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'test-id',
    title: 'Test Task',
    description: undefined,
    status: 'pending',
    created_at: new Date().toISOString(),
    due_time: new Date(Date.now() + 3600000).toISOString(),
    streak: 0,
    ...overrides,
  };
}

// Task arbitrary for property-based tests
const taskArb = fc.record({
  id: fc.uuid(),
  title: fc.string({ minLength: 1 }),
  description: fc.option(fc.string(), { nil: undefined }),
  status: fc.constantFrom('pending' as const, 'done' as const),
  created_at: fc.constant(new Date().toISOString()),
  due_time: fc.constant(new Date(Date.now() + 3600000).toISOString()),
  streak: fc.nat({ max: 100 }),
});

// ---------------------------------------------------------------------------
// Unit tests
// ---------------------------------------------------------------------------

describe('computeDashboardStats', () => {
  it('empty array returns all zeros and no earned badges', () => {
    const stats = computeDashboardStats([]);
    expect(stats.totalTasks).toBe(0);
    expect(stats.completedTasks).toBe(0);
    expect(stats.currentStreak).toBe(0);
    expect(stats.motivationScore).toBe(0);
    expect(stats.badges).toHaveLength(3);
    expect(stats.badges.every((b) => !b.earned)).toBe(true);
  });

  it('all pending tasks: completedTasks=0, motivationScore=0', () => {
    const tasks = [
      makeTask({ status: 'pending', streak: 1 }),
      makeTask({ status: 'pending', streak: 2 }),
      makeTask({ status: 'pending', streak: 3 }),
    ];
    const stats = computeDashboardStats(tasks);
    expect(stats.totalTasks).toBe(3);
    expect(stats.completedTasks).toBe(0);
    expect(stats.motivationScore).toBe(0);
  });

  it('all done tasks: completedTasks=n, motivationScore=100', () => {
    const tasks = [
      makeTask({ status: 'done', streak: 5 }),
      makeTask({ status: 'done', streak: 10 }),
    ];
    const stats = computeDashboardStats(tasks);
    expect(stats.totalTasks).toBe(2);
    expect(stats.completedTasks).toBe(2);
    expect(stats.motivationScore).toBe(100);
  });

  it('mixed tasks: correct counts', () => {
    const tasks = [
      makeTask({ status: 'done', streak: 2 }),
      makeTask({ status: 'pending', streak: 0 }),
      makeTask({ status: 'done', streak: 7 }),
      makeTask({ status: 'pending', streak: 1 }),
    ];
    const stats = computeDashboardStats(tasks);
    expect(stats.totalTasks).toBe(4);
    expect(stats.completedTasks).toBe(2);
    expect(stats.currentStreak).toBe(7);
    expect(stats.motivationScore).toBe(50);
  });

  it('motivationScore rounds correctly: 1/3 → 33', () => {
    const tasks = [
      makeTask({ status: 'done', streak: 0 }),
      makeTask({ status: 'pending', streak: 0 }),
      makeTask({ status: 'pending', streak: 0 }),
    ];
    const stats = computeDashboardStats(tasks);
    expect(stats.motivationScore).toBe(33);
  });

  it('motivationScore rounds correctly: 2/3 → 67', () => {
    const tasks = [
      makeTask({ status: 'done', streak: 0 }),
      makeTask({ status: 'done', streak: 0 }),
      makeTask({ status: 'pending', streak: 0 }),
    ];
    const stats = computeDashboardStats(tasks);
    expect(stats.motivationScore).toBe(67);
  });

  it('currentStreak is the max streak across all tasks', () => {
    const tasks = [
      makeTask({ streak: 3 }),
      makeTask({ streak: 15 }),
      makeTask({ streak: 7 }),
    ];
    const stats = computeDashboardStats(tasks);
    expect(stats.currentStreak).toBe(15);
  });

  it('badges reflect the currentStreak', () => {
    const tasks = [makeTask({ streak: 7 })];
    const stats = computeDashboardStats(tasks);
    const earnedMilestones = stats.badges
      .filter((b) => b.earned)
      .map((b) => b.milestone);
    expect(earnedMilestones).toContain(3);
    expect(earnedMilestones).toContain(7);
    expect(earnedMilestones).not.toContain(30);
  });

  // ---------------------------------------------------------------------------
  // Property-based tests
  // ---------------------------------------------------------------------------

  // Property 14a: totalTasks equals array length
  // Validates: Requirements 6.1
  describe('Property 14a: totalTasks equals array length', () => {
    it('property: totalTasks always equals tasks.length', () => {
      fc.assert(
        fc.property(fc.array(taskArb), (tasks) => {
          const stats = computeDashboardStats(tasks);
          return stats.totalTasks === tasks.length;
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 14b: completedTasks equals count of tasks with status='done'
  // Validates: Requirements 6.2
  describe('Property 14b: completedTasks equals count of done tasks', () => {
    it('property: completedTasks always equals count of tasks with status=done', () => {
      fc.assert(
        fc.property(fc.array(taskArb), (tasks) => {
          const stats = computeDashboardStats(tasks);
          const expectedCompleted = tasks.filter((t) => t.status === 'done').length;
          return stats.completedTasks === expectedCompleted;
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 14c: currentStreak equals max streak value (or 0 for empty)
  // Validates: Requirements 6.3
  describe('Property 14c: currentStreak equals max streak (or 0 for empty)', () => {
    it('property: currentStreak always equals max streak or 0 for empty', () => {
      fc.assert(
        fc.property(fc.array(taskArb), (tasks) => {
          const stats = computeDashboardStats(tasks);
          const expectedStreak =
            tasks.length > 0 ? Math.max(...tasks.map((t) => t.streak)) : 0;
          return stats.currentStreak === expectedStreak;
        }),
        { numRuns: 100 }
      );
    });
  });

  // Property 14d: motivationScore equals Math.round((completedTasks/totalTasks)*100) or 0
  // Validates: Requirements 6.4
  describe('Property 14d: motivationScore is correctly computed', () => {
    it('property: motivationScore equals Math.round((completed/total)*100) or 0 for empty', () => {
      fc.assert(
        fc.property(fc.array(taskArb), (tasks) => {
          const stats = computeDashboardStats(tasks);
          const completedTasks = tasks.filter((t) => t.status === 'done').length;
          const totalTasks = tasks.length;
          const expectedScore =
            totalTasks === 0
              ? 0
              : Math.round((completedTasks / totalTasks) * 100);
          return stats.motivationScore === expectedScore;
        }),
        { numRuns: 100 }
      );
    });
  });
});
