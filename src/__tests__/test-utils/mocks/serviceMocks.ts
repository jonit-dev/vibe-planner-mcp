import { mock } from 'vitest-mock-extended';
import { LoggerService } from '../../../services/LoggerService';
import { DataPersistenceService } from '../../../vibeplanner/services/DataPersistenceService';
import { PrdLifecycleService } from '../../../vibeplanner/services/PrdLifecycleService';

export const createMockLoggerService = () => mock<LoggerService>();

export const createMockPrdLifecycleService = () => {
  // Creates a general mock. Specific methods can be overridden in tests.
  return mock<PrdLifecycleService>();
};

export const createMockDataPersistenceService = () => {
  // Creates a general mock. Specific methods can be overridden in tests.
  return mock<DataPersistenceService>();
};
