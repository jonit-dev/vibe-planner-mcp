import { NextFunction, Request, Response, Router } from 'express';
import { container } from 'tsyringe';
import { DataPersistenceService } from '../vibeplanner/services/DataPersistenceService';
import { TaskStatus, TaskStatusSchema } from '../vibeplanner/types';

export const tasksRouter = Router();

const dataPersistenceService = container.resolve(DataPersistenceService);

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

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
