import { IsString, IsOptional, IsEnum, IsDateString, IsNumber, IsUUID } from 'class-validator';

export class CreateTaskDto {
  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(['todo', 'in_progress', 'done', 'archived'])
  @IsOptional()
  status?: string;

  @IsEnum(['low', 'medium', 'high', 'urgent'])
  @IsOptional()
  priority?: string;

  @IsDateString()
  @IsOptional()
  dueDate?: Date;

  @IsNumber()
  @IsOptional()
  estimatedHours?: number;

  @IsUUID()
  @IsOptional()
  teamId?: string;

  @IsUUID()
  @IsOptional()
  assignedToId?: string;

  @IsUUID()
  @IsOptional()
  parentTaskId?: string;
}