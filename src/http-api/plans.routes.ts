import { NextFunction, Request, Response, Router } from 'express';
import { container } from 'tsyringe';
import { LoggerService } from '../services/LoggerService';
import { DataPersistenceService } from '../vibeplanner/services/DataPersistenceService';
import { PhaseStatus, PhaseStatusSchema } from '../vibeplanner/types';

export const plansRouter = Router();

const dataPersistenceService = container.resolve(DataPersistenceService);
const logger = container.resolve(LoggerService);

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

// POST /api/plans - Create a new plan
plansRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    logger.info('POST /api/plans: Received request to create a new plan.');
    logger.debug('Request body:', req.body);

    const { name, description, status } = req.body;

    if (!name) {
      logger.warn('POST /api/plans: Name is required to create a plan.');
      return res.status(400).json({ message: 'Name is required' });
    }

    let prdStatus: PhaseStatus = 'pending';
    if (status) {
      const parsedStatus = PhaseStatusSchema.safeParse(status);
      if (!parsedStatus.success) {
        logger.warn(
          `POST /api/plans: Invalid status value provided: ${status}. Defaulting to 'pending'.`
        );
      } else {
        prdStatus = parsedStatus.data;
      }
    }

    try {
      const prdData = {
        name,
        description: description || '',
        status: prdStatus,
      };
      logger.debug(
        'POST /api/plans: Calling dataPersistenceService.createPrd with data:',
        prdData
      );
      const newPrd = await dataPersistenceService.createPrd(prdData);
      logger.info(
        `POST /api/plans: Successfully created plan with ID: ${newPrd.id}`
      );
      return res.status(201).json(newPrd);
    } catch (error) {
      logger.error('POST /api/plans: Error creating new plan:', error as Error);
      const err =
        error instanceof Error
          ? error
          : new Error('Unknown error during plan creation');
      next(err);
    }
  })
);

// GET /api/plans/:planId
plansRouter.get(
  '/:planId',
  asyncHandler(async (req: Request, res: Response) => {
    const { planId } = req.params;
    if (!planId) {
      return res.status(400).json({ message: 'planId is required' });
    }
    const prd = await dataPersistenceService.getPrdById(planId);

    if (!prd) {
      return res.status(404).json({ message: 'Plan not found' });
    }

    const planOverview = {
      ...prd,
      phases: prd.phases
        ? prd.phases.map((phase) => ({
            ...phase,
            tasks: phase.tasks || [],
          }))
        : [],
    };

    return res.status(200).json(planOverview);
  })
);

// GET /api/plans
plansRouter.get(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const prds = await dataPersistenceService.getAllPrds();
    const prdSummaries = prds.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      createdAt: p.creationDate,
    }));
    return res.status(200).json(prdSummaries);
  })
);
