import { LocalNotifications } from '@capacitor/local-notifications';
import { Task } from '../types/index';

/**
 * Converts a UUID string to a numeric notification ID.
 * Uses a simple hash: sum of char codes modulo 2^31.
 */
function uuidToNumericId(uuid: string): number {
  let sum = 0;
  for (let i = 0; i < uuid.length; i++) {
    sum = (sum + uuid.charCodeAt(i)) % 2147483648; // 2^31
  }
  return sum;
}

export interface NotificationService {
  requestPermission(): Promise<boolean>;
  scheduleReminder(task: Task): Promise<void>;
  cancelReminder(taskId: string): Promise<void>;
}

/**
 * Checks current notification permissions and requests them if not already granted.
 * Returns true if permission is granted, false otherwise.
 */
export async function requestPermission(): Promise<boolean> {
  const { display } = await LocalNotifications.checkPermissions();
  if (display === 'granted') {
    return true;
  }
  const { display: requested } = await LocalNotifications.requestPermissions();
  return requested === 'granted';
}

/**
 * Schedules a local notification reminder for the given task.
 * If permission is denied, returns without scheduling.
 * For pending tasks, also schedules a recurring notification 24 hours later.
 */
export async function scheduleReminder(task: Task): Promise<void> {
  const permitted = await requestPermission();
  if (!permitted) {
    return;
  }

  const numericId = uuidToNumericId(task.id);
  const dueTime = new Date(task.due_time);

  const notifications = [
    {
      id: numericId,
      title: task.title,
      body: 'Time to complete your task!',
      schedule: { at: dueTime },
      extra: { taskId: task.id },
    },
  ];

  // For pending recurring tasks, also schedule a second notification 24 hours later
  if (task.status === 'pending') {
    const recurringTime = new Date(dueTime.getTime() + 86400000);
    notifications.push({
      id: numericId + 1,
      title: task.title,
      body: 'Time to complete your task!',
      schedule: { at: recurringTime },
      extra: { taskId: task.id },
    });
  }

  await LocalNotifications.schedule({ notifications });
}

/**
 * Cancels the scheduled notification for the given task ID.
 */
export async function cancelReminder(taskId: string): Promise<void> {
  const numericId = uuidToNumericId(taskId);
  await LocalNotifications.cancel({ notifications: [{ id: numericId }] });
}

// Export the hash helper for testing
export { uuidToNumericId };

const notificationService: NotificationService = {
  requestPermission,
  scheduleReminder,
  cancelReminder,
};

export default notificationService;
