import crypto from 'crypto';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import {
  Phase,
  PhaseSchema,
  PhaseStatus,
  PhaseStatusSchema,
  TaskSchema,
} from '../../types';
import { DataPersistenceService } from '../DataPersistenceService';
import {
  AddPhaseDetails,
  PhaseControlService,
  UpdatePhaseDetails,
} from '../PhaseControlService';

// Mock DataPersistenceService
const mockDataPersistenceService = mock<DataPersistenceService>();

// Use a factory to provide the mocked service instance for tsyringe
vi.mock('../DataPersistenceService', () => ({
  DataPersistenceService: vi.fn(() => mockDataPersistenceService),
}));

describe('PhaseControlService', () => {
  let phaseControlService: PhaseControlService;
  let samplePrdId: string;

  beforeEach(() => {
    vi.clearAllMocks();
    phaseControlService = new PhaseControlService(mockDataPersistenceService);
    samplePrdId = crypto.randomUUID();
  });

  const createMockPhase = (details: Partial<Phase> = {}): Phase => {
    const now = new Date();
    return PhaseSchema.parse({
      id: crypto.randomUUID(),
      name: 'Sample Phase',
      description: 'Sample phase description',
      order: 1,
      status: PhaseStatusSchema.enum.pending,
      prdId: samplePrdId,
      tasks: [],
      creationDate: now,
      updatedAt: now,
      completionDate: null,
      ...details,
    });
  };

  describe('addPhaseToPrd', () => {
    it('should add a phase to a PRD and call DataPersistenceService.createPhase', async () => {
      const phaseDetails: AddPhaseDetails = {
        name: 'New Phase',
        order: 1,
        description: 'New Phase Desc',
      };
      const mockCreatedPhase = createMockPhase({
        ...phaseDetails,
        prdId: samplePrdId,
      });

      mockDataPersistenceService.createPhase.mockResolvedValue(
        mockCreatedPhase
      );

      const phase = await phaseControlService.addPhaseToPrd(
        samplePrdId,
        phaseDetails
      );

      expect(mockDataPersistenceService.createPhase).toHaveBeenCalledWith(
        expect.objectContaining({
          ...phaseDetails,
          prdId: samplePrdId,
        })
      );
      expect(phase).toEqual(mockCreatedPhase);
    });

    it('should throw an error if DataPersistenceService.createPhase fails', async () => {
      const phaseDetails: AddPhaseDetails = {
        name: 'New Phase Fail',
        order: 1,
        description: 'New Phase Desc Fail',
      };
      const expectedError = new Error('Create phase failed');
      mockDataPersistenceService.createPhase.mockRejectedValue(expectedError);

      await expect(
        phaseControlService.addPhaseToPrd(samplePrdId, phaseDetails)
      ).rejects.toThrow(expectedError);

      expect(mockDataPersistenceService.createPhase).toHaveBeenCalledWith(
        expect.objectContaining({
          ...phaseDetails,
          prdId: samplePrdId,
        })
      );
    });
  });

  describe('getPhaseById', () => {
    it('should get a phase by ID using DataPersistenceService', async () => {
      const phaseId = crypto.randomUUID();
      const mockPhase = createMockPhase({ id: phaseId });
      mockDataPersistenceService.getPhaseById.mockResolvedValue(mockPhase);

      const phase = await phaseControlService.getPhaseById(phaseId);

      expect(mockDataPersistenceService.getPhaseById).toHaveBeenCalledWith(
        phaseId
      );
      expect(phase).toEqual(mockPhase);
    });

    it('should return null if phase not found', async () => {
      const phaseId = 'non-existent-phase';
      mockDataPersistenceService.getPhaseById.mockResolvedValue(null);
      const phase = await phaseControlService.getPhaseById(phaseId);
      expect(phase).toBeNull();
    });
  });

  describe('getPhasesForPrd', () => {
    it('should get phases for a PRD using DataPersistenceService', async () => {
      const mockPhases = [
        createMockPhase(),
        createMockPhase({ name: 'Phase 2', order: 2 }),
      ];
      mockDataPersistenceService.getPhasesByPrdId.mockResolvedValue(mockPhases);

      const phases = await phaseControlService.getPhasesForPrd(samplePrdId);

      expect(mockDataPersistenceService.getPhasesByPrdId).toHaveBeenCalledWith(
        samplePrdId
      );
      expect(phases).toEqual(mockPhases);
      expect(phases.length).toBe(2);
    });

    it('should return an empty array if no phases found for a PRD', async () => {
      mockDataPersistenceService.getPhasesByPrdId.mockResolvedValue([]);
      const phases = await phaseControlService.getPhasesForPrd(samplePrdId);
      expect(mockDataPersistenceService.getPhasesByPrdId).toHaveBeenCalledWith(
        samplePrdId
      );
      expect(phases).toEqual([]);
    });
  });

  describe('getPhasesWithTasks', () => {
    it('should be an alias for getPhasesForPrd and return phases with tasks', async () => {
      const mockTask = TaskSchema.parse({
        id: crypto.randomUUID(),
        name: 'Task 1',
        phaseId: crypto.randomUUID(),
        order: 1,
        status: 'pending',
        creationDate: new Date(),
        updatedAt: new Date(),
        isValidated: false,
        dependencies: [],
      });
      const mockPhaseWithTask = createMockPhase({ tasks: [mockTask] });
      mockDataPersistenceService.getPhasesByPrdId.mockResolvedValue([
        mockPhaseWithTask,
      ]);

      const phases = await phaseControlService.getPhasesWithTasks(samplePrdId);

      expect(mockDataPersistenceService.getPhasesByPrdId).toHaveBeenCalledWith(
        samplePrdId
      );
      expect(phases).toBeDefined();
      expect(phases.length).toBeGreaterThan(0);
      if (phases && phases.length > 0) {
        expect(phases[0]?.tasks?.length).toBe(1);
        expect(phases[0]?.tasks?.[0]?.name).toBe('Task 1');
      }
    });

    it('should return empty array from getPhasesWithTasks if no phases exist', async () => {
      mockDataPersistenceService.getPhasesByPrdId.mockResolvedValue([]);
      const phases = await phaseControlService.getPhasesWithTasks(samplePrdId);
      expect(mockDataPersistenceService.getPhasesByPrdId).toHaveBeenCalledWith(
        samplePrdId
      );
      expect(phases).toEqual([]);
    });

    it('should return phases with empty tasks array from getPhasesWithTasks if phases exist but have no tasks', async () => {
      const mockPhaseWithoutTask = createMockPhase({ tasks: [] });
      mockDataPersistenceService.getPhasesByPrdId.mockResolvedValue([
        mockPhaseWithoutTask,
      ]);

      const phases = await phaseControlService.getPhasesWithTasks(samplePrdId);

      expect(mockDataPersistenceService.getPhasesByPrdId).toHaveBeenCalledWith(
        samplePrdId
      );
      expect(phases).toBeDefined();
      expect(phases.length).toBe(1);
      if (phases && phases.length > 0) {
        expect(phases[0]?.tasks?.length).toBe(0);
      }
    });
  });

  describe('updatePhase', () => {
    it('should update phase details using DataPersistenceService', async () => {
      const phaseId = crypto.randomUUID();
      const updates: UpdatePhaseDetails = {
        name: 'Updated Phase Name',
        status: 'completed',
      };
      const mockUpdatedPhase = createMockPhase({ id: phaseId, ...updates });
      mockDataPersistenceService.updatePhase.mockResolvedValue(
        mockUpdatedPhase
      );

      const phase = await phaseControlService.updatePhase(phaseId, updates);

      expect(mockDataPersistenceService.updatePhase).toHaveBeenCalledWith(
        phaseId,
        updates
      );
      expect(phase).toEqual(mockUpdatedPhase);
      expect(phase?.name).toBe(updates.name);
      expect(phase?.status).toBe(updates.status);
    });

    it('should return null if phase to update is not found', async () => {
      const phaseId = 'non-existent-phase-id';
      const updates: UpdatePhaseDetails = {
        name: 'Updated Phase Name',
      };
      mockDataPersistenceService.updatePhase.mockResolvedValue(null);

      const phase = await phaseControlService.updatePhase(phaseId, updates);

      expect(mockDataPersistenceService.updatePhase).toHaveBeenCalledWith(
        phaseId,
        updates
      );
      expect(phase).toBeNull();
    });
  });

  describe('updatePhaseStatus', () => {
    it('should update phase status using DataPersistenceService', async () => {
      const phaseId = crypto.randomUUID();
      const newStatus: PhaseStatus = 'on_hold';
      const mockUpdatedPhase = createMockPhase({
        id: phaseId,
        status: newStatus,
      });
      mockDataPersistenceService.updatePhase.mockResolvedValue(
        mockUpdatedPhase
      );

      const phase = await phaseControlService.updatePhaseStatus(
        phaseId,
        newStatus
      );

      expect(mockDataPersistenceService.updatePhase).toHaveBeenCalledWith(
        phaseId,
        { status: newStatus }
      );
      expect(phase).toEqual(mockUpdatedPhase);
      expect(phase?.status).toBe(newStatus);
    });

    it('should return null if phase to update status is not found', async () => {
      const phaseId = 'non-existent-phase-id';
      const newStatus: PhaseStatus = 'on_hold';
      mockDataPersistenceService.updatePhase.mockResolvedValue(null);

      const phase = await phaseControlService.updatePhaseStatus(
        phaseId,
        newStatus
      );

      expect(mockDataPersistenceService.updatePhase).toHaveBeenCalledWith(
        phaseId,
        { status: newStatus }
      );
      expect(phase).toBeNull();
    });
  });
});
