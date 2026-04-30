/**
 * Feature: smart-motivation-task-reminder
 * Tests for taskService — unit tests and property-based tests.
 *
 * Mock strategy: vi.mock('@supabase/supabase-js') to intercept createClient
 * and return a fully-controlled mock client. We use vi.hoisted() so that
 * mock variables are available when the vi.mock factory runs (which is hoisted
 * to the top of the file by Vitest's transform).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Declare mocks with vi.hoisted so they are available inside vi.mock factory
// ---------------------------------------------------------------------------

const {
  mockSingle,
  mockSelect,
  mockOrder,
  mockInsert,
  mockUpdate,
  mockEq,
  mockFrom,
  queryBuilder,
} = vi.hoisted(() => {
  const mockSingle = vi.fn();
  const mockSelect = vi.fn();
  const mockOrder = vi.fn();
  const mockInsert = vi.fn();
  const mockUpdate = vi.fn();
  const mockEq = vi.fn();

  const queryBuilder: Record<string, ReturnType<typeof vi.fn>> = {
    select: mockSelect,
    order: mockOrder,
    insert: mockInsert,
    update: mockUpdate,
    eq: mockEq,
    single: mockSingle,
  };

  // Wire up chaining: each builder method returns the builder itself
  mockSelect.mockReturnValue(queryBuilder);
  mockOrder.mockReturnValue(queryBuilder);
  mockInsert.mockReturnValue(queryBuilder);
  mockUpdate.mockReturnValue(queryBuilder);
  mockEq.mockReturnValue(queryBuilder);

  const mockFrom = vi.fn().mockReturnValue(queryBuilder);

  return { mockSingle, mockSelect, mockOrder, mockInsert, mockUpdate, mockEq, mockFrom, queryBuilder };
});

// ---------------------------------------------------------------------------
// Mock @supabase/supabase-js BEFORE importing anything that uses it
// ---------------------------------------------------------------------------

vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    from: mockFrom,
  })),
}));

// ---------------------------------------------------------------------------
// Now import the service (it will use the mocked supabase client)
// ---------------------------------------------------------------------------
import {
  fetchTasks,
  addTask,
  markDone,
  getTask,
  TaskServiceError,
  ValidationError,
} from '../taskService';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makePendingTask(overrides: Partial<{
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'done';
  created_at: string;
  due_time: string;
  streak: number;
}> = {}) {
  return {
    id: 'test-uuid-1234',
    title: 'Test Task',
    description: 'A test task',
    status: 'pending' as const,
    created_at: new Date().toISOString(),
    due_time: new Date(Date.now() + 3_600_000).toISOString(),
    streak: 0,
    ...overrides,
  };
}

/** Returns an ISO string for a time in the future (offset ms from now). */
function futureISO(offsetMs = 3_600_000): string {
  return new Date(Date.now() + offsetMs).toISOString();
}

/** Returns an ISO string for a time in the past (offset ms before now). */
function pastISO(offsetMs = 3_600_000): string {
  return new Date(Date.now() - offsetMs).toISOString();
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();

  // Re-wire chaining after clearAllMocks resets all mock implementations
  mockSelect.mockReturnValue(queryBuilder);
  mockOrder.mockReturnValue(queryBuilder);
  mockInsert.mockReturnValue(queryBuilder);
  mockUpdate.mockReturnValue(queryBuilder);
  mockEq.mockReturnValue(queryBuilder);
  mockFrom.mockReturnValue(queryBuilder);
});

// ===========================================================================
// fetchTasks
// ===========================================================================

describe('fetchTasks', () => {
  it('returns tasks ordered by due_time ascending', async () => {
    const tasks = [
      makePendingTask({ id: '1', due_time: futureISO(1_000) }),
      makePendingTask({ id: '2', due_time: futureISO(2_000) }),
      makePendingTask({ id: '3', due_time: futureISO(3_000) }),
    ];

    mockOrder.mockResolvedValueOnce({ data: tasks, error: null });

    const result = await fetchTasks();

    expect(result).toEqual(tasks);
    expect(mockFrom).toHaveBeenCalledWith('tasks');
    expect(mockOrder).toHaveBeenCalledWith('due_time', { ascending: true });
  });

  it('returns empty array when no tasks exist', async () => {
    mockOrder.mockResolvedValueOnce({ data: [], error: null });

    const result = await fetchTasks();
    expect(result).toEqual([]);
  });

  it('throws TaskServiceError when Supabase returns an error', async () => {
    // Set up two mock values — one for each assertion's fetchTasks() call
    mockOrder
      .mockResolvedValueOnce({ data: null, error: { message: 'connection refused' } })
      .mockResolvedValueOnce({ data: null, error: { message: 'connection refused' } });

    await expect(fetchTasks()).rejects.toThrow(TaskServiceError);
    await expect(fetchTasks()).rejects.toThrow('Failed to fetch tasks');
  });

  // Property 5: fetchTasks result is always ordered by due_time ascending
  // Validates: Requirements 2.2 / Property 5
  it('Property 5: fetchTasks result is always ordered by due_time ascending', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate an array of 0–10 tasks with random future due_times
        fc.array(
          fc.record({
            id: fc.uuid(),
            title: fc.string({ minLength: 1 }),
            description: fc.option(fc.string(), { nil: undefined }),
            status: fc.constant('pending' as const),
            created_at: fc.constant(new Date().toISOString()),
            due_time: fc
              .integer({ min: Date.now() + 1_000, max: Date.now() + 1_000_000_000 })
              .map((ts) => new Date(ts).toISOString()),
            streak: fc.nat(),
          }),
          { maxLength: 10 }
        ),
        async (tasks) => {
          // Sort the tasks as the DB would (ascending due_time)
          const sorted = [...tasks].sort(
            (a, b) => new Date(a.due_time).getTime() - new Date(b.due_time).getTime()
          );

          mockOrder.mockResolvedValueOnce({ data: sorted, error: null });

          const result = await fetchTasks();

          // Verify ordering invariant
          for (let i = 0; i < result.length - 1; i++) {
            const curr = new Date(result[i].due_time).getTime();
            const next = new Date(result[i + 1].due_time).getTime();
            if (curr > next) return false;
          }
          return true;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// addTask — validation
// ===========================================================================

describe('addTask — validation', () => {
  it('throws ValidationError for empty title', async () => {
    await expect(
      addTask({ title: '', due_time: futureISO() })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for whitespace-only title', async () => {
    await expect(
      addTask({ title: '   ', due_time: futureISO() })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for tab-only title', async () => {
    await expect(
      addTask({ title: '\t\n ', due_time: futureISO() })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for past due_time', async () => {
    await expect(
      addTask({ title: 'Valid Title', due_time: pastISO() })
    ).rejects.toThrow(ValidationError);
  });

  it('throws ValidationError for due_time exactly in the past', async () => {
    const past = new Date(Date.now() - 1).toISOString();
    await expect(
      addTask({ title: 'Valid Title', due_time: past })
    ).rejects.toThrow(ValidationError);
  });

  // Property 2: for any whitespace-only or empty title, addTask throws ValidationError
  // Validates: Requirements 1.3 / Property 2
  it('Property 2: for any whitespace-only or empty title, addTask throws ValidationError', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate strings that are empty or contain only whitespace
        fc.oneof(
          fc.constant(''),
          fc.stringOf(fc.constantFrom(' ', '\t', '\n', '\r'), { minLength: 1, maxLength: 20 })
        ),
        async (title) => {
          try {
            await addTask({ title, due_time: futureISO() });
            return false; // Should have thrown
          } catch (err) {
            return err instanceof ValidationError;
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Property 3: for any past timestamp as due_time, addTask throws ValidationError
  // Validates: Requirements 1.4 / Property 3
  it('Property 3: for any past timestamp as due_time, addTask throws ValidationError', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate timestamps strictly in the past
        fc.integer({ min: 0, max: Date.now() - 1 }),
        async (ts) => {
          const pastDue = new Date(ts).toISOString();
          try {
            await addTask({ title: 'Valid Title', due_time: pastDue });
            return false; // Should have thrown
          } catch (err) {
            return err instanceof ValidationError;
          }
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// addTask — success path
// ===========================================================================

describe('addTask — success', () => {
  it('returns task with status=pending and streak=0 for valid inputs', async () => {
    const expectedTask = makePendingTask({ status: 'pending', streak: 0 });
    mockSingle.mockResolvedValueOnce({ data: expectedTask, error: null });

    const result = await addTask({
      title: 'Test Task',
      due_time: futureISO(),
    });

    expect(result.status).toBe('pending');
    expect(result.streak).toBe(0);
  });

  it('calls Supabase insert with status=pending and streak=0', async () => {
    const expectedTask = makePendingTask({ status: 'pending', streak: 0 });
    mockSingle.mockResolvedValueOnce({ data: expectedTask, error: null });

    await addTask({ title: 'My Task', due_time: futureISO() });

    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'pending', streak: 0 })
    );
  });

  it('throws TaskServiceError when Supabase insert fails', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { message: 'insert failed' },
    });

    await expect(
      addTask({ title: 'My Task', due_time: futureISO() })
    ).rejects.toThrow(TaskServiceError);
  });

  // Property 1: for any non-empty title and future due_time, addTask returns status='pending' and streak=0
  // Validates: Requirements 1.2 / Property 1
  it('Property 1: for any non-empty title and future due_time, addTask returns status=pending and streak=0', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Non-empty title (at least one non-whitespace character)
        fc.string({ minLength: 1 }).filter((s) => s.trim().length > 0),
        // Future due_time
        fc
          .integer({ min: Date.now() + 1_000, max: Date.now() + 1_000_000_000 })
          .map((ts) => new Date(ts).toISOString()),
        async (title, due_time) => {
          const expectedTask = makePendingTask({ title, due_time, status: 'pending', streak: 0 });
          mockSingle.mockResolvedValueOnce({ data: expectedTask, error: null });

          const result = await addTask({ title, due_time });
          return result.status === 'pending' && result.streak === 0;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// markDone
// ===========================================================================

describe('markDone', () => {
  it('returns task with status=done and streak incremented by 1', async () => {
    const pendingTask = makePendingTask({ streak: 3 });
    const doneTask = { ...pendingTask, status: 'done' as const, streak: 4 };

    // getTask call (first single)
    mockSingle.mockResolvedValueOnce({ data: pendingTask, error: null });
    // update call (second single)
    mockSingle.mockResolvedValueOnce({ data: doneTask, error: null });

    const result = await markDone(pendingTask.id);

    expect(result.status).toBe('done');
    expect(result.streak).toBe(4);
  });

  it('calls Supabase update with status=done and streak=previous+1', async () => {
    const pendingTask = makePendingTask({ streak: 5 });
    const doneTask = { ...pendingTask, status: 'done' as const, streak: 6 };

    mockSingle.mockResolvedValueOnce({ data: pendingTask, error: null });
    mockSingle.mockResolvedValueOnce({ data: doneTask, error: null });

    await markDone(pendingTask.id);

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'done', streak: 6 })
    );
  });

  it('throws TaskServiceError when Supabase update fails', async () => {
    const pendingTask = makePendingTask({ streak: 0 });

    // getTask succeeds
    mockSingle.mockResolvedValueOnce({ data: pendingTask, error: null });
    // update fails
    mockSingle.mockResolvedValueOnce({ data: null, error: { message: 'update failed' } });

    await expect(markDone(pendingTask.id)).rejects.toThrow(TaskServiceError);
  });

  // Property 7: for any pending task with streak n (n >= 0), markDone returns streak = n + 1
  // Validates: Requirements 3.1, 3.2 / Property 7
  it('Property 7: for any pending task with streak n >= 0, markDone returns streak = n + 1', async () => {
    await fc.assert(
      fc.asyncProperty(
        // Generate a non-negative streak value
        fc.nat({ max: 1_000 }),
        async (streak) => {
          const pendingTask = makePendingTask({ streak, status: 'pending' });
          const doneTask = { ...pendingTask, status: 'done' as const, streak: streak + 1 };

          mockSingle.mockResolvedValueOnce({ data: pendingTask, error: null });
          mockSingle.mockResolvedValueOnce({ data: doneTask, error: null });

          const result = await markDone(pendingTask.id);
          return result.status === 'done' && result.streak === streak + 1;
        }
      ),
      { numRuns: 100 }
    );
  });
});

// ===========================================================================
// getTask
// ===========================================================================

describe('getTask', () => {
  it('returns the correct task by id', async () => {
    const task = makePendingTask({ id: 'abc-123' });
    mockSingle.mockResolvedValueOnce({ data: task, error: null });

    const result = await getTask('abc-123');

    expect(result).toEqual(task);
    expect(mockEq).toHaveBeenCalledWith('id', 'abc-123');
  });

  it('throws TaskServiceError when task is not found (PGRST116)', async () => {
    // Set up two mock values — one for each assertion's getTask() call
    mockSingle
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'Row not found' } })
      .mockResolvedValueOnce({ data: null, error: { code: 'PGRST116', message: 'Row not found' } });

    await expect(getTask('nonexistent-id')).rejects.toThrow(TaskServiceError);
    await expect(getTask('nonexistent-id')).rejects.toThrow('Task not found');
  });

  it('throws TaskServiceError on generic Supabase error', async () => {
    mockSingle.mockResolvedValueOnce({
      data: null,
      error: { code: 'PGRST500', message: 'internal error' },
    });

    await expect(getTask('some-id')).rejects.toThrow(TaskServiceError);
  });
});
