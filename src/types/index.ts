export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'pending' | 'done';
  created_at: string;
  due_time: string;
  streak: number;
  user_id?: string;
}

export interface Badge {
  milestone: 3 | 7 | 30;
  label: string;
  earned: boolean;
}

export interface DashboardStats {
  totalTasks: number;
  completedTasks: number;
  currentStreak: number;
  motivationScore: number;
  badges: Badge[];
}
