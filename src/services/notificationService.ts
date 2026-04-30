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

/**
 * Detects whether the app is running inside a native Capacitor container
 * (i.e. a real iOS/Android app) vs. a plain web browser.
 */
function isNative(): boolean {
  return (
    typeof (window as unknown as Record<string, unknown>).Capacitor !== 'undefined' &&
    (window as unknown as { Capacitor: { isNativePlatform: () => boolean } }).Capacitor
      .isNativePlatform()
  );
}

// ---------------------------------------------------------------------------
// Web Notification helpers (browser fallback)
// ---------------------------------------------------------------------------

/** Map of taskId → setTimeout handle for web reminders. */
const webTimers = new Map<string, ReturnType<typeof setTimeout>>();

async function webRequestPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

function webScheduleReminder(task: Task): void {
  const dueTime = new Date(task.due_time).getTime();
  const delay = dueTime - Date.now();

  // Only schedule if the due time is in the future (within 24 h for browser timers)
  if (delay <= 0) return;

  // Clear any existing timer for this task
  const existing = webTimers.get(task.id);
  if (existing !== undefined) clearTimeout(existing);

  const handle = setTimeout(() => {
    if (Notification.permission === 'granted') {
      new Notification(task.title, {
        body: 'Time to complete your task! ⏰',
        icon: '/favicon.ico',
        tag: task.id, // prevents duplicate notifications
      });
    }
    webTimers.delete(task.id);
  }, delay);

  webTimers.set(task.id, handle);
}

function webCancelReminder(taskId: string): void {
  const handle = webTimers.get(taskId);
  if (handle !== undefined) {
    clearTimeout(handle);
    webTimers.delete(taskId);
  }
}

// ---------------------------------------------------------------------------
// Public API — auto-selects native (Capacitor) or web (browser)
// ---------------------------------------------------------------------------

export interface NotificationService {
  requestPermission(): Promise<boolean>;
  scheduleReminder(task: Task): Promise<void>;
  cancelReminder(taskId: string): Promise<void>;
}

/**
 * Requests notification permission.
 * Uses Capacitor LocalNotifications on native, Web Notifications API in browser.
 */
export async function requestPermission(): Promise<boolean> {
  if (isNative()) {
    // Dynamically import Capacitor plugin only when running natively
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const { display } = await LocalNotifications.checkPermissions();
    if (display === 'granted') return true;
    const { display: requested } = await LocalNotifications.requestPermissions();
    return requested === 'granted';
  }

  return webRequestPermission();
}

/**
 * Schedules a reminder notification for the given task.
 * - Native: uses Capacitor LocalNotifications (exact scheduled time, works in background)
 * - Browser: uses Web Notifications API + setTimeout (only fires while tab is open)
 */
export async function scheduleReminder(task: Task): Promise<void> {
  const permitted = await requestPermission();
  if (!permitted) return;

  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
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

    if (task.status === 'pending') {
      notifications.push({
        id: numericId + 1,
        title: task.title,
        body: 'Time to complete your task!',
        schedule: { at: new Date(dueTime.getTime() + 86400000) },
        extra: { taskId: task.id },
      });
    }

    await LocalNotifications.schedule({ notifications });
  } else {
    webScheduleReminder(task);
  }
}

/**
 * Cancels a scheduled reminder for the given task ID.
 */
export async function cancelReminder(taskId: string): Promise<void> {
  if (isNative()) {
    const { LocalNotifications } = await import('@capacitor/local-notifications');
    const numericId = uuidToNumericId(taskId);
    await LocalNotifications.cancel({ notifications: [{ id: numericId }] });
  } else {
    webCancelReminder(taskId);
  }
}

// Export the hash helper for testing
export { uuidToNumericId };

const notificationService: NotificationService = {
  requestPermission,
  scheduleReminder,
  cancelReminder,
};

export default notificationService;
