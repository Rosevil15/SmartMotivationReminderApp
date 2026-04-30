# Tasks

## Task List

- [x] 1. Project Setup and Configuration
  - [x] 1.1 Initialise Ionic React + Capacitor 6 project with TypeScript template
  - [x] 1.2 Install and pin all dependencies from the design package list (`@ionic/react`, `@ionic/react-router`, `@capacitor/core`, `@capacitor/local-notifications`, `@supabase/supabase-js`, `react-router` v5, `react-router-dom` v5, `ionicons`)
  - [x] 1.3 Install dev dependencies (`vitest`, `@vitest/coverage-v8`, `fast-check`, TypeScript types)
  - [x] 1.4 Configure `vitest.config.ts` for the project
  - [x] 1.5 Add Supabase environment variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) to `.env` and create `src/lib/supabaseClient.ts`
  - [x] 1.6 Configure Ionic CSS variables in `src/theme/variables.css` for light and dark mode theming
  - [x] 1.7 Set up `capacitor.config.ts` with app ID, app name, and web directory

- [x] 2. Database Schema
  - [x] 2.1 Create the `tasks` table in Supabase with columns: `id` (UUID PK), `title` (TEXT NOT NULL), `description` (TEXT), `status` (TEXT DEFAULT 'pending' CHECK IN ('pending','done')), `created_at` (TIMESTAMPTZ DEFAULT now()), `due_time` (TIMESTAMPTZ NOT NULL), `streak` (INT DEFAULT 0)
  - [x] 2.2 Create index `idx_tasks_due_time` on `tasks(due_time ASC)`

- [x] 3. Utilities
  - [x] 3.1 Implement `src/utils/dateHelper.ts` with helpers: `isFuture(date: Date): boolean`, `formatDueTime(iso: string): string`
  - [x] 3.2 Write unit and property-based tests for `dateHelper` in `src/utils/__tests__/dateHelper.test.ts`
    - Property: for any timestamp strictly before `Date.now()`, `isFuture` returns `false` (validates Requirement 1.4 / Property 3)
    - Property: for any timestamp strictly after `Date.now()`, `isFuture` returns `true`

- [x] 4. Service Layer — Task Service
  - [x] 4.1 Implement `src/services/taskService.ts` with `fetchTasks`, `addTask`, `markDone`, and `getTask` methods matching the `TaskService` interface in the design
  - [x] 4.2 `fetchTasks` must query Supabase ordered by `due_time` ascending
  - [x] 4.3 `addTask` must insert with `status = 'pending'` and `streak = 0`
  - [x] 4.4 `markDone` must update `status = 'done'` and `streak = streak + 1` atomically
  - [x] 4.5 All methods must throw typed errors on Supabase failure
  - [x] 4.6 Write unit tests for `taskService` in `src/services/__tests__/taskService.test.ts` with mocked `@supabase/supabase-js` client
    - Example: empty title rejected (validates Requirement 1.3 / Property 2)
    - Example: past due time rejected (validates Requirement 1.4 / Property 3)
    - Example: `addTask` returns task with `status='pending'` and `streak=0` (validates Requirement 1.2 / Property 1)
    - Example: `markDone` returns task with `status='done'` and `streak = previous + 1` (validates Requirements 3.1, 3.2 / Property 7)
    - Property: for any non-empty title and future `due_time`, `addTask` returns `status='pending'` and `streak=0` (Property 1)
    - Property: for any whitespace-only or empty title, validation rejects and does not call `addTask` (Property 2)
    - Property: for any past timestamp, validation rejects and does not call `addTask` (Property 3)
    - Property: for any pending task with streak `n`, `markDone` returns `streak = n + 1` (Property 7)
    - Property: returned task array from `fetchTasks` is always ordered by `due_time` ascending (Property 5)

- [-] 5. Service Layer — Notification Service
  - [x] 5.1 Implement `src/services/notificationService.ts` wrapping `@capacitor/local-notifications` with `requestPermission`, `scheduleReminder`, and `cancelReminder` methods matching the `NotificationService` interface
  - [x] 5.2 `scheduleReminder` must check/request permissions before scheduling; if denied, return without scheduling
  - [x] 5.3 `scheduleReminder` must convert the task UUID to a numeric notification ID
  - [x] 5.4 Notification payload must include `task.title` as the notification title and `task.id` in `extra` for tap-to-navigate
  - [x] 5.5 For a pending recurring task, `scheduleReminder` must reschedule at `due_time + 86400000 ms`
  - [x] 5.6 Write unit tests for `notificationService` in `src/services/__tests__/notificationService.test.ts` with mocked `@capacitor/local-notifications`
    - Example: permission denied → no notification scheduled (validates Requirement 4.5)
    - Example: permission granted → notification scheduled with correct title (validates Requirements 1.5, 4.1)
    - Example: `cancelReminder` calls `LocalNotifications.cancel` with correct numeric ID (validates Requirement 3.4)
    - Property: for any valid `Task`, `scheduleReminder` schedules a notification whose title contains `task.title` (Property 4)
    - Property: for any `due_time` timestamp `t` and pending recurring task, rescheduled notification is at `t + 86400000` (Property 9)

- [ ] 6. Service Layer — Motivation Engine
  - [~] 6.1 Implement `src/services/motivationEngine.ts` as a pure function `getMessage(params)` matching the `MotivationEngine` interface
  - [ ] 6.2 Implement rule priority: streak ≥ 3 → "on fire" message; doneTasks > overdueTasks → "improving" message; overdueTasks > 0 → "back on track" message; else default pool
  - [ ] 6.3 Implement time-of-day prefix: hours 5–11 → "Start strong! "; hours 20–23 → "Finish your tasks! "
  - [ ] 6.4 Implement rotation index using `localStorage` keyed by date string to cycle default messages
  - [~] 6.5 Write unit and property-based tests in `src/services/__tests__/motivationEngine.test.ts`
    - Property: for any `streak >= 3`, output contains "on fire" regardless of other inputs (Property 10)
    - Property: for any `streak < 3` and `doneTasks > overdueTasks`, output contains "improving" (Property 10)
    - Property: for any `streak < 3`, `doneTasks <= overdueTasks`, `overdueTasks > 0`, output contains "back on track" (Property 10)
    - Property: for any inputs and `now.getHours()` in [5, 11], output starts with "Start strong!" (Property 11)
    - Property: for any inputs and `now.getHours()` in [20, 23], output starts with "Finish your tasks!" (Property 12)
    - Property: consecutive rotation indices produce different default messages when no rule fires (Property 13)

- [ ] 7. App Shell and Navigation
  - [~] 7.1 Configure `src/App.tsx` with `IonApp`, `IonReactRouter`, and `IonRouterOutlet`
  - [ ] 7.2 Define routes: `/home` → `Home`, `/add-task` → `AddTask`, `/task/:id` → `TaskDetail`, `/dashboard` → `Dashboard`
  - [ ] 7.3 Add `IonTabBar` or `IonMenu` for bottom navigation between Home and Dashboard
  - [ ] 7.4 Register `LocalNotifications.addListener('localNotificationActionPerformed', ...)` in `App.tsx` on mount to navigate to `/task/:id` on notification tap (validates Requirement 4.3)

- [ ] 8. Components
  - [~] 8.1 Implement `src/components/TaskCard.tsx` accepting `task: Task` and `onMarkDone: (id: string) => void`; render title, formatted due time, and status icon; make the card tappable to navigate to `/task/:id` (validates Requirements 2.3, 8.1)
  - [~] 8.2 Implement `src/components/MotivationBox.tsx` accepting `message: string`; render as a styled `IonCard` (validates Requirement 5.6)
  - [~] 8.3 Implement `src/components/BadgeDisplay.tsx` accepting `badges: Badge[]`; render earned badge chips/icons (validates Requirements 7.1–7.4)
  - [~] 8.4 Write unit and property-based tests for components in `src/components/__tests__/`
    - Property: for any `Task`, `TaskCard` renders output containing `task.title`, formatted `due_time`, and `task.status` (Property 6)
    - Property: for any `Task`, `TaskDetail` renders output containing all five required fields (Property 16)

- [ ] 9. Dashboard Stats Computation
  - [~] 9.1 Implement `src/utils/dashboardStats.ts` with `computeDashboardStats(tasks: Task[]): DashboardStats`
  - [ ] 9.2 Compute `totalTasks`, `completedTasks`, `currentStreak` (max streak), `motivationScore` (`Math.round((completed/total)*100)` or 0), and `badges` array
  - [~] 9.3 Write unit and property-based tests in `src/components/__tests__/dashboard.test.ts`
    - Property: for any `Task[]`, `totalTasks` equals array length (Property 14)
    - Property: for any `Task[]`, `completedTasks` equals count of tasks with `status='done'` (Property 14)
    - Property: for any `Task[]`, `currentStreak` equals max `streak` value (or 0 for empty) (Property 14)
    - Property: for any `Task[]`, `motivationScore` equals `Math.round((completedTasks/totalTasks)*100)` or 0 (Property 14)
  - [~] 9.4 Write unit and property-based tests for badge award logic in `src/components/__tests__/badgeDisplay.test.ts`
    - Property: for any streak `s`, earned badges are exactly the milestones in {3, 7, 30} that are ≤ `s` (Property 15)

- [ ] 10. Pages
  - [~] 10.1 Implement `src/pages/Home.tsx` — fetch tasks via `taskService.fetchTasks`, display `IonList` of `TaskCard` components, show `MotivationBox` with engine output, show loading indicator while fetching, show error toast on failure, show empty-state message when no tasks exist (validates Requirements 2.1–2.6, 5.6)
  - [~] 10.2 Implement `src/pages/AddTask.tsx` — form with `IonInput` for title, optional description, and `IonDatetime` for due time; validate non-empty title and future due time inline; on success call `taskService.addTask` then `notificationService.scheduleReminder` then navigate to `/home`; show validation errors without submitting on failure (validates Requirements 1.1–1.6)
  - [~] 10.3 Implement `src/pages/TaskDetail.tsx` — load task via `taskService.getTask(id)`; display title, description, due time, status, and streak; provide "Mark as Done" button that calls `taskService.markDone` then `notificationService.cancelReminder`; show error toast and revert on failure; show "Task not found" with back navigation if task missing (validates Requirements 3.1–3.5, 8.1–8.3)
  - [~] 10.4 Implement `src/pages/Dashboard.tsx` — compute stats via `computeDashboardStats`; display total tasks, completed tasks, streak, motivation score, and `BadgeDisplay`; subscribe to task changes so stats update without manual refresh; show animated `IonToast` when a new badge is earned (validates Requirements 6.1–6.5, 7.1–7.5)

- [ ] 11. Notification Permission Flow
  - [~] 11.1 In `notificationService.requestPermission`, call `LocalNotifications.checkPermissions()` and `LocalNotifications.requestPermissions()` as per the design permission flow diagram
  - [~] 11.2 In `AddTask.tsx`, if `requestPermission` returns `false`, display an `IonAlert` explaining reminders will not be delivered and continue without scheduling (validates Requirements 4.4, 4.5)

- [ ] 12. UI Quality and Accessibility
  - [~] 12.1 Add `IonSpinner` loading indicators to all pages during async data operations (validates Requirement 9.1)
  - [ ] 12.2 Use Ionic page transitions (`IonRouterOutlet` default animations) for screen navigation (validates Requirement 9.2)
  - [~] 12.3 Apply dark mode via Ionic CSS variables in `variables.css` using `@media (prefers-color-scheme: dark)` (validates Requirement 9.3)
  - [~] 12.4 Use `IonIcon` components from `ionicons` to distinguish task status, navigation actions, and badge types (validates Requirement 9.4)
  - [ ] 12.5 Verify layout renders without horizontal scrolling on 320px–428px viewport widths using Ionic's responsive grid (validates Requirement 9.5)

- [ ] 13. End-to-End Integration Verification
  - [~] 13.1 Run full test suite (`vitest --run`) and confirm all unit and property-based tests pass
  - [~] 13.2 Build the web bundle (`ionic build`) and confirm no TypeScript or build errors
  - [ ] 13.3 Sync Capacitor native projects (`npx cap sync`) and verify `@capacitor/local-notifications` is registered on iOS and Android
  - [ ] 13.4 Manually verify the Add Task → notification scheduled → Mark as Done → notification cancelled flow on a device or emulator
