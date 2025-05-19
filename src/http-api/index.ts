import express, { Express, NextFunction, Request, Response } from 'express';
import 'reflect-metadata'; // Required for tsyringe
import { container } from 'tsyringe';
import '../services/db'; // Ensure db is initialized by importing the module
import { LoggerService } from '../services/LoggerService'; // Import LoggerService
import { DataPersistenceService } from '../vibeplanner/services/DataPersistenceService';
import { RepositoryProvider } from '../vibeplanner/services/RepositoryProvider';
import { apiRouter } from './routes';

const app: Express = express();
const port = process.env.PORT || 3000;
const logger = container.resolve(LoggerService); // Get logger instance

// Middleware to parse JSON bodies
app.use(express.json());

// Middleware to log all incoming requests
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`Incoming request: ${req.method} ${req.originalUrl}`);
  logger.debug('Request Headers:', req.headers);
  if (req.body && Object.keys(req.body).length > 0) {
    // Log body only if it's not empty and req.body exists
    logger.debug('Request Body:', req.body);
  }
  next();
});

// Register services for tsyringe
// RepositoryProvider and DataPersistenceService will get the db instance from their own imports
container.registerSingleton(RepositoryProvider);
container.registerSingleton(DataPersistenceService);

// API routes
app.use('/api', apiRouter);

app.get('/', (req, res) => {
  res.send('VibePlanner API is running!');
});

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    // console.log replaced by logger in db.ts, but main server listen can use logger too
    logger.info(`Server is running on http://localhost:${port}`);
  });
}

export default app; // Export for testing or other purposes
