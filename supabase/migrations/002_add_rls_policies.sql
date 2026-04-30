-- Migration 002: Add user_id column and RLS policies

-- 1. Add user_id column referencing auth.users
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Enable Row Level Security
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- 3. Policy: users can SELECT their own tasks
CREATE POLICY "Users can view own tasks"
  ON tasks FOR SELECT
  USING (auth.uid() = user_id);

-- 4. Policy: users can INSERT their own tasks
CREATE POLICY "Users can insert own tasks"
  ON tasks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 5. Policy: users can UPDATE their own tasks
CREATE POLICY "Users can update own tasks"
  ON tasks FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 6. Policy: users can DELETE their own tasks
CREATE POLICY "Users can delete own tasks"
  ON tasks FOR DELETE
  USING (auth.uid() = user_id);
