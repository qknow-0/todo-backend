import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskResponseDto } from './dto/task-response.dto';
import { PaginatedResponse } from './dto/pagination.dto';
import { IUser, User } from '../user.decorator';

@Controller('tasks')
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Post()
  create(
    @Body() createTaskDto: CreateTaskDto,
    @User() user: IUser,
  ): Promise<TaskResponseDto> {
    // console.log('create:user', user);
    return this.taskService.create(createTaskDto, user.id);
  }

  @Get()
  findAll(
    @User() user: IUser,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
  ): Promise<PaginatedResponse<TaskResponseDto>> {
    return this.taskService.findAll(user.id, page, limit);
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
    @User() user: IUser,
  ): Promise<TaskResponseDto> {
    return this.taskService.findOne(id, user.id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateTaskDto: UpdateTaskDto,
    @User() user: IUser,
  ): Promise<TaskResponseDto> {
    return this.taskService.update(id, updateTaskDto, user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User() user: IUser): Promise<void> {
    return this.taskService.remove(id, user.id);
  }

  @Post(':id/assign/:userId')
  assignTask(
    @Param('id') taskId: string,
    @Param('userId') assigneeId: string,
    @User() user: IUser,
  ): Promise<TaskResponseDto> {
    return this.taskService.assignTask(taskId, assigneeId, user.id);
  }

  @Post(':id/watch')
  watchTask(
    @Param('id') taskId: string,
    @User() user: IUser,
  ): Promise<TaskResponseDto> {
    return this.taskService.watchTask(taskId, user.id);
  }

  @Delete(':id/watch')
  unwatchTask(
    @Param('id') taskId: string,
    @User() user: IUser,
  ): Promise<TaskResponseDto> {
    return this.taskService.unwatchTask(taskId, user.id);
  }
}
