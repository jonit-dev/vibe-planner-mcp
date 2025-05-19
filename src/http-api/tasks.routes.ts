import { NextFunction, Request, Response, Router } from 'express';
import { container } from 'tsyringe';
import { LoggerService } from '../services/LoggerService';
import { DataPersistenceService } from '../vibeplanner/services/DataPersistenceService';
import {
  AddTaskDetails,
  TaskOrchestrationService,
} from '../vibeplanner/services/TaskOrchestrationService';
import { TaskStatusSchema } from '../vibeplanner/types';

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
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { taskId } = req.params;
    // Allow more fields for update, not just status and notes.
    // The body can be a partial representation of a Task.
    const updates = req.body;

    logger.info(`PATCH /api/tasks/${taskId}: Received request to update task.`);
    logger.debug(`PATCH /api/tasks/${taskId}: Update payload:`, updates);

    if (!taskId) {
      logger.warn(`PATCH /api/tasks/${taskId}: taskId parameter is required.`);
      return res.status(400).json({ message: 'taskId is required' });
    }

    if (Object.keys(updates).length === 0) {
      logger.warn(
        `PATCH /api/tasks/${taskId}: Request body is empty, no updates provided.`
      );
      return res.status(400).json({ message: 'No update data provided' });
    }

    // Optional: Validate specific fields if they are present, e.g., status
    if (updates.status && !TaskStatusSchema.options.includes(updates.status)) {
      logger.warn(
        `PATCH /api/tasks/${taskId}: Invalid task status provided: ${updates.status}`
      );
      return res.status(400).json({
        message: `Invalid task status: ${
          updates.status
        }. Valid statuses are: ${TaskStatusSchema.options.join(', ')}`,
      });
    }

    // Ensure non-updatable fields are not passed or are ignored by the service/repository layer.
    // For example, id, creationDate, phaseId (moving phases might be a different operation).
    // For now, we assume the service layer handles what can be updated.
    delete updates.id; // Cannot change task ID
    delete updates.creationDate; // Cannot change creation date
    // delete updates.phaseId; // Moving a task to another phase should be a dedicated endpoint/logic if complex.
    // If simply changing phaseId is allowed, this line isn't needed.
    // For now, let's assume phaseId is NOT updatable via this generic patch.

    try {
      // First, check if the task exists
      const existingTask = await dataPersistenceService.getTaskById(taskId);
      if (!existingTask) {
        logger.warn(
          `PATCH /api/tasks/${taskId}: Task with ID ${taskId} not found.`
        );
        return res.status(404).json({ message: 'Task not found' });
      }

      logger.debug(
        `PATCH /api/tasks/${taskId}: Calling dataPersistenceService.updateTask with updates:`,
        updates
      );
      const updatedTask = await dataPersistenceService.updateTask(
        taskId,
        updates
      );

      // updateTask might return null or throw if not found, though we checked above.
      // It might also return the number of affected rows in some ORMs.
      // Assuming it returns the updated task object or null if not found/failed.
      if (!updatedTask) {
        // This case might be redundant if getTaskById already confirmed existence
        // and updateTask would throw an error for other failures.
        logger.warn(
          `PATCH /api/tasks/${taskId}: Update failed or task not found (post-update check).`
        );
        return res
          .status(404)
          .json({ message: 'Task not found or update failed' });
      }

      logger.info(`PATCH /api/tasks/${taskId}: Successfully updated task.`);
      return res.status(200).json(updatedTask);
    } catch (error) {
      logger.error(
        `PATCH /api/tasks/${taskId}: Error updating task:`,
        error as Error
      );
      const err =
        error instanceof Error
          ? error
          : new Error('Unknown error during task update');
      next(err); // Pass to the main error handler
    }
  })
);
