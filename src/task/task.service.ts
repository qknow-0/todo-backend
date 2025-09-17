import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { PaginatedResponse } from './dto/pagination.dto';
import { UserResponseDto } from '../auth/dto/auth.dto';

@Injectable()
export class TaskService {
  private readonly logger = new Logger(TaskService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapToResponseDto(task: any): TaskResponseDto {
    return new TaskResponseDto({
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      estimatedHours: task.estimatedHours,
      actualHours: task.actualHours,
      createdAt: task.createdAt,
      updatedAt: task.updatedAt,
      completedAt: task.completedAt,

      createdBy: new UserResponseDto({
        id: task.createdBy.id,
        email: task.createdBy.email,
        name: task.createdBy.name,
        avatarUrl: task.createdBy.avatarUrl,
      }),

      assignedTo: task.assignedTo
        ? new UserResponseDto({
            id: task.assignedTo.id,
            email: task.assignedTo.email,
            name: task.assignedTo.name,
            avatarUrl: task.assignedTo.avatarUrl,
          })
        : undefined,

      team: task.team
        ? {
            id: task.team.id,
            name: task.team.name,
          }
        : undefined,

      parentTask: task.parentTask
        ? {
            id: task.parentTask.id,
            title: task.parentTask.title,
          }
        : undefined,

      subtasks: task.subtasks?.map((subtask: any) =>
        this.mapToResponseDto(subtask),
      ),

      watchers: task.watchers?.map(
        (watcher: any) =>
          new UserResponseDto({
            id: watcher.user.id,
            email: watcher.user.email,
            name: watcher.user.name,
            avatarUrl: watcher.user.avatarUrl,
          }),
      ),
    });
  }

  async create(
    createTaskDto: CreateTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    this.logger.log(`Creating task for user ${userId}`);

    const task = await this.prisma.task.create({
      data: {
        title: createTaskDto.title,
        description: createTaskDto.description,
        status: createTaskDto.status || 'todo',
        priority: createTaskDto.priority || 'medium',
        dueDate: createTaskDto.dueDate,
        estimatedHours: createTaskDto.estimatedHours,
        createdById: userId,
        assignedToId: createTaskDto.assignedToId,
        teamId: createTaskDto.teamId,
        parentTaskId: createTaskDto.parentTaskId,
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        parentTask: true,
        subtasks: true,
        watchers: {
          include: {
            user: true,
          },
        },
      },
    });

    return this.mapToResponseDto(task);
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PaginatedResponse<TaskResponseDto>> {
    this.logger.log(
      `Finding tasks for user ${userId} with pagination - page: ${page}, limit: ${limit}`,
    );

    const skip = (page - 1) * limit;

    const [tasks, total] = await Promise.all([
      this.prisma.task.findMany({
        where: {
          OR: [
            { createdById: userId },
            { assignedToId: userId },
            { watchers: { some: { userId } } },
          ],
        },
        include: {
          createdBy: true,
          assignedTo: true,
          team: true,
          parentTask: true,
          subtasks: true,
          watchers: {
            include: {
              user: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: +limit,
      }),
      this.prisma.task.count({
        where: {
          OR: [
            { createdById: userId },
            { assignedToId: userId },
            { watchers: { some: { userId } } },
          ],
        },
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return new PaginatedResponse(
      tasks.map((task) => this.mapToResponseDto(task)),
      {
        page,
        limit,
        total,
        totalPages,
      },
    );
  }

  async findOne(id: string, userId: string): Promise<TaskResponseDto> {
    this.logger.log(`Finding task ${id} for user ${userId}`);

    const task = await this.prisma.task.findFirst({
      where: {
        id,
        OR: [
          { createdById: userId },
          { assignedToId: userId },
          { watchers: { some: { userId } } },
        ],
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        parentTask: true,
        subtasks: {
          include: {
            createdBy: true,
            assignedTo: true,
            watchers: {
              include: {
                user: true,
              },
            },
          },
        },
        watchers: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return this.mapToResponseDto(task);
  }

  async update(
    id: string,
    updateTaskDto: UpdateTaskDto,
    userId: string,
  ): Promise<TaskResponseDto> {
    this.logger.log(`Updating task ${id} for user ${userId}`);

    // Verify user has access to the task
    await this.findOne(id, userId);

    const task = await this.prisma.task.update({
      where: { id },
      data: {
        title: updateTaskDto.title,
        description: updateTaskDto.description,
        status: updateTaskDto.status,
        priority: updateTaskDto.priority,
        dueDate: updateTaskDto.dueDate,
        estimatedHours: updateTaskDto.estimatedHours,
        assignedToId: updateTaskDto.assignedToId,
        teamId: updateTaskDto.teamId,
        ...(updateTaskDto.status === 'done' && { completedAt: new Date() }),
        ...(updateTaskDto.status !== 'done' &&
          updateTaskDto.status && { completedAt: null }),
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        parentTask: true,
        subtasks: true,
        watchers: {
          include: {
            user: true,
          },
        },
      },
    });

    // If this is a subtask and it's completed, check if parent task should be completed
    if (updateTaskDto.status === 'done' && task.parentTaskId) {
      await this.checkParentTaskCompletion(task.parentTaskId);
    }

    return this.mapToResponseDto(task);
  }

  async remove(id: string, userId: string): Promise<void> {
    this.logger.log(`Deleting task ${id} for user ${userId}`);

    // Verify user has access to the task
    await this.findOne(id, userId);

    await this.prisma.task.delete({
      where: { id },
    });
  }

  async assignTask(
    taskId: string,
    assigneeId: string,
    userId: string,
  ): Promise<TaskResponseDto> {
    this.logger.log(`Assigning task ${taskId} to user ${assigneeId}`);

    // Verify user has access to the task
    await this.findOne(taskId, userId);

    const task = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        assignedToId: assigneeId,
      },
      include: {
        createdBy: true,
        assignedTo: true,
        team: true,
        parentTask: true,
        subtasks: true,
        watchers: {
          include: {
            user: true,
          },
        },
      },
    });

    return this.mapToResponseDto(task);
  }

  async watchTask(taskId: string, userId: string): Promise<TaskResponseDto> {
    this.logger.log(`User ${userId} watching task ${taskId}`);

    // Verify user has access to the task
    await this.findOne(taskId, userId);

    // Check if user is already watching
    const existingWatch = await this.prisma.taskWatcher.findUnique({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    if (!existingWatch) {
      await this.prisma.taskWatcher.create({
        data: {
          taskId,
          userId,
        },
      });
    }

    return this.findOne(taskId, userId);
  }

  async unwatchTask(taskId: string, userId: string): Promise<TaskResponseDto> {
    this.logger.log(`User ${userId} unwatching task ${taskId}`);

    // Verify user has access to the task
    await this.findOne(taskId, userId);

    await this.prisma.taskWatcher.delete({
      where: {
        taskId_userId: {
          taskId,
          userId,
        },
      },
    });

    return this.findOne(taskId, userId);
  }

  private async checkParentTaskCompletion(parentTaskId: string): Promise<void> {
    const parentTask = await this.prisma.task.findUnique({
      where: { id: parentTaskId },
      include: {
        subtasks: true,
      },
    });

    if (parentTask && parentTask.subtasks.length > 0) {
      const allSubtasksDone = parentTask.subtasks.every(
        (subtask) => subtask.status === 'done',
      );

      if (allSubtasksDone && parentTask.status !== 'done') {
        await this.prisma.task.update({
          where: { id: parentTaskId },
          data: {
            status: 'done',
            completedAt: new Date(),
          },
        });
      }
    }
  }
}
