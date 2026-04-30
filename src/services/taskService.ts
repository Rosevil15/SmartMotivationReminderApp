import { supabase } from '../lib/supabaseClient';
import { Task } from '../types/index';
import { isFuture } from '../utils/dateHelper';

/**
 * Typed error class for all TaskService failures.
 */
export class TaskServiceError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = 'TaskServiceError';
  }
}

/**
 * Typed error class for validation failures (empty title, past due_time).
 */
export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export interface TaskService {
  fetchTasks(): Promise<Task[]>;
  addTask(payload: { title: string; description?: string; due_time: string }): Promise<Task>;
  markDone(id: string): Promise<Task>;
  getTask(id: string): Promise<Task>;
}

/**
 * Fetches all tasks from Supabase ordered by due_time ascending.
 */
export async function fetchTasks(): Promise<Task[]> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('due_time', { ascending: true });

  if (error) {
    throw new TaskServiceError(`Failed to fetch tasks: ${error.message}`, error);
  }

  return (data ?? []) as Task[];
}

/**
 * Validates and inserts a new task with status='pending' and streak=0.
 * Throws ValidationError for invalid inputs, TaskServiceError for Supabase failures.
 */
export async function addTask(payload: {
  title: string;
  description?: string;
  due_time: string;
}): Promise<Task> {
  // Validate title
  if (!payload.title || payload.title.trim() === '') {
    throw new ValidationError('Title must not be empty or whitespace-only.');
  }

  // Validate due_time is in the future
  const dueDate = new Date(payload.due_time);
  if (!isFuture(dueDate)) {
    throw new ValidationError('due_time must be a future date/time.');
  }

  // Get the current authenticated user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new TaskServiceError('You must be logged in to add a task.');
  }

  const { data, error } = await supabase
    .from('tasks')
    .insert({
      title: payload.title.trim(),
      description: payload.description,
      due_time: payload.due_time,
      status: 'pending',
      streak: 0,
      user_id: user.id,
    })
    .select()
    .single();

  if (error) {
    throw new TaskServiceError(`Failed to add task: ${error.message}`, error);
  }

  return data as Task;
}

/**
 * Updates a task's status to 'done' and increments streak by 1.
 * Throws TaskServiceError on failure.
 */
export async function markDone(id: string): Promise<Task> {
  // First fetch the current task to get the current streak value
  const current = await getTask(id);

  const { data, error } = await supabase
    .from('tasks')
    .update({
      status: 'done',
      streak: current.streak + 1,
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new TaskServiceError(`Failed to mark task as done: ${error.message}`, error);
  }

  return data as Task;
}

/**
 * Fetches a single task by id.
 * Throws TaskServiceError if not found or on Supabase failure.
 */
export async function getTask(id: string): Promise<Task> {
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw new TaskServiceError(`Task not found: ${id}`, error);
    }
    throw new TaskServiceError(`Failed to get task: ${error.message}`, error);
  }

  if (!data) {
    throw new TaskServiceError(`Task not found: ${id}`);
  }

  return data as Task;
}

const taskService: TaskService = {
  fetchTasks,
  addTask,
  markDone,
  getTask,
};

export default taskService;
