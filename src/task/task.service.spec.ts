import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { PaginatedResponse } from './dto/pagination.dto';

describe('TaskService', () => {
  let service: TaskService;
  let prisma: PrismaService;

  const mockPrisma = {
    task: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    taskWatcher: {
      findUnique: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
  };

  const mockUser = {
    id: 'user-1',
    email: 'user@example.com',
    name: 'Test User',
    avatarUrl: null,
  };

  const mockTask = {
    id: 'task-1',
    title: 'Test Task',
    description: 'Test Description',
    status: 'todo',
    priority: 'medium',
    dueDate: new Date(),
    estimatedHours: 5,
    actualHours: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    completedAt: null,
    createdById: 'user-1',
    assignedToId: null,
    teamId: null,
    parentTaskId: null,
    createdBy: mockUser,
    assignedTo: null,
    team: null,
    parentTask: null,
    subtasks: [],
    watchers: [],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TaskService,
        {
          provide: PrismaService,
          useValue: mockPrisma,
        },
      ],
    }).compile();

    service = module.get<TaskService>(TaskService);
    prisma = module.get<PrismaService>(PrismaService);

    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a task successfully', async () => {
      const createTaskDto: CreateTaskDto = {
        title: 'Test Task',
        description: 'Test Description',
        status: 'todo',
        priority: 'medium',
        estimatedHours: 5,
      };

      mockPrisma.task.create.mockResolvedValue(mockTask);

      const result = await service.create(createTaskDto, 'user-1');

      expect(prisma.task.create).toHaveBeenCalledWith({
        data: {
          title: createTaskDto.title,
          description: createTaskDto.description,
          status: createTaskDto.status,
          priority: createTaskDto.priority,
          estimatedHours: createTaskDto.estimatedHours,
          createdById: 'user-1',
          assignedToId: undefined,
          teamId: undefined,
          parentTaskId: undefined,
          dueDate: undefined,
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

      expect(result).toBeInstanceOf(TaskResponseDto);
      expect(result.id).toBe(mockTask.id);
    });
  });

  describe('findAll', () => {
    it('should return paginated tasks with default parameters', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockTask]);
      mockPrisma.task.count.mockResolvedValue(1);

      const result = await service.findAll('user-1');

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { createdById: 'user-1' },
            { assignedToId: 'user-1' },
            { watchers: { some: { userId: 'user-1' } } },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 0,
        take: 10,
      });

      expect(prisma.task.count).toHaveBeenCalledWith({
        where: {
          OR: [
            { createdById: 'user-1' },
            { assignedToId: 'user-1' },
            { watchers: { some: { userId: 'user-1' } } },
          ],
        },
      });

      expect(result).toBeInstanceOf(PaginatedResponse);
      expect(result.data).toHaveLength(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.limit).toBe(10);
      expect(result.meta.total).toBe(1);
    });

    it('should return paginated tasks with custom parameters', async () => {
      mockPrisma.task.findMany.mockResolvedValue([mockTask]);
      mockPrisma.task.count.mockResolvedValue(15);

      const result = await service.findAll('user-1', 2, 5);

      expect(prisma.task.findMany).toHaveBeenCalledWith({
        where: {
          OR: [
            { createdById: 'user-1' },
            { assignedToId: 'user-1' },
            { watchers: { some: { userId: 'user-1' } } },
          ],
        },
        include: expect.any(Object),
        orderBy: { createdAt: 'desc' },
        skip: 5,
        take: 5,
      });

      expect(result.meta.page).toBe(2);
      expect(result.meta.limit).toBe(5);
      expect(result.meta.total).toBe(15);
      expect(result.meta.totalPages).toBe(3);
      expect(result.meta.hasNext).toBe(true);
      expect(result.meta.hasPrev).toBe(true);
    });
  });

  describe('findOne', () => {
    it('should return a task if user has access', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);

      const result = await service.findOne('task-1', 'user-1');

      expect(prisma.task.findFirst).toHaveBeenCalledWith({
        where: {
          id: 'task-1',
          OR: [
            { createdById: 'user-1' },
            { assignedToId: 'user-1' },
            { watchers: { some: { userId: 'user-1' } } },
          ],
        },
        include: expect.any(Object),
      });

      expect(result).toBeInstanceOf(TaskResponseDto);
      expect(result.id).toBe('task-1');
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('task-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if user has no access', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await expect(service.findOne('task-1', 'user-2')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update a task successfully', async () => {
      const updateTaskDto: UpdateTaskDto = {
        title: 'Updated Task',
        status: 'in_progress',
      };

      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.task.update.mockResolvedValue({
        ...mockTask,
        ...updateTaskDto,
      });

      const result = await service.update('task-1', updateTaskDto, 'user-1');

      expect(prisma.task.findFirst).toHaveBeenCalled();
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          title: 'Updated Task',
          status: 'in_progress',
          completedAt: null,
        },
        include: expect.any(Object),
      });

      expect(result).toBeInstanceOf(TaskResponseDto);
    });

    it('should set completedAt when status is done', async () => {
      const updateTaskDto: UpdateTaskDto = {
        status: 'done',
      };

      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.task.update.mockResolvedValue({
        ...mockTask,
        status: 'done',
        completedAt: new Date(),
      });

      await service.update('task-1', updateTaskDto, 'user-1');

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: {
          status: 'done',
          completedAt: expect.any(Date),
        },
        include: expect.any(Object),
      });
    });
  });

  describe('remove', () => {
    it('should delete a task successfully', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.task.delete.mockResolvedValue(mockTask);

      await service.remove('task-1', 'user-1');

      expect(prisma.task.findFirst).toHaveBeenCalled();
      expect(prisma.task.delete).toHaveBeenCalledWith({
        where: { id: 'task-1' },
      });
    });

    it('should throw NotFoundException if task not found', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(null);

      await expect(service.remove('task-1', 'user-1')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('assignTask', () => {
    it('should assign task to user', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.task.update.mockResolvedValue({
        ...mockTask,
        assignedToId: 'user-2',
        assignedTo: { ...mockUser, id: 'user-2' },
      });

      const result = await service.assignTask('task-1', 'user-2', 'user-1');

      expect(prisma.task.findFirst).toHaveBeenCalled();
      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'task-1' },
        data: { assignedToId: 'user-2' },
        include: expect.any(Object),
      });

      expect(result).toBeInstanceOf(TaskResponseDto);
    });
  });

  describe('watchTask', () => {
    it('should add user as watcher if not already watching', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.taskWatcher.findUnique.mockResolvedValue(null);
      mockPrisma.taskWatcher.create.mockResolvedValue({});
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);

      const result = await service.watchTask('task-1', 'user-1');

      expect(prisma.taskWatcher.findUnique).toHaveBeenCalled();
      expect(prisma.taskWatcher.create).toHaveBeenCalledWith({
        data: {
          taskId: 'task-1',
          userId: 'user-1',
        },
      });

      expect(result).toBeInstanceOf(TaskResponseDto);
    });

    it('should not add user as watcher if already watching', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.taskWatcher.findUnique.mockResolvedValue({});
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);

      const result = await service.watchTask('task-1', 'user-1');

      expect(prisma.taskWatcher.findUnique).toHaveBeenCalled();
      expect(prisma.taskWatcher.create).not.toHaveBeenCalled();
      expect(result).toBeInstanceOf(TaskResponseDto);
    });
  });

  describe('unwatchTask', () => {
    it('should remove user from watchers', async () => {
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);
      mockPrisma.taskWatcher.delete.mockResolvedValue({});
      mockPrisma.task.findFirst.mockResolvedValue(mockTask);

      const result = await service.unwatchTask('task-1', 'user-1');

      expect(prisma.taskWatcher.delete).toHaveBeenCalledWith({
        where: {
          taskId_userId: {
            taskId: 'task-1',
            userId: 'user-1',
          },
        },
      });

      expect(result).toBeInstanceOf(TaskResponseDto);
    });
  });

  describe('checkParentTaskCompletion', () => {
    it('should complete parent task when all subtasks are done', async () => {
      const parentTask = {
        ...mockTask,
        id: 'parent-1',
        status: 'todo',
        subtasks: [
          { ...mockTask, id: 'subtask-1', status: 'done' },
          { ...mockTask, id: 'subtask-2', status: 'done' },
        ],
      };

      mockPrisma.task.findUnique.mockResolvedValue(parentTask);
      mockPrisma.task.update.mockResolvedValue({
        ...parentTask,
        status: 'done',
      });

      await service['checkParentTaskCompletion']('parent-1');

      expect(prisma.task.update).toHaveBeenCalledWith({
        where: { id: 'parent-1' },
        data: {
          status: 'done',
          completedAt: expect.any(Date),
        },
      });
    });

    it('should not complete parent task if not all subtasks are done', async () => {
      const parentTask = {
        ...mockTask,
        id: 'parent-1',
        status: 'todo',
        subtasks: [
          { ...mockTask, id: 'subtask-1', status: 'done' },
          { ...mockTask, id: 'subtask-2', status: 'in_progress' },
        ],
      };

      mockPrisma.task.findUnique.mockResolvedValue(parentTask);

      await service['checkParentTaskCompletion']('parent-1');

      expect(prisma.task.update).not.toHaveBeenCalled();
    });

    it('should not complete parent task if already done', async () => {
      const parentTask = {
        ...mockTask,
        id: 'parent-1',
        status: 'done',
        subtasks: [
          { ...mockTask, id: 'subtask-1', status: 'done' },
          { ...mockTask, id: 'subtask-2', status: 'done' },
        ],
      };

      mockPrisma.task.findUnique.mockResolvedValue(parentTask);

      await service['checkParentTaskCompletion']('parent-1');

      expect(prisma.task.update).not.toHaveBeenCalled();
    });
  });
});
