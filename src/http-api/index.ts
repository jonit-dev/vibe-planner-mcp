import express, { Express } from 'express';
import 'reflect-metadata'; // Required for tsyringe
import { container } from 'tsyringe';
import '../services/db'; // Ensure db is initialized by importing the module
import { DataPersistenceService } from '../vibeplanner/services/DataPersistenceService';
import { RepositoryProvider } from '../vibeplanner/services/RepositoryProvider';
import { apiRouter } from './routes';

const app: Express = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON bodies
app.use(express.json());

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
    console.log(`Server is running on http://localhost:${port}`);
  });
}

export default app; // Export for testing or other purposes
