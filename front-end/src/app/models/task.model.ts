export interface Task {
  id: number;
  text: string;
  done: boolean;
  user_name: string;
  completedAt?: string | null;
  deletedAt?: string | null;
  isEditing?: boolean;
  tempText?: string;
}