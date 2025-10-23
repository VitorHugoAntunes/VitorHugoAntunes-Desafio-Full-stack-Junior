export class FetchNotificationsDto {
  userId: string;
  page: number;
  size: number;
}

export class MarkAsReadDto {
  userId: string;
  notificationId: string;
}

export class MarkAllAsReadDto {
  userId: string;
}

export class UnreadCountDto {
  userId: string;
}

export class TaskCreatedEventDto {
  id: string;
  title: string;
  authorId: string;
  assigneeIds: string[];
}

export class TaskUpdatedEventDto {
  id: string;
  title: string;
  authorId: string;
  assigneeIds?: string[];
  previousAssigneeIds?: string[];
  status?: string;
  previousStatus?: string;
  updatedBy?: string;
}

export class TaskCommentCreatedEventDto {
  taskId: string;
  comment: {
    id: string;
    content: string;
    authorId: string;
  };
  taskTitle?: string;
  taskAuthorId?: string;
  taskAssigneeIds?: string[];
}