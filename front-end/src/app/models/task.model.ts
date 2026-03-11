export interface Task {
  id?: number;
  text: string;
  done: boolean;
  createdAt?: string;
  completedAt?: string;
  deletedAt?: string;
  user_id?: number;
  isEditing?: boolean; 
  tempText?: string;
}