/**
 * Feature: smart-motivation-task-reminder
 * Tests for notificationService — unit tests and property-based tests.
 *
 * Mock strategy: vi.mock('@capacitor/local-notifications') to intercept
 * LocalNotifications calls. We use vi.hoisted() so mock variables are
 * available when the vi.mock factory runs.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// ---------------------------------------------------------------------------
// Declare mocks with vi.hoisted so they are available inside vi.mock factory
// ---------------------------------------------------------------------------

const { mockCheckPermissions, mockRequestPermissions, mockSchedule, mockCancel } = vi.hoisted(
  () => {
    const mockCheckPermissions = vi.fn();
    const mockRequestPermissions = vi.fn();
    const mockSchedule = vi.fn();
    const mockCancel = vi.fn();
    return { mockCheckPermissions, mockRequestPermissions, mockSchedule, mockCancel };
  }
);

// ---------------------------------------------------------------------------
// Mock @capacitor/local-notifications BEFORE importing anything that uses it
// ---------------------------------------------------------------------------

vi.mock('@capacitor/local-notifications', () => ({
  LocalNotifications: {
    checkPermissions: mockCheckPermissions,
    requestPermissions: mockRequestPermissions,
    schedule: mockSchedule,
    cancel: mockCancel,
  },
}));

// ---------------------------------------------------------------------------
// Now import the service (it will use the mocked LocalNotifications)
// ---------------------------------------------------------------------------

import {
  requestPermission,
  scheduleReminder,
  cancelReminder,
  uuidToNumericId,
} from '../notificationService';
import { Task } from '../../types/index';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    title: 'Test Task',
    description: 'A test task',
    status: 'pending',
    created_at: new Date().toISOString(),
    due_time: new Date(Date.now() + 3_600_000).toISOString(),
    streak: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Reset mocks before each test
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
  // Default: schedule and cancel resolve successfully
  mockSchedule.mockResolvedValue(undefined);
  mockCancel.mockResolvedValue(undefined);
});

// ===========================================================================
// requestPermission
// ===========================================================================

describe('requestPermission', () => {
  it('returns true when checkPermissions returns granted', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });

    const result = await requestPermission();

    expect(result).toBe(true);
    expect(mockRequestPermissions).not.toHaveBeenCalled();
  });

  it('returns false when requestPermissions returns denied', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'prompt' });
    mockRequestPermissions.mockResolvedValueOnce({ display: 'denied' });

    const result = await requestPermission();

    expect(result).toBe(false);
  });

  it('returns true when checkPermissions is not granted but requestPermissions grants', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'prompt' });
    mockRequestPermissions.mockResolvedValueOnce({ display: 'granted' });

    const result = await requestPermission();

    expect(result).toBe(true);
  });
});

// ===========================================================================
// scheduleReminder
// ===========================================================================

describe('scheduleReminder', () => {
  it('returns without scheduling when permission is denied', async () => {
    // Validates Requirement 4.5
    mockCheckPermissions.mockResolvedValueOnce({ display: 'prompt' });
    mockRequestPermissions.mockResolvedValueOnce({ display: 'denied' });

    const task = makeTask();
    await scheduleReminder(task);

    expect(mockSchedule).not.toHaveBeenCalled();
  });

  it('schedules notification with task.title when permission is granted', async () => {
    // Validates Requirements 1.5, 4.1
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });

    const task = makeTask({ title: 'My Important Task', status: 'done' });
    await scheduleReminder(task);

    expect(mockSchedule).toHaveBeenCalledOnce();
    const { notifications } = mockSchedule.mock.calls[0][0];
    expect(notifications[0].title).toBe('My Important Task');
  });

  it('includes task.id in extra for tap-to-navigate', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });

    const task = makeTask({ status: 'done' });
    await scheduleReminder(task);

    const { notifications } = mockSchedule.mock.calls[0][0];
    expect(notifications[0].extra.taskId).toBe(task.id);
  });

  it('schedules two notifications for a pending task (recurring)', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });

    const task = makeTask({ status: 'pending' });
    await scheduleReminder(task);

    const { notifications } = mockSchedule.mock.calls[0][0];
    expect(notifications).toHaveLength(2);
  });

  it('schedules one notification for a done task (no recurring)', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });

    const task = makeTask({ status: 'done' });
    await scheduleReminder(task);

    const { notifications } = mockSchedule.mock.calls[0][0];
    expect(notifications).toHaveLength(1);
  });

  it('schedules recurring notification exactly 24 hours after due_time', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });

    const dueTime = new Date(Date.now() + 3_600_000);
    const task = makeTask({ due_time: dueTime.toISOString(), status: 'pending' });
    await scheduleReminder(task);

    const { notifications } = mockSchedule.mock.calls[0][0];
    const firstAt: Date = notifications[0].schedule.at;
    const secondAt: Date = notifications[1].schedule.at;

    expect(secondAt.getTime() - firstAt.getTime()).toBe(86400000);
  });
});

// ===========================================================================
// cancelReminder
// ===========================================================================

describe('cancelReminder', () => {
  it('calls LocalNotifications.cancel with the correct numeric ID', async () => {
    // Validates Requirement 3.4
    const taskId = '550e8400-e29b-41d4-a716-446655440000';
    const expectedNumericId = uuidToNumericId(taskId);

    await cancelReminder(taskId);

    expect(mockCancel).toHaveBeenCalledOnce();
    expect(mockCancel).toHaveBeenCalledWith({
      notifications: [{ id: expectedNumericId }],
    });
  });

  it('uses the same hash function as scheduleReminder', async () => {
    mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });

    const task = makeTask({ status: 'done' });
    await scheduleReminder(task);

    const scheduledId = mockSchedule.mock.calls[0][0].notifications[0].id;

    await cancelReminder(task.id);

    const cancelledId = mockCancel.mock.calls[0][0].notifications[0].id;
    expect(cancelledId).toBe(scheduledId);
  });
});

// ===========================================================================
// Property-Based Tests
// ===========================================================================

// Arbitraries for generating valid Task objects
const taskArb = fc.record<Task>({
  id: fc.uuid(),
  title: fc.string({ minLength: 1, maxLength: 100 }).filter((s) => s.trim().length > 0),
  description: fc.option(fc.string({ maxLength: 200 }), { nil: undefined }),
  status: fc.constantFrom('pending' as const, 'done' as const),
  created_at: fc.constant(new Date().toISOString()),
  due_time: fc
    .integer({ min: Date.now() + 1_000, max: Date.now() + 1_000_000_000 })
    .map((ts) => new Date(ts).toISOString()),
  streak: fc.nat({ max: 100 }),
});

// Property 4: for any valid Task, scheduleReminder schedules a notification whose title contains task.title
// Validates: Requirements 1.5, 4.1
describe('Property 4: scheduleReminder always schedules notification with task.title', () => {
  it('for any valid Task, scheduled notification title contains task.title', async () => {
    await fc.assert(
      fc.asyncProperty(taskArb, async (task) => {
        vi.clearAllMocks();
        mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
        mockSchedule.mockResolvedValue(undefined);

        await scheduleReminder(task);

        if (!mockSchedule.mock.calls.length) return false;

        const { notifications } = mockSchedule.mock.calls[0][0];
        // The first notification's title must contain the task title
        return notifications[0].title === task.title;
      }),
      { numRuns: 100 }
    );
  });
});

// Property 9: for any due_time timestamp t and pending task, rescheduled notification is at t + 86400000ms
// Validates: Requirements 4.2
describe('Property 9: recurring notification is always exactly 24 hours after due_time', () => {
  it('for any pending task, second notification is at due_time + 86400000ms', async () => {
    const pendingTaskArb = taskArb.map((t) => ({ ...t, status: 'pending' as const }));

    await fc.assert(
      fc.asyncProperty(pendingTaskArb, async (task) => {
        vi.clearAllMocks();
        mockCheckPermissions.mockResolvedValueOnce({ display: 'granted' });
        mockSchedule.mockResolvedValue(undefined);

        await scheduleReminder(task);

        if (!mockSchedule.mock.calls.length) return false;

        const { notifications } = mockSchedule.mock.calls[0][0];
        if (notifications.length < 2) return false;

        const firstAt: Date = notifications[0].schedule.at;
        const secondAt: Date = notifications[1].schedule.at;
        const expectedDueTime = new Date(task.due_time).getTime();

        return (
          firstAt.getTime() === expectedDueTime &&
          secondAt.getTime() === expectedDueTime + 86400000
        );
      }),
      { numRuns: 100 }
    );
  });
});
