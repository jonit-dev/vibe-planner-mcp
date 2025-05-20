import crypto from 'crypto';
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { mock } from 'vitest-mock-extended';
import { LoggerService } from '../../../services/LoggerService';
import { PhaseRepository } from '../../repositories/PhaseRepository';
import { PrdRepository } from '../../repositories/PrdRepository';
import { TaskRepository } from '../../repositories/TaskRepository';
import { Phase, PhaseStatus, Prd, Task } from '../../types';
import { DataPersistenceService } from '../DataPersistenceService';
import { RepositoryProvider } from '../RepositoryProvider';

// Hoist the mock functions
const { mockDbRun, mockDbPrepare, mockDbTransaction } = vi.hoisted(() => {
  const mockDbRunFn = vi.fn();
  const mockDbPrepareFn = vi.fn(() => ({ run: mockDbRunFn }));
  const mockDbTransactionFn = vi.fn((cb) => cb());
  return {
    mockDbRun: mockDbRunFn,
    mockDbPrepare: mockDbPrepareFn,
    mockDbTransaction: mockDbTransactionFn,
  };
});

vi.mock('../../../services/db', () => ({
  db: {
    prepare: mockDbPrepare,
    transaction: mockDbTransaction,
    exec: vi.fn(),
  },
  initializeSchema: vi.fn(),
  closeDbConnection: vi.fn(),
}));

vi.mock('../../repositories/PrdRepository');
vi.mock('../../repositories/PhaseRepository');
vi.mock('../../repositories/TaskRepository');

// Helper functions for creating mock data
const createMockPrd = (overrides: Partial<Prd> = {}): Prd => ({
  id: crypto.randomUUID(),
  name: 'Test PRD',
  description: 'A PRD for testing',
  status: 'pending',
  creationDate: new Date(),
  updatedAt: new Date(),
  completionDate: null,
  phases: [],
  ...overrides,
});

const createMockPhase = (overrides: Partial<Phase> = {}): Phase => ({
  id: crypto.randomUUID(),
  prdId: crypto.randomUUID(),
  name: 'Test Phase',
  order: 1,
  description: 'A phase for testing',
  status: 'pending',
  creationDate: new Date(),
  updatedAt: new Date(),
  completionDate: null,
  tasks: [],
  ...overrides,
});

const createMockTask = (overrides: Partial<Task> = {}): Task => ({
  id: crypto.randomUUID(),
  phaseId: crypto.randomUUID(),
  name: 'Test Task',
  description: 'A task for testing',
  order: 1,
  status: 'pending',
  isValidated: false,
  creationDate: new Date(),
  updatedAt: new Date(),
  completionDate: null,
  dependencies: [],
  ...overrides,
});

describe('DataPersistenceService - PRD Management', () => {
  let service: DataPersistenceService;
  let mockPrdRepository: {
    create: MockInstance;
    findById: MockInstance;
    findAll: MockInstance;
    update: MockInstance;
    delete: MockInstance;
  };
  let mockPhaseRepository: {
    create: MockInstance;
    findById: MockInstance;
    findByPrdId: MockInstance;
    update: MockInstance;
    delete: MockInstance;
  };
  let mockTaskRepository: {
    create: MockInstance;
    findById: MockInstance;
    findByPhaseId: MockInstance;
    update: MockInstance;
    delete: MockInstance;
    getDependencies: MockInstance;
    addDependency: MockInstance;
    removeDependency: MockInstance;
  };
  let mockRepositoryProvider: RepositoryProvider;
  let mockLoggerService: LoggerService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockLoggerService = mock<LoggerService>();

    mockPrdRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findAll: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockPhaseRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPrdId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    };
    mockTaskRepository = {
      create: vi.fn(),
      findById: vi.fn(),
      findByPhaseId: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      getDependencies: vi.fn(),
      addDependency: vi.fn(),
      removeDependency: vi.fn(),
    };

    mockRepositoryProvider = {
      prdRepository: mockPrdRepository as unknown as PrdRepository,
      phaseRepository: mockPhaseRepository as unknown as PhaseRepository,
      taskRepository: mockTaskRepository as unknown as TaskRepository,
    } as RepositoryProvider;

    service = new DataPersistenceService(
      mockRepositoryProvider,
      mockLoggerService
    );
  });

  it('should create a PRD successfully', async () => {
    const prdData = {
      name: 'Test PRD',
      description: 'A PRD for testing',
      status: 'pending' as PhaseStatus,
    };
    const expectedPrd = createMockPrd({
      ...prdData,
      phases: [],
    });

    (mockPrdRepository.create as MockInstance).mockResolvedValue(expectedPrd);

    const prd = await service.createPrd(prdData);

    expect(mockPrdRepository.create).toHaveBeenCalledWith(prdData);
    expect(prd).toEqual(expectedPrd);
  });

  it('should get a PRD by ID and populate its phases', async () => {
    const prdId = crypto.randomUUID();
    const mockPrd = createMockPrd({ id: prdId, phases: undefined });
    const mockPhase = createMockPhase({ prdId, tasks: [] });
    const mockPhases: Phase[] = [mockPhase];

    (mockPrdRepository.findById as MockInstance).mockResolvedValue(mockPrd);
    (mockPhaseRepository.findByPrdId as MockInstance).mockImplementation(
      async (id: string) => {
        if (id === prdId) {
          return mockPhases.map((p) => ({ ...p, tasks: undefined }));
        }
        return [];
      }
    );
    (mockTaskRepository.findByPhaseId as MockInstance).mockResolvedValue([]); // For populating tasks within phases

    const fetchedPrd = await service.getPrdById(prdId);

    expect(mockPrdRepository.findById).toHaveBeenCalledWith(prdId);
    expect(mockPhaseRepository.findByPrdId).toHaveBeenCalledWith(prdId);
    mockPhases.forEach((phase) => {
      expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
        // This part means mockTaskRepository is needed
        phase.id,
        undefined
      );
    });
    expect(fetchedPrd).not.toBeNull();
    expect(fetchedPrd?.id).toBe(prdId);
    expect(fetchedPrd?.name).toBe(mockPrd.name);
    expect(fetchedPrd?.phases).toEqual(
      mockPhases.map((p) => ({ ...p, tasks: [] }))
    );
  });

  it('should return null for non-existent PRD ID when getting by ID', async () => {
    const nonExistentId = 'non-existent-id';
    (mockPrdRepository.findById as MockInstance).mockResolvedValue(null);

    const fetchedPrd = await service.getPrdById(nonExistentId);

    expect(mockPrdRepository.findById).toHaveBeenCalledWith(nonExistentId);
    expect(fetchedPrd).toBeNull();
  });

  it('should get all PRDs and populate their phases', async () => {
    const prd1Id = crypto.randomUUID();
    const prd2Id = crypto.randomUUID();
    const mockPrd1 = createMockPrd({
      id: prd1Id,
      creationDate: new Date(Date.now() - 1000),
      phases: undefined,
    });
    const mockPrd2 = createMockPrd({ id: prd2Id, phases: undefined });
    const mockPrdsFromRepo = [mockPrd1, mockPrd2];

    const mockPhasesForPrd1: Phase[] = [
      createMockPhase({ prdId: prd1Id, name: 'P1Phase1', tasks: [] }),
    ];
    const mockPhasesForPrd2: Phase[] = [
      createMockPhase({ prdId: prd2Id, name: 'P2Phase1', tasks: [] }),
    ];

    (mockPrdRepository.findAll as MockInstance).mockResolvedValue(
      mockPrdsFromRepo
    );
    (mockPhaseRepository.findByPrdId as MockInstance).mockImplementation(
      async (id: string) => {
        if (id === prd1Id) {
          return mockPhasesForPrd1.map((p) => ({ ...p, tasks: undefined }));
        }
        if (id === prd2Id) {
          return mockPhasesForPrd2.map((p) => ({ ...p, tasks: undefined }));
        }
        return [];
      }
    );
    (mockTaskRepository.findByPhaseId as MockInstance).mockResolvedValue([]); // For populating tasks within phases

    const prds = await service.getAllPrds();

    expect(mockPrdRepository.findAll).toHaveBeenCalled();
    expect(mockPhaseRepository.findByPrdId).toHaveBeenCalledWith(prd1Id);
    expect(mockPhaseRepository.findByPrdId).toHaveBeenCalledWith(prd2Id);
    mockPhasesForPrd1.forEach((phase) => {
      expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
        phase.id,
        undefined
      );
    });
    mockPhasesForPrd2.forEach((phase) => {
      expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
        phase.id,
        undefined
      );
    });
    expect(prds.length).toBe(2);
    expect(prds[0].name).toBe(mockPrd2.name);
    expect(prds[0].phases).toEqual(
      mockPhasesForPrd2.map((p) => ({ ...p, tasks: [] }))
    );
    expect(prds[1].name).toBe(mockPrd1.name);
    expect(prds[1].phases).toEqual(
      mockPhasesForPrd1.map((p) => ({ ...p, tasks: [] }))
    );
  });

  it('should update a PRD successfully and re-populate phases', async () => {
    const prdId = crypto.randomUUID();
    const updates = { name: 'Updated PRD Name', description: 'Updated desc' };
    const updatedPrdFromRepo = createMockPrd({
      ...updates,
      id: prdId,
      phases: undefined,
      updatedAt: new Date(Date.now() + 1000),
    });
    const mockPhases: Phase[] = [
      createMockPhase({ prdId, name: 'Phase Update', tasks: [] }),
    ];

    (mockPrdRepository.update as MockInstance).mockResolvedValue(
      updatedPrdFromRepo
    );
    (mockPhaseRepository.findByPrdId as MockInstance).mockImplementation(
      async (id: string) => {
        if (id === prdId) {
          return mockPhases.map((p) => ({ ...p, tasks: undefined }));
        }
        return [];
      }
    );
    (mockTaskRepository.findByPhaseId as MockInstance).mockResolvedValue([]); // For populating tasks within phases

    const updatedPrd = await service.updatePrd(prdId, updates);

    expect(mockPrdRepository.update).toHaveBeenCalledWith(prdId, updates);
    expect(mockPhaseRepository.findByPrdId).toHaveBeenCalledWith(prdId);
    expect(updatedPrd).not.toBeNull();
    expect(updatedPrd?.name).toBe(updates.name);
    expect(updatedPrd?.phases).toEqual(
      mockPhases.map((p) => ({ ...p, tasks: [] }))
    );
  });

  it('should return null when updating a non-existent PRD', async () => {
    const nonExistentId = 'non-existent-prd';
    const updates = { name: 'New Name' };
    (mockPrdRepository.update as MockInstance).mockResolvedValue(null);

    const result = await service.updatePrd(nonExistentId, updates);
    expect(mockPrdRepository.update).toHaveBeenCalledWith(
      nonExistentId,
      updates
    );
    expect(result).toBeNull();
  });

  it('should delete a PRD successfully', async () => {
    const prdId = crypto.randomUUID();
    (mockPrdRepository.delete as MockInstance).mockResolvedValue(true);

    const result = await service.deletePrd(prdId);
    expect(mockPrdRepository.delete).toHaveBeenCalledWith(prdId);
    expect(result).toBe(true);
  });

  it('should return false when deleting a non-existent PRD', async () => {
    const nonExistentId = 'non-existent-prd';
    (mockPrdRepository.delete as MockInstance).mockResolvedValue(false);

    const result = await service.deletePrd(nonExistentId);
    expect(mockPrdRepository.delete).toHaveBeenCalledWith(nonExistentId);
    expect(result).toBe(false);
  });
});
