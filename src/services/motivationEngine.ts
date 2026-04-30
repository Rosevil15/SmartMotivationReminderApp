/**
 * Feature: smart-motivation-task-reminder
 * motivationEngine.ts — Pure function motivation message generator.
 *
 * Evaluates rule priority and applies a time-of-day prefix to produce
 * a contextual motivational message.
 */

// ---------------------------------------------------------------------------
// Default message pool (exported for testing)
// ---------------------------------------------------------------------------

export const DEFAULT_MESSAGES: readonly string[] = [
  "Every task completed is a step forward.",
  "Small progress is still progress.",
  "You've got this — one task at a time.",
  "Consistency beats perfection.",
];

// ---------------------------------------------------------------------------
// localStorage keys for rotation persistence
// ---------------------------------------------------------------------------

const ROTATION_DATE_KEY = 'motivationRotationDate';
const ROTATION_INDEX_KEY = 'motivationRotationIndex';

// ---------------------------------------------------------------------------
// Helper: resolve rotation index
// ---------------------------------------------------------------------------

function resolveRotationIndex(rotationIndex?: number): number {
  if (rotationIndex !== undefined) {
    return rotationIndex;
  }

  // Read from localStorage
  const today = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  try {
    const storedDate = localStorage.getItem(ROTATION_DATE_KEY);
    const storedIndex = localStorage.getItem(ROTATION_INDEX_KEY);

    if (storedDate === today && storedIndex !== null) {
      const parsed = parseInt(storedIndex, 10);
      if (!isNaN(parsed)) {
        return parsed;
      }
    }

    // Date mismatch or missing — reset to 0
    localStorage.setItem(ROTATION_DATE_KEY, today);
    localStorage.setItem(ROTATION_INDEX_KEY, '0');
    return 0;
  } catch {
    // localStorage unavailable (e.g., SSR or private browsing restrictions)
    return 0;
  }
}

// ---------------------------------------------------------------------------
// getMessage — core pure function (pure when rotationIndex is explicitly passed)
// ---------------------------------------------------------------------------

export function getMessage(params: {
  streak: number;
  doneTasks: number;
  overdueTasks: number;
  now?: Date;
  rotationIndex?: number;
}): string {
  const { streak, doneTasks, overdueTasks, now = new Date(), rotationIndex } = params;

  // Step 1: Rule evaluation (priority order)
  let base: string;

  if (streak >= 3) {
    base = "You're on fire 🔥 Keep going!";
  } else if (doneTasks > overdueTasks) {
    base = "Great job! You're improving 💪";
  } else if (overdueTasks > 0) {
    base = "Let's get back on track today!";
  } else {
    const idx = resolveRotationIndex(rotationIndex);
    base = DEFAULT_MESSAGES[idx % DEFAULT_MESSAGES.length];
  }

  // Step 2: Time-of-day prefix
  const hour = now.getHours();

  if (hour >= 5 && hour <= 11) {
    return `Start strong! ${base}`;
  } else if (hour >= 20 && hour <= 23) {
    return `Finish your tasks! ${base}`;
  }

  return base;
}

// ---------------------------------------------------------------------------
// MotivationEngine interface implementation (default export)
// ---------------------------------------------------------------------------

const motivationEngine = { getMessage };

export default motivationEngine;
