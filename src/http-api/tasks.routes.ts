import { NextFunction, Request, Response, Router } from 'express';
import { container } from 'tsyringe';
import { LoggerService } from '../services/LoggerService';
import { DataPersistenceService } from '../vibeplanner/services/DataPersistenceService';
import {
  AddTaskDetails,
  TaskOrchestrationService,
} from '../vibeplanner/services/TaskOrchestrationService';
import { TaskStatus, TaskStatusSchema } from '../vibeplanner/types';

export const tasksRouter = Router();

const dataPersistenceService = container.resolve(DataPersistenceService);
const taskOrchestrationService = container.resolve(TaskOrchestrationService);
const logger = container.resolve(LoggerService);

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// POST /api/tasks - Create a new task
tasksRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const {
      phaseId,
      name,
      description,
      order,
      validationCommand,
      notes,
      dependencies,
    } = req.body as AddTaskDetails & { phaseId: string };

    logger.info('POST /api/tasks: Received request to create a new task.');
    logger.debug('Request body:', req.body);

    if (!phaseId) {
      logger.warn('POST /api/tasks: phaseId is required to create a task.');
      return res.status(400).json({ message: 'phaseId is required' });
    }
    if (!name) {
      logger.warn('POST /api/tasks: Task name is required.');
      return res.status(400).json({ message: 'Task name is required' });
    }
    if (order === undefined || order === null) {
      logger.warn('POST /api/tasks: Task order is required.');
      return res.status(400).json({ message: 'Task order is required' });
    }

    // Check if phase exists
    // TODO: Consider moving this check into the TaskOrchestrationService or having a dedicated PhaseService method for existence check
    const phase = await dataPersistenceService.getPhaseById(phaseId);
    if (!phase) {
      logger.warn(`POST /api/tasks: Phase with ID ${phaseId} not found.`);
      return res.status(404).json({ message: 'Phase not found' });
    }

    try {
      const taskDetails: AddTaskDetails = {
        name,
        description,
        order,
        validationCommand,
        notes,
        dependencies,
      };

      logger.debug(
        `POST /api/tasks: Calling taskOrchestrationService.addTaskToPhase (phaseId: ${phaseId}) with details:`,
        taskDetails
      );

      const newTask = await taskOrchestrationService.addTaskToPhase(
        phaseId,
        taskDetails
      );

      logger.info(
        `POST /api/tasks: Successfully created task with ID: ${newTask.id} in phase ${phaseId}`
      );
      return res.status(201).json(newTask);
    } catch (error) {
      logger.error(
        `POST /api/tasks: Error creating new task for phase ${phaseId}:`,
        error as Error
      );
      const err =
        error instanceof Error
          ? error
          : new Error('Unknown error during task creation');
      next(err);
    }
  })
);

// PATCH /api/tasks/:taskId
tasksRouter.patch(
  '/:taskId',
  asyncHandler(async (req: Request, res: Response) => {
    const { taskId } = req.params;
    const { status, notes } = req.body as {
      status: TaskStatus;
      notes?: string;
    };

    if (!taskId) {
      return res.status(400).json({ message: 'taskId is required' });
    }

    if (!status) {
      return res.status(400).json({ message: 'Task status is required' });
    }

    if (!TaskStatusSchema.options.includes(status)) {
      return res.status(400).json({
        message: `Invalid task status: ${status}. Valid statuses are: ${TaskStatusSchema.options.join(
          ', '
        )}`,
      });
    }

    try {
      const task = await dataPersistenceService.getTaskById(taskId);
      if (!task) {
        return res.status(404).json({ message: 'Task not found' });
      }

      const updatedTask = await dataPersistenceService.updateTask(taskId, {
        status,
        notes,
      });
      if (!updatedTask) {
        return res
          .status(404)
          .json({ message: 'Task not found or update failed' });
      }
      return res.status(200).json(updatedTask);
    } catch (error) {
      console.error(`Error updating task ${taskId}:`, error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  })
);
