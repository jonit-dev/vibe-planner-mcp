import { NextFunction, Request, Response, Router } from 'express';
import { plansRouter } from './plans.routes';
import { tasksRouter } from './tasks.routes';

export const apiRouter = Router();

// Mount resource-specific routers
apiRouter.use('/plans', plansRouter);
apiRouter.use('/tasks', tasksRouter);

// General error handler for the API router (catches errors from sub-routers if they call next(err))
apiRouter.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error - Main Router]:', err);
  // Avoid sending duplicate responses if error is already handled by sub-router and sent.
  if (!res.headersSent) {
    res
      .status(500)
      .json({ message: 'Internal Server Error', error: err.message });
  }
});
