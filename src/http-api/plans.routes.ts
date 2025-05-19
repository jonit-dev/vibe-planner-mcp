import { NextFunction, Request, Response, Router } from 'express';
import { container } from 'tsyringe';
import { DataPersistenceService } from '../vibeplanner/services/DataPersistenceService';

export const plansRouter = Router();

const dataPersistenceService = container.resolve(DataPersistenceService);

const asyncHandler =
  (fn: (req: Request, res: Response, next: NextFunction) => Promise<any>) =>
  (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };

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
