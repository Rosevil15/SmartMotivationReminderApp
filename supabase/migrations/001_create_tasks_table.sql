-- Smart Motivation Task Reminder App
-- Migration 001: Create tasks table

CREATE TABLE tasks (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  title       TEXT        NOT NULL,
  description TEXT,
  status      TEXT        NOT NULL DEFAULT 'pending'
                          CHECK (status IN ('pending', 'done')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_time    TIMESTAMPTZ NOT NULL,
  streak      INT         NOT NULL DEFAULT 0
);

-- Index for ordered task list queries (Requirement 2.2)
CREATE INDEX idx_tasks_due_time ON tasks (due_time ASC);
