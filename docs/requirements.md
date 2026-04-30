# Requirements Document

## Introduction

The Smart Motivation Task Reminder App is an Ionic Framework mobile application backed by Supabase. It allows users to create tasks with due-time reminders, track completion streaks, and receive contextual motivational messages driven by a rule-based motivation engine. The app targets individuals who want lightweight task management combined with positive reinforcement to build consistent habits.

---

## Glossary

- **App**: The Smart Motivation Task Reminder mobile application.
- **Task**: A user-defined item with a title, optional description, due time, and a status of `pending` or `done`.
- **Streak**: A running count of consecutive days on which the user has completed at least one task.
- **Motivation_Engine**: The rule-based service that selects and returns a motivational message based on the user's current streak, task completion ratio, overdue tasks, and time of day.
- **Motivation_Score**: A numeric value derived from streak count and task completion ratio, displayed on the Dashboard.
- **Capacitor**: The native runtime bridge used by Ionic to access device APIs such as local notifications on iOS and Android.
- **Notification_Service**: The Capacitor Local Notifications-based service responsible for scheduling and delivering local notifications.
- **Task_Service**: The Supabase-backed service responsible for all CRUD operations on tasks.
- **Dashboard**: The summary view showing total tasks, completed tasks, streak count, and motivation score.
- **Badge**: A visual achievement awarded to the user when a streak milestone is reached.
- **Overdue_Task**: A task whose `due_time` has passed and whose `status` is still `pending`.

---

## Requirements

### Requirement 1: Add a Task

**User Story:** As a user, I want to add a new task with a title, optional description, and a reminder time, so that I can track what I need to do and be reminded at the right moment.

#### Acceptance Criteria

1. THE App SHALL provide an Add Task screen containing input fields for task title, optional description, and due time.
2. WHEN the user submits the Add Task form with a non-empty title and a valid future due time, THE Task_Service SHALL persist the task to the Supabase `tasks` table with `status` set to `pending` and `streak` set to `0`.
3. IF the user submits the Add Task form with an empty title, THEN THE App SHALL display a validation error message and SHALL NOT persist the task.
4. IF the user submits the Add Task form with a due time that is in the past, THEN THE App SHALL display a validation error message and SHALL NOT persist the task.
5. WHEN a task is successfully saved, THE Notification_Service SHALL schedule a push notification for the task's `due_time`.
6. WHEN a task is successfully saved, THE App SHALL navigate the user back to the Task List screen.

---

### Requirement 2: View Task List

**User Story:** As a user, I want to see all my tasks with their current status, so that I can get an overview of what is pending and what is done.

#### Acceptance Criteria

1. THE App SHALL provide a Task List screen that displays all tasks retrieved from the Supabase `tasks` table.
2. WHEN the Task List screen loads, THE Task_Service SHALL fetch all tasks ordered by `due_time` ascending.
3. THE App SHALL render each task using a TaskCard component that displays the task title, due time, and current status (`pending` or `done`).
4. WHILE tasks are being fetched from Supabase, THE App SHALL display a loading indicator.
5. IF the fetch operation fails, THEN THE App SHALL display an error message describing the failure.
6. IF no tasks exist, THEN THE App SHALL display an empty-state message prompting the user to add a task.

---

### Requirement 3: Mark a Task as Done

**User Story:** As a user, I want to mark a task as done, so that I can track my progress and build a completion streak.

#### Acceptance Criteria

1. WHEN the user marks a task as done, THE Task_Service SHALL update the task's `status` to `done` in the Supabase `tasks` table.
2. WHEN the user marks a task as done, THE Task_Service SHALL increment the task's `streak` value by `1`.
3. WHEN a task is marked as done, THE App SHALL reflect the updated status immediately in the Task List screen without requiring a full page reload.
4. WHEN a task is marked as done, THE Notification_Service SHALL cancel any pending notification scheduled for that task.
5. IF the update operation fails, THEN THE App SHALL display an error message and SHALL retain the task's previous `status` and `streak` values in the UI.

---

### Requirement 4: Reminder Notifications

**User Story:** As a user, I want to receive a push notification at the task's due time, so that I am reminded to complete the task on time.

#### Acceptance Criteria

1. WHEN a task's `due_time` is reached, THE Notification_Service SHALL deliver a local notification containing the task title.
2. WHILE a task's `status` is `pending` and the task recurs daily, THE Notification_Service SHALL reschedule the notification for the next occurrence 24 hours after the original `due_time`.
3. WHEN the user taps a notification, THE App SHALL navigate to the Task Detail screen for the corresponding task.
4. IF the user has not granted notification permissions, THEN THE App SHALL request notification permissions via Capacitor Local Notifications before scheduling any notification.
5. IF the user denies notification permissions, THEN THE App SHALL display an informational message explaining that reminders will not be delivered, and SHALL continue to function without notifications.

---

### Requirement 5: Motivation Engine

**User Story:** As a user, I want to see a personalized motivational message based on my performance, so that I stay encouraged and consistent.

#### Acceptance Criteria

1. THE Motivation_Engine SHALL evaluate the following rules in priority order to select a motivational message:
   - IF the user's current `streak` is greater than or equal to `3`, THE Motivation_Engine SHALL return the message "You're on fire 🔥 Keep going!"
   - IF the count of `done` tasks is greater than the count of Overdue_Tasks, THE Motivation_Engine SHALL return the message "Great job! You're improving 💪"
   - IF one or more Overdue_Tasks exist, THE Motivation_Engine SHALL return the message "Let's get back on track today!"
2. WHEN no rule condition is met, THE Motivation_Engine SHALL return a default motivational message.
3. WHEN the current local time is between 05:00 and 11:59, THE Motivation_Engine SHALL prefix the selected message with the time-based phrase "Start strong!".
4. WHEN the current local time is between 20:00 and 23:59, THE Motivation_Engine SHALL prefix the selected message with the time-based phrase "Finish your tasks!".
5. THE Motivation_Engine SHALL maintain a rotation index so that the same message is not repeated on consecutive days when multiple messages qualify under the same rule.
6. THE App SHALL display the motivational message in a MotivationBox component on the Home screen.

---

### Requirement 6: Dashboard

**User Story:** As a user, I want to see a summary of my task statistics, so that I can understand my overall progress at a glance.

#### Acceptance Criteria

1. THE Dashboard SHALL display the total number of tasks stored in the Supabase `tasks` table.
2. THE Dashboard SHALL display the count of tasks whose `status` is `done`.
3. THE Dashboard SHALL display the user's current `streak` count, defined as the highest `streak` value among all tasks.
4. THE Dashboard SHALL display the Motivation_Score, calculated as `(completed_tasks / total_tasks) * 100` rounded to the nearest integer, or `0` when no tasks exist.
5. WHEN the underlying task data changes, THE Dashboard SHALL update all displayed statistics without requiring the user to manually refresh.

---

### Requirement 7: Streak Reward System

**User Story:** As a user, I want to earn badges when I reach streak milestones, so that I feel rewarded for maintaining consistent task completion.

#### Acceptance Criteria

1. WHEN the user's `streak` reaches `3`, THE App SHALL award and display a "3-Day Streak" badge.
2. WHEN the user's `streak` reaches `7`, THE App SHALL award and display a "7-Day Streak" badge.
3. WHEN the user's `streak` reaches `30`, THE App SHALL award and display a "30-Day Streak" badge.
4. THE App SHALL display all earned badges on the Dashboard.
5. WHEN a new badge is earned, THE App SHALL display an animated achievement notification to the user.

---

### Requirement 8: Task Detail View

**User Story:** As a user, I want to view the full details of a task, so that I can review its description, due time, and current streak before deciding to act on it.

#### Acceptance Criteria

1. WHEN the user taps a TaskCard, THE App SHALL navigate to the Task Detail screen for the selected task.
2. THE Task Detail screen SHALL display the task's title, description, `due_time`, `status`, and `streak` value.
3. THE Task Detail screen SHALL provide a "Mark as Done" action that triggers the behavior defined in Requirement 3.

---

### Requirement 9: UI Quality and Accessibility

**User Story:** As a user, I want a smooth, visually clear interface, so that the app is pleasant and easy to use.

#### Acceptance Criteria

1. THE App SHALL display loading indicators during all asynchronous data operations.
2. THE App SHALL apply smooth transition animations when navigating between screens.
3. WHERE dark mode is enabled on the device, THE App SHALL render all screens using a dark color scheme.
4. THE App SHALL use icon components to visually distinguish task status, navigation actions, and badge types.
5. THE App SHALL remain usable on screen widths between 320px and 428px without horizontal scrolling or content clipping.
