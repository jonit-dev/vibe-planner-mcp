import { NextFunction, Request, Response, Router } from 'express';
import { container } from 'tsyringe';
import { LoggerService } from '../services/LoggerService';
import { DataPersistenceService } from '../vibeplanner/services/DataPersistenceService';
import {
  AddPhaseDetails,
  PhaseControlService,
} from '../vibeplanner/services/PhaseControlService';
import { PhaseStatus, PhaseStatusSchema } from '../vibeplanner/types';

export const plansRouter = Router();

const dataPersistenceService = container.resolve(DataPersistenceService);
const phaseControlService = container.resolve(PhaseControlService);
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

// POST /api/plans/:planId/phases - Create a new phase for a plan
plansRouter.post(
  '/:planId/phases',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { planId } = req.params;
    const { name, description, order, status } = req.body as AddPhaseDetails;

    logger.info(
      `POST /api/plans/${planId}/phases: Received request to add phase.`
    );
    logger.debug('Request body:', req.body);

    if (!planId) {
      logger.warn(
        'POST /api/plans/:planId/phases: planId parameter is required.'
      );
      return res.status(400).json({ message: 'Plan ID is required in path' });
    }
    if (!name) {
      logger.warn('POST /api/plans/:planId/phases: Phase name is required.');
      return res.status(400).json({ message: 'Phase name is required' });
    }
    if (order === undefined || order === null) {
      logger.warn('POST /api/plans/:planId/phases: Phase order is required.');
      return res.status(400).json({ message: 'Phase order is required' });
    }

    try {
      // Check if plan exists
      const plan = await dataPersistenceService.getPrdById(planId);
      if (!plan) {
        logger.warn(
          `POST /api/plans/:planId/phases: Plan with ID ${planId} not found.`
        );
        return res.status(404).json({ message: 'Plan not found' });
      }

      const phaseDetails: AddPhaseDetails = {
        name,
        description,
        order,
        status: status || 'pending', // Default to pending if not provided
      };

      logger.debug(
        `POST /api/plans/${planId}/phases: Calling phaseControlService.addPhaseToPrd with details:`,
        phaseDetails
      );

      const newPhase = await phaseControlService.addPhaseToPrd(
        planId,
        phaseDetails
      );
      logger.info(
        `POST /api/plans/${planId}/phases: Successfully added phase with ID: ${newPhase.id}`
      );
      return res.status(201).json(newPhase);
    } catch (error) {
      logger.error(
        `POST /api/plans/${planId}/phases: Error adding phase:`,
        error as Error
      );
      const err =
        error instanceof Error
          ? error
          : new Error('Unknown error during phase creation');
      next(err); // Pass to the main error handler
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

// GET /api/plans/:planId/phases - Get all phases for a specific plan
plansRouter.get(
  '/:planId/phases',
  asyncHandler(async (req: Request, res: Response, next: NextFunction) => {
    const { planId } = req.params;
    logger.info(
      `GET /api/plans/${planId}/phases: Received request to get phases.`
    );

    if (!planId) {
      logger.warn(
        'GET /api/plans/:planId/phases: planId parameter is required.'
      );
      return res.status(400).json({ message: 'Plan ID is required in path' });
    }

    try {
      // First, check if the plan itself exists
      const plan = await dataPersistenceService.getPrdById(planId);
      if (!plan) {
        logger.warn(
          `GET /api/plans/:planId/phases: Plan with ID ${planId} not found.`
        );
        return res.status(404).json({ message: 'Plan not found' });
      }

      // If plan exists, get its phases
      // getPhasesForPrd in PhaseControlService internally calls dataPersistenceService.getPhasesByPrdId,
      // which already populates tasks for each phase.
      const phases = await phaseControlService.getPhasesForPrd(planId);
      logger.info(
        `GET /api/plans/${planId}/phases: Successfully retrieved ${phases.length} phases.`
      );
      return res.status(200).json(phases);
    } catch (error) {
      logger.error(
        `GET /api/plans/${planId}/phases: Error retrieving phases:`,
        error as Error
      );
      const err =
        error instanceof Error
          ? error
          : new Error('Unknown error while retrieving phases');
      next(err);
    }
  })
);
