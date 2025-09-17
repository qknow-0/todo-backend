import { UserResponseDto } from '../../auth/dto/auth.dto';

export class TaskResponseDto {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: Date;
  estimatedHours?: number;
  actualHours?: number;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;

  createdBy: UserResponseDto;
  assignedTo?: UserResponseDto;
  team?: {
    id: string;
    name: string;
  };

  parentTask?: {
    id: string;
    title: string;
  };

  subtasks?: TaskResponseDto[];
  watchers?: UserResponseDto[];

  constructor(partial: Partial<TaskResponseDto>) {
    Object.assign(this, partial);
  }
}
