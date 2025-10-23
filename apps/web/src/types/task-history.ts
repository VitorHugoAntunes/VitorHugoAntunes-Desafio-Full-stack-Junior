export interface TaskHistory {
  id: string;
  task_id: string;
  change_description: string;
  field_changed: string;
  old_value: string;
  new_value: string;
  created_by?: string;
  created_date: string;
}