/**
 * Returns true if the given date is strictly after the current time.
 */
export function isFuture(date: Date): boolean {
  return date.getTime() > Date.now();
}

/**
 * Formats an ISO 8601 string into a human-readable format.
 * Example output: "Mon, Apr 30 at 3:00 PM"
 */
export function formatDueTime(iso: string): string {
  const date = new Date(iso);
  const datePart = date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
  const timePart = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  return `${datePart} at ${timePart}`;
}
