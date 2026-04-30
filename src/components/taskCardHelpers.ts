import { checkmarkCircle, timeOutline } from 'ionicons/icons';

/**
 * Returns the icon name for a given task status.
 * - 'done'    → checkmarkCircle (green)
 * - 'pending' → timeOutline (orange)
 */
export function getStatusIcon(status: 'pending' | 'done'): string {
  return status === 'done' ? checkmarkCircle : timeOutline;
}

/**
 * Returns the Ionic color string for a given task status.
 * - 'done'    → 'success' (green)
 * - 'pending' → 'warning' (orange)
 */
export function getStatusColor(status: 'pending' | 'done'): string {
  return status === 'done' ? 'success' : 'warning';
}
