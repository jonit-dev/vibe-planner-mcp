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

describe('DataPersistenceService - Phase Management', () => {
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
  let getTaskDependenciesSpy: MockInstance<[taskId: string], Promise<string[]>>;
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

  let testPrdId: string;

  beforeEach(() => {
    testPrdId = crypto.randomUUID();
  });

  it('should create a Phase successfully', async () => {
    const phaseData = {
      name: 'Design Phase',
      description: 'Phase for design work',
      order: 1,
      prdId: testPrdId,
      status: 'pending' as PhaseStatus,
    };
    const expectedPhase = createMockPhase({
      ...phaseData,
      tasks: [],
    });
    mockPhaseRepository.create.mockResolvedValue(expectedPhase);
    const phase = await service.createPhase(phaseData);
    expect(mockPhaseRepository.create).toHaveBeenCalledWith(phaseData);
    expect(phase).toEqual(expectedPhase);
  });

  it('should get a Phase by ID and populate its tasks', async () => {
    const phaseId = crypto.randomUUID();
    const mockPhaseFromRepo = createMockPhase({
      id: phaseId,
      prdId: testPrdId,
      status: 'in_progress',
      tasks: undefined,
    });
    const mockTask = createMockTask({ phaseId, name: 'Task 1' });
    const mockTasks: Task[] = [mockTask];

    mockPhaseRepository.findById.mockResolvedValue(mockPhaseFromRepo);
    (mockTaskRepository.findByPhaseId as MockInstance).mockImplementation(
      async (id: string) => {
        if (id === phaseId) {
          return mockTasks.map((t) => ({ ...t, dependencies: undefined }));
        }
        return [];
      }
    );

    getTaskDependenciesSpy = vi.spyOn(
      service as any,
      'getTaskDependencies'
    ) as MockInstance<[string], Promise<string[]>>;
    getTaskDependenciesSpy.mockResolvedValue([]);

    const fetchedPhase = await service.getPhaseById(phaseId);

    expect(mockPhaseRepository.findById).toHaveBeenCalledWith(phaseId);
    expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
      phaseId,
      undefined
    );
    if (mockTasks.length > 0) {
      expect(getTaskDependenciesSpy).toHaveBeenCalledWith(mockTasks[0].id);
    }
    expect(fetchedPhase).not.toBeNull();
    expect(fetchedPhase?.id).toBe(phaseId);
    expect(fetchedPhase?.tasks).toEqual(
      mockTasks.map((t) => ({ ...t, dependencies: [] }))
    );
    getTaskDependenciesSpy.mockRestore();
  });

  it('should return null when getting a non-existent Phase by ID', async () => {
    const nonExistentId = 'non-existent-phase';
    mockPhaseRepository.findById.mockResolvedValue(null);
    const phase = await service.getPhaseById(nonExistentId);
    expect(mockPhaseRepository.findById).toHaveBeenCalledWith(nonExistentId);
    expect(phase).toBeNull();
  });

  it('should get Phases by PRD ID and populate their tasks', async () => {
    const phase1Id = crypto.randomUUID();
    const phase2Id = crypto.randomUUID();
    const mockPhase1FromRepo = createMockPhase({
      id: phase1Id,
      prdId: testPrdId,
      name: 'Phase A',
      order: 1,
      tasks: undefined,
    });
    const mockPhase2FromRepo = createMockPhase({
      id: phase2Id,
      prdId: testPrdId,
      name: 'Phase B',
      order: 2,
      status: 'in_progress',
      tasks: undefined,
    });
    const mockPhasesFromRepo = [mockPhase1FromRepo, mockPhase2FromRepo];

    const mockTaskForPhase1 = createMockTask({
      phaseId: phase1Id,
      name: 'P1Task1',
    });
    const mockTasksForPhase1: Task[] = [mockTaskForPhase1];
    const mockTasksForPhase2: Task[] = [];

    mockPhaseRepository.findByPrdId.mockResolvedValue(mockPhasesFromRepo);
    (mockTaskRepository.findByPhaseId as MockInstance).mockImplementation(
      async (id: string) => {
        if (id === phase1Id) {
          return mockTasksForPhase1.map((t) => ({
            ...t,
            dependencies: undefined,
          }));
        }
        if (id === phase2Id) {
          return mockTasksForPhase2;
        }
        return [];
      }
    );

    getTaskDependenciesSpy = vi.spyOn(
      service as any,
      'getTaskDependencies'
    ) as MockInstance<[string], Promise<string[]>>;
    getTaskDependenciesSpy.mockResolvedValue([]);

    const phases = await service.getPhasesByPrdId(testPrdId);

    expect(mockPhaseRepository.findByPrdId).toHaveBeenCalledWith(testPrdId);
    expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
      phase1Id,
      undefined
    );
    expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
      phase2Id,
      undefined
    );
    if (mockTasksForPhase1.length > 0 && mockTasksForPhase1[0]) {
      expect(getTaskDependenciesSpy).toHaveBeenCalledWith(
        mockTasksForPhase1[0].id
      );
    }

    expect(phases.length).toBe(2);
    expect(phases[0].name).toBe('Phase A');
    expect(phases[0].tasks).toEqual(
      mockTasksForPhase1.map((t) => ({ ...t, dependencies: [] }))
    );
    expect(phases[1].name).toBe('Phase B');
    expect(phases[1].tasks).toEqual(mockTasksForPhase2);
    getTaskDependenciesSpy.mockRestore();
  });

  it('should update a Phase successfully and re-populate tasks', async () => {
    const phaseId = crypto.randomUUID();
    const updates = {
      name: 'Updated Phase Name',
      status: 'completed' as PhaseStatus,
    };
    const updatedPhaseFromRepo = createMockPhase({
      ...updates,
      id: phaseId,
      prdId: testPrdId,
      tasks: undefined,
      updatedAt: new Date(Date.now() + 1000),
    });
    const mockTaskItem = createMockTask({ phaseId, name: 'Task Update' });
    const mockTasks: Task[] = [mockTaskItem];

    mockPhaseRepository.update.mockResolvedValue(updatedPhaseFromRepo);
    (mockTaskRepository.findByPhaseId as MockInstance).mockImplementation(
      async (id: string) => {
        if (id === phaseId) {
          return mockTasks.map((t) => ({ ...t, dependencies: undefined }));
        }
        return [];
      }
    );

    getTaskDependenciesSpy = vi.spyOn(
      service as any,
      'getTaskDependencies'
    ) as MockInstance<[string], Promise<string[]>>;
    getTaskDependenciesSpy.mockResolvedValue([]);

    const updatedPhase = await service.updatePhase(phaseId, updates);

    expect(mockPhaseRepository.update).toHaveBeenCalledWith(phaseId, updates);
    expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
      phaseId,
      undefined
    );
    if (mockTasks.length > 0) {
      expect(getTaskDependenciesSpy).toHaveBeenCalledWith(mockTasks[0].id);
    }
    expect(updatedPhase).not.toBeNull();
    expect(updatedPhase?.name).toBe(updates.name);
    expect(updatedPhase?.tasks).toEqual(
      mockTasks.map((t) => ({ ...t, dependencies: [] }))
    );
    getTaskDependenciesSpy.mockRestore();
  });

  it('should return null when updating a non-existent phase', async () => {
    const nonExistentId = 'non-existent-phase';
    const updates = { name: 'New Phase Name' };
    mockPhaseRepository.update.mockResolvedValue(null);
    const result = await service.updatePhase(nonExistentId, updates);
    expect(mockPhaseRepository.update).toHaveBeenCalledWith(
      nonExistentId,
      updates
    );
    expect(result).toBeNull();
  });

  it('should delete a Phase successfully', async () => {
    const phaseId = crypto.randomUUID();
    mockPhaseRepository.delete.mockResolvedValue(true);
    const result = await service.deletePhase(phaseId);
    expect(mockPhaseRepository.delete).toHaveBeenCalledWith(phaseId);
    expect(result).toBe(true);
  });

  it('should return false when deleting a non-existent phase', async () => {
    const nonExistentId = 'non-existent-phase';
    mockPhaseRepository.delete.mockResolvedValue(false);
    const result = await service.deletePhase(nonExistentId);
    expect(mockPhaseRepository.delete).toHaveBeenCalledWith(nonExistentId);
    expect(result).toBe(false);
  });
});
