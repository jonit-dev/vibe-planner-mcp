import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { PhaseStatus, PhaseStatusSchema, Prd, PrdSchema } from '../../types';
import { DataPersistenceService } from '../DataPersistenceService';
import {
  InitializePrdDetails,
  PrdLifecycleService,
} from '../PrdLifecycleService';

// Mock DataPersistenceService
const mockDataPersistenceService = mock<DataPersistenceService>();

// Use a factory to provide the mocked service instance for tsyringe
vi.mock('../DataPersistenceService', () => ({
  DataPersistenceService: vi.fn(() => mockDataPersistenceService),
}));

describe('PrdLifecycleService', () => {
  let prdLifecycleService: PrdLifecycleService;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear mocks before each test
    // Manually instantiate the service or use tsyringe if it's set up for tests
    // For simplicity here, direct instantiation with mocked dependency:
    prdLifecycleService = new PrdLifecycleService(mockDataPersistenceService);
  });

  describe('initializePrd', () => {
    it('should initialize a PRD and call DataPersistenceService.createPrd', async () => {
      const prdDetails: InitializePrdDetails = {
        name: 'Test PRD',
        description: 'Test Description',
      };
      const expectedPrdId = crypto.randomUUID();
      const now = new Date();
      const mockCreatedPrd: Prd = PrdSchema.parse({
        id: expectedPrdId,
        name: prdDetails.name,
        description: prdDetails.description,
        status: PhaseStatusSchema.enum.pending, // default status
        phases: [],
        creationDate: now,
        updatedAt: now,
        completionDate: null,
      });

      mockDataPersistenceService.createPrd.mockResolvedValue(mockCreatedPrd);

      const prd = await prdLifecycleService.initializePrd(prdDetails);

      expect(mockDataPersistenceService.createPrd).toHaveBeenCalledWith(
        expect.objectContaining({
          name: prdDetails.name,
          description: prdDetails.description,
        })
      );
      expect(prd).toEqual(mockCreatedPrd);
      expect(prd.id).toBe(expectedPrdId);
    });
  });

  describe('getPrd', () => {
    it('should get a PRD by ID by calling DataPersistenceService.getPrdById', async () => {
      const prdId = crypto.randomUUID();
      const now = new Date();
      const mockPrd: Prd = PrdSchema.parse({
        id: prdId,
        name: 'Fetched PRD',
        description: 'Fetched Description',
        status: PhaseStatusSchema.enum.pending,
        phases: [],
        creationDate: now,
        updatedAt: now,
        completionDate: null,
      });

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
      const now = new Date();
      const mockPrds: Prd[] = [
        PrdSchema.parse({
          id: crypto.randomUUID(),
          name: 'PRD 1',
          description: 'Desc 1',
          status: 'pending',
          phases: [],
          creationDate: now,
          updatedAt: now,
          completionDate: null,
        }),
        PrdSchema.parse({
          id: crypto.randomUUID(),
          name: 'PRD 2',
          description: 'Desc 2',
          status: 'completed',
          phases: [],
          creationDate: now,
          updatedAt: now,
          completionDate: null,
        }),
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
      const now = new Date();
      const updatedPrdMock: Prd = PrdSchema.parse({
        id: prdId,
        name: 'PRD To Update',
        description: 'Desc',
        status: newStatus,
        phases: [],
        creationDate: now,
        updatedAt: now,
        completionDate: null,
      });

      mockDataPersistenceService.updatePrd.mockResolvedValue(updatedPrdMock);

      const prd = await prdLifecycleService.updatePrdStatus(prdId, newStatus);

      expect(mockDataPersistenceService.updatePrd).toHaveBeenCalledWith(prdId, {
        status: newStatus,
      });
      expect(prd).toEqual(updatedPrdMock);
      expect(prd?.status).toBe(newStatus);
    });
  });

  describe('updatePrdDetails', () => {
    it('should update PRD details by calling DataPersistenceService.updatePrd', async () => {
      const prdId = crypto.randomUUID();
      const detailsToUpdate = {
        name: 'Updated Name',
        description: 'Updated Description',
      };
      const now = new Date();
      const updatedPrdMock: Prd = PrdSchema.parse({
        id: prdId,
        ...detailsToUpdate,
        status: 'pending',
        phases: [],
        creationDate: now,
        updatedAt: now,
        completionDate: null,
      });

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
  });
});
