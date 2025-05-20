import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
// import { mock } from 'vitest-mock-extended'; // No longer needed directly here
// import { LoggerService } from '../../../services/LoggerService'; // Imported via mock helper
import { createTestPrd } from '../../../__tests__/test-utils/fixtures/prdFixtures';
import {
  createMockDataPersistenceService,
  createMockLoggerService,
} from '../../../__tests__/test-utils/mocks/serviceMocks';
import { PhaseStatus, Prd } from '../../types'; // PrdSchema, PhaseStatusSchema used by fixture
import {
  InitializePrdDetails,
  PrdLifecycleService,
} from '../PrdLifecycleService';

// Mock DataPersistenceService using the helper
const mockDataPersistenceService = createMockDataPersistenceService();

// Use a factory to provide the mocked service instance for tsyringe (if tsyringe is used for instantiation in tests)
// This part might need adjustment based on actual tsyringe test setup or if direct instantiation is preferred.
vi.mock('../DataPersistenceService', () => ({
  DataPersistenceService: vi.fn(() => mockDataPersistenceService),
}));

describe('PrdLifecycleService', () => {
  let prdLifecycleService: PrdLifecycleService;
  let mockLoggerService = createMockLoggerService(); // Instantiated here

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    // Re-create mocks for each test if they hold state or if preferred for isolation
    mockLoggerService = createMockLoggerService();
    // If DataPersistenceService mock needs to be reset per test and is stateful:
    // Object.assign(mockDataPersistenceService, createMockDataPersistenceService()); // or vi.resetModules for full re-import if necessary
    // For vitest-mock-extended, .mockClear() or .mockReset() might be used on individual mock functions if needed.
    // If createMockDataPersistenceService() returns a new mock object each time, reassign:
    // mockDataPersistenceService = createMockDataPersistenceService();
    // The current setup reuses the mockDataPersistenceService object defined outside describe,
    // so its method mocks persist unless cleared. vi.clearAllMocks() handles this for vi.fn().

    prdLifecycleService = new PrdLifecycleService(
      mockDataPersistenceService, // This is the module-level mock, its functions are cleared by vi.clearAllMocks()
      mockLoggerService
    );
  });

  describe('initializePrd', () => {
    it('should initialize a PRD and call DataPersistenceService.createPrd', async () => {
      const prdDetails: InitializePrdDetails = {
        name: 'Test PRD',
        description: 'Test Description',
      };
      const mockCreatedPrd = createTestPrd(prdDetails); // Use fixture

      mockDataPersistenceService.createPrd.mockResolvedValue(mockCreatedPrd);

      const prd = await prdLifecycleService.initializePrd(prdDetails);

      expect(mockDataPersistenceService.createPrd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: prdDetails.name,
          description: prdDetails.description,
        })
      );
      expect(prd).toEqual(mockCreatedPrd);
      expect(prd.id).toBe(mockCreatedPrd.id);
    });

    it('should throw an error if DataPersistenceService.createPrd fails', async () => {
      const prdDetails: InitializePrdDetails = {
        name: 'Test PRD Fail',
        description: 'Test Description Fail',
      };
      const expectedError = new Error('Create failed');
      mockDataPersistenceService.createPrd.mockRejectedValue(expectedError);

      await expect(
        prdLifecycleService.initializePrd(prdDetails)
      ).rejects.toThrow(expectedError);

      expect(mockDataPersistenceService.createPrd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: prdDetails.name,
          description: prdDetails.description,
        })
      );
    });
  });

  describe('getPrd', () => {
    it('should get a PRD by ID by calling DataPersistenceService.getPrdById', async () => {
      const prdId = crypto.randomUUID();
      const mockPrd = createTestPrd({ id: prdId, name: 'Fetched PRD' }); // Use fixture

      mockDataPersistenceService.getPrdById.mockResolvedValue(mockPrd);

      const prd = await prdLifecycleService.getPrd(prdId);

      expect(mockDataPersistenceService.getPrdById).toHaveBeenCalledWith(prdId);
      expect(prd).toEqual(mockPrd);
    });

    it('should return null if PRD not found', async () => {
      const prdId = 'non-existent-id';
      mockDataPersistenceService.getPrdById.mockResolvedValue(null);

      const prd = await prdLifecycleService.getPrd(prdId);

      expect(mockDataPersistenceService.getPrdById).toHaveBeenCalledWith(prdId);
      expect(prd).toBeNull();
    });
  });

  describe('listPrds', () => {
    it('should list all PRDs by calling DataPersistenceService.getAllPrds', async () => {
      const mockPrds: Prd[] = [
        createTestPrd({ name: 'PRD 1' }), // Use fixture
        createTestPrd({ name: 'PRD 2', status: 'completed' as PhaseStatus }), // Use fixture
      ];

      mockDataPersistenceService.getAllPrds.mockResolvedValue(mockPrds);

      const prds = await prdLifecycleService.listPrds();

      expect(mockDataPersistenceService.getAllPrds).toHaveBeenCalled();
      expect(prds).toEqual(mockPrds);
      expect(prds.length).toBe(2);
    });
  });

  describe('updatePrdStatus', () => {
    it('should update PRD status by calling DataPersistenceService.updatePrd', async () => {
      const prdId = crypto.randomUUID();
      const newStatus: PhaseStatus = 'completed';
      const updatedPrdMock = createTestPrd({ id: prdId, status: newStatus }); // Use fixture

      mockDataPersistenceService.updatePrd.mockResolvedValue(updatedPrdMock);

      const prd = await prdLifecycleService.updatePrdStatus(prdId, newStatus);

      expect(mockDataPersistenceService.updatePrd).toHaveBeenCalledWith(prdId, {
        status: newStatus,
      });
      expect(prd).toEqual(updatedPrdMock);
      expect(prd?.status).toBe(newStatus);
    });

    it('should return null if PRD to update status is not found', async () => {
      const prdId = 'non-existent-prd-id';
      const newStatus: PhaseStatus = 'completed';
      mockDataPersistenceService.updatePrd.mockResolvedValue(null);

      const prd = await prdLifecycleService.updatePrdStatus(prdId, newStatus);

      expect(mockDataPersistenceService.updatePrd).toHaveBeenCalledWith(prdId, {
        status: newStatus,
      });
      expect(prd).toBeNull();
    });
  });

  describe('updatePrdDetails', () => {
    it('should update PRD details by calling DataPersistenceService.updatePrd', async () => {
      const prdId = crypto.randomUUID();
      const detailsToUpdate = {
        name: 'Updated Name',
        description: 'Updated Description',
      };
      const updatedPrdMock = createTestPrd({ id: prdId, ...detailsToUpdate }); // Use fixture

      mockDataPersistenceService.updatePrd.mockResolvedValue(updatedPrdMock);

      const prd = await prdLifecycleService.updatePrdDetails(
        prdId,
        detailsToUpdate
      );

      expect(mockDataPersistenceService.updatePrd).toHaveBeenCalledWith(
        prdId,
        detailsToUpdate
      );
      expect(prd).toEqual(updatedPrdMock);
      expect(prd?.name).toBe(detailsToUpdate.name);
    });

    it('should return null if PRD to update details is not found', async () => {
      const prdId = 'non-existent-prd-id';
      const detailsToUpdate = {
        name: 'Updated Name',
        description: 'Updated Description',
      };
      mockDataPersistenceService.updatePrd.mockResolvedValue(null);

      const prd = await prdLifecycleService.updatePrdDetails(
        prdId,
        detailsToUpdate
      );

      expect(mockDataPersistenceService.updatePrd).toHaveBeenCalledWith(
        prdId,
        detailsToUpdate
      );
      expect(prd).toBeNull();
    });
  });

  describe('deletePrd', () => {
    const planId = 'test-plan-id';

    it('should call dataPersistenceService.deletePrd and return true on successful deletion', async () => {
      mockDataPersistenceService.deletePrd.mockResolvedValue(true);

      const result = await prdLifecycleService.deletePrd(planId);

      expect(mockDataPersistenceService.deletePrd).toHaveBeenCalledWith(planId);
      expect(result).toBe(true);
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        `[PrdLifecycleService] Deleting PRD with ID: ${planId}`
      );
      expect(mockLoggerService.info).toHaveBeenCalledWith(
        `[PrdLifecycleService] Successfully deleted PRD ID: ${planId}`
      );
    });

    it('should call dataPersistenceService.deletePrd and return false if deletion fails (e.g., not found)', async () => {
      mockDataPersistenceService.deletePrd.mockResolvedValue(false);

      const result = await prdLifecycleService.deletePrd(planId);

      expect(mockDataPersistenceService.deletePrd).toHaveBeenCalledWith(planId);
      expect(result).toBe(false);
      expect(mockLoggerService.warn).toHaveBeenCalledWith(
        `[PrdLifecycleService] Failed to delete PRD ID: ${planId} (not found or error).`
      );
    });

    it('should throw an error if dataPersistenceService.deletePrd throws an error', async () => {
      const errorMessage = 'Database error';
      mockDataPersistenceService.deletePrd.mockRejectedValue(
        new Error(errorMessage)
      );

      await expect(prdLifecycleService.deletePrd(planId)).rejects.toThrow(
        errorMessage
      );
      expect(mockDataPersistenceService.deletePrd).toHaveBeenCalledWith(planId);
      expect(mockLoggerService.error).toHaveBeenCalledWith(
        `[PrdLifecycleService] Error deleting PRD ID: ${planId}:`,
        expect.any(Error)
      );
    });
  });
});
