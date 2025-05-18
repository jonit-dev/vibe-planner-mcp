import crypto from 'crypto'; // For generating IDs in mock data
import { beforeEach, describe, expect, it, MockInstance, vi } from 'vitest';
import { mockDeep, MockProxy } from 'vitest-mock-extended';
import { PhaseRepository } from '../../repositories/PhaseRepository';
import { PrdRepository } from '../../repositories/PrdRepository';
import { TaskRepository } from '../../repositories/TaskRepository';
import { Phase, PhaseStatus, Prd, Task, TaskStatus } from '../../types';
import { DataPersistenceService } from '../DataPersistenceService';

// Hoist the mock functions
const { mockDbRun, mockDbPrepare, mockDbTransaction } = vi.hoisted(() => {
  const mockDbRunFn = vi.fn(); // Renamed to avoid conflict if used directly
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
    exec: vi.fn(), // General mock for exec if needed elsewhere
  },
  initializeSchema: vi.fn(),
  closeDbConnection: vi.fn(),
}));

// Mock the repositories
vi.mock('../../repositories/PrdRepository');
vi.mock('../../repositories/PhaseRepository');
vi.mock('../../repositories/TaskRepository');

describe('DataPersistenceService', () => {
  let service: DataPersistenceService;
  let mockPrdRepository: MockProxy<PrdRepository>;
  let mockPhaseRepository: MockProxy<PhaseRepository>;
  let mockTaskRepository: MockProxy<TaskRepository>;
  let getTaskDependenciesSpy: MockInstance<[taskId: string], Promise<string[]>>;

  beforeEach(() => {
    vi.clearAllMocks(); // Clear all mocks before each test, including db mocks
    mockPrdRepository = mockDeep<PrdRepository>();
    mockPhaseRepository = mockDeep<PhaseRepository>();
    mockTaskRepository = mockDeep<TaskRepository>();

    service = new DataPersistenceService(
      mockPrdRepository,
      mockPhaseRepository,
      mockTaskRepository
    );
  });

  // afterAll can be removed if closeDbConnection was its only purpose
  // afterAll(() => { /* closeDbConnection(); */ });

  describe('PRD Management', () => {
    it('should create a PRD successfully', async () => {
      const prdData = {
        name: 'Test PRD',
        description: 'A PRD for testing',
        status: 'pending' as PhaseStatus,
      };
      const expectedPrdId = crypto.randomUUID();
      const expectedCreationDate = new Date();
      const expectedPrd: Prd = {
        ...prdData,
        id: expectedPrdId,
        creationDate: expectedCreationDate,
        updatedAt: expectedCreationDate,
        completionDate: null,
        phases: [], // create in repo doesn't add phases
      };

      mockPrdRepository.create.mockResolvedValue(expectedPrd);

      const prd = await service.createPrd(prdData);

      expect(mockPrdRepository.create).toHaveBeenCalledWith(prdData);
      expect(prd).toEqual(expectedPrd);
    });

    it('should get a PRD by ID and populate its phases', async () => {
      const prdId = crypto.randomUUID();
      const mockPrd: Prd = {
        id: prdId,
        name: 'Test PRD Get',
        description: 'Fetch me',
        status: 'pending',
        creationDate: new Date(),
        updatedAt: new Date(),
        completionDate: null,
        phases: undefined, // Initially undefined/not populated by repo
      };
      const mockPhases: Phase[] = [
        {
          id: crypto.randomUUID(),
          prdId,
          name: 'Phase 1',
          order: 1,
          status: 'pending',
          creationDate: new Date(),
          updatedAt: new Date(),
          completionDate: null,
          tasks: [],
        },
      ];

      mockPrdRepository.findById.mockResolvedValue(mockPrd);
      // Mock getPhasesByPrdId (which internally calls phaseRepository.findByPrdId and then getTasksByPhaseId)
      // For simplicity now, let's assume getPhasesByPrdId will be called and mock its direct dependencies if needed
      // OR we can mock what phaseRepository.findByPrdId itself returns, and then taskRepository.findByPhaseId for its tasks
      mockPhaseRepository.findByPrdId.mockResolvedValue(
        mockPhases.map((p) => ({ ...p, tasks: undefined }))
      ); // flat phases from repo
      mockTaskRepository.findByPhaseId.mockResolvedValue([]); // assume no tasks for this phase for simplicity here

      const fetchedPrd = await service.getPrdById(prdId);

      expect(mockPrdRepository.findById).toHaveBeenCalledWith(prdId);
      expect(mockPhaseRepository.findByPrdId).toHaveBeenCalledWith(prdId); // Service calls this internally
      // When getPhasesByPrdId calls getTasksByPhaseId for each phase, it will pass undefined for statusFilter
      mockPhases.forEach((phase) => {
        expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
          phase.id,
          undefined
        );
      });
      expect(fetchedPrd).not.toBeNull();
      expect(fetchedPrd?.id).toBe(prdId);
      expect(fetchedPrd?.name).toBe(mockPrd.name);
      expect(fetchedPrd?.phases).toEqual(mockPhases); // Check populated phases
    });

    it('should return null for non-existent PRD ID when getting by ID', async () => {
      const nonExistentId = 'non-existent-id';
      mockPrdRepository.findById.mockResolvedValue(null);

      const fetchedPrd = await service.getPrdById(nonExistentId);

      expect(mockPrdRepository.findById).toHaveBeenCalledWith(nonExistentId);
      expect(fetchedPrd).toBeNull();
    });

    it('should get all PRDs and populate their phases', async () => {
      const prd1Id = crypto.randomUUID();
      const prd2Id = crypto.randomUUID();
      const mockPrd1: Prd = {
        id: prd1Id,
        name: 'PRD 1',
        status: 'pending',
        creationDate: new Date(Date.now() - 1000),
        updatedAt: new Date(),
        completionDate: null,
        phases: undefined,
      }; // older
      const mockPrd2: Prd = {
        id: prd2Id,
        name: 'PRD 2',
        status: 'pending',
        creationDate: new Date(),
        updatedAt: new Date(),
        completionDate: null,
        phases: undefined,
      }; // newer
      const mockPrdsFromRepo = [mockPrd1, mockPrd2]; // Order from repo might not be guaranteed, service sorts.

      const mockPhasesForPrd1: Phase[] = [
        {
          id: crypto.randomUUID(),
          prdId: prd1Id,
          name: 'P1Phase1',
          order: 1,
          status: 'pending',
          creationDate: new Date(),
          updatedAt: new Date(),
          completionDate: null,
          tasks: [],
        },
      ];
      const mockPhasesForPrd2: Phase[] = [
        {
          id: crypto.randomUUID(),
          prdId: prd2Id,
          name: 'P2Phase1',
          order: 1,
          status: 'pending',
          creationDate: new Date(),
          updatedAt: new Date(),
          completionDate: null,
          tasks: [],
        },
      ];

      mockPrdRepository.findAll.mockResolvedValue(mockPrdsFromRepo);
      // Mock calls to getPhasesByPrdId (which means mocking phaseRepo.findByPrdId and taskRepo.findByPhaseId for each prd)
      mockPhaseRepository.findByPrdId
        .calledWith(prd1Id)
        .mockResolvedValue(
          mockPhasesForPrd1.map((p) => ({ ...p, tasks: undefined }))
        );
      mockPhaseRepository.findByPrdId
        .calledWith(prd2Id)
        .mockResolvedValue(
          mockPhasesForPrd2.map((p) => ({ ...p, tasks: undefined }))
        );
      mockTaskRepository.findByPhaseId.mockResolvedValue([]); // For all task lookups in this test

      const prds = await service.getAllPrds();

      expect(mockPrdRepository.findAll).toHaveBeenCalled();
      expect(mockPhaseRepository.findByPrdId).toHaveBeenCalledWith(prd1Id);
      expect(mockPhaseRepository.findByPrdId).toHaveBeenCalledWith(prd2Id);
      // Check that findByPhaseId on task repo was called for each phase with undefined filter
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
      // Service sorts by creationDate DESC
      expect(prds[0].name).toBe('PRD 2');
      expect(prds[0].phases).toEqual(mockPhasesForPrd2);
      expect(prds[1].name).toBe('PRD 1');
      expect(prds[1].phases).toEqual(mockPhasesForPrd1);
    });

    it('should update a PRD successfully and re-populate phases', async () => {
      const prdId = crypto.randomUUID();
      const updates = { name: 'Updated PRD Name', description: 'Updated desc' };
      const updatedPrdFromRepo: Prd = {
        id: prdId,
        name: updates.name,
        description: updates.description,
        status: 'pending',
        creationDate: new Date(),
        updatedAt: new Date(Date.now() + 1000),
        completionDate: null,
        phases: undefined, // Not populated by repo update
      };
      const mockPhases: Phase[] = [
        {
          id: crypto.randomUUID(),
          prdId,
          name: 'Phase Update',
          order: 1,
          status: 'pending',
          creationDate: new Date(),
          updatedAt: new Date(),
          completionDate: null,
          tasks: [],
        },
      ];

      mockPrdRepository.update.mockResolvedValue(updatedPrdFromRepo);
      mockPhaseRepository.findByPrdId
        .calledWith(prdId)
        .mockResolvedValue(mockPhases.map((p) => ({ ...p, tasks: undefined })));
      mockTaskRepository.findByPhaseId.mockResolvedValue([]);

      const updatedPrd = await service.updatePrd(prdId, updates);

      expect(mockPrdRepository.update).toHaveBeenCalledWith(prdId, updates);
      expect(mockPhaseRepository.findByPrdId).toHaveBeenCalledWith(prdId);
      expect(updatedPrd).not.toBeNull();
      expect(updatedPrd?.name).toBe(updates.name);
      expect(updatedPrd?.phases).toEqual(mockPhases);
    });

    it('should return null when updating a non-existent PRD', async () => {
      const nonExistentId = 'non-existent-prd';
      const updates = { name: 'New Name' };
      mockPrdRepository.update.mockResolvedValue(null);

      const result = await service.updatePrd(nonExistentId, updates);

      expect(mockPrdRepository.update).toHaveBeenCalledWith(
        nonExistentId,
        updates
      );
      expect(result).toBeNull();
    });

    it('should delete a PRD successfully', async () => {
      const prdId = crypto.randomUUID();
      mockPrdRepository.delete.mockResolvedValue(true);

      const result = await service.deletePrd(prdId);

      expect(mockPrdRepository.delete).toHaveBeenCalledWith(prdId);
      expect(result).toBe(true);
    });

    it('should return false when deleting a non-existent PRD', async () => {
      const nonExistentId = 'non-existent-prd';
      mockPrdRepository.delete.mockResolvedValue(false);

      const result = await service.deletePrd(nonExistentId);
      expect(mockPrdRepository.delete).toHaveBeenCalledWith(nonExistentId);
      expect(result).toBe(false);
    });
  });

  describe('Phase Management', () => {
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
      const expectedPhaseId = crypto.randomUUID();
      const expectedCreationDate = new Date();
      const expectedPhase: Phase = {
        ...phaseData,
        id: expectedPhaseId,
        creationDate: expectedCreationDate,
        updatedAt: expectedCreationDate,
        completionDate: null,
        tasks: [],
      };
      mockPhaseRepository.create.mockResolvedValue(expectedPhase);
      const phase = await service.createPhase(phaseData);
      expect(mockPhaseRepository.create).toHaveBeenCalledWith(phaseData);
      expect(phase).toEqual(expectedPhase);
    });

    it('should get a Phase by ID and populate its tasks', async () => {
      const phaseId = crypto.randomUUID();
      const mockPhaseFromRepo: Phase = {
        id: phaseId,
        prdId: testPrdId,
        name: 'Dev Phase',
        order: 1,
        status: 'in_progress',
        creationDate: new Date(),
        updatedAt: new Date(),
        completionDate: null,
        tasks: undefined,
      };
      const mockTasks: Task[] = [
        {
          id: crypto.randomUUID(),
          phaseId,
          name: 'Task 1',
          order: 1,
          status: 'pending',
          creationDate: new Date(),
          updatedAt: new Date(),
          completionDate: null,
          isValidated: false,
          dependencies: [],
        },
      ];

      mockPhaseRepository.findById.mockResolvedValue(mockPhaseFromRepo);
      mockTaskRepository.findByPhaseId.mockResolvedValue(
        mockTasks.map((t) => ({ ...t, dependencies: undefined }))
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
      const mockPhase1FromRepo: Phase = {
        id: phase1Id,
        prdId: testPrdId,
        name: 'Phase A',
        order: 1,
        status: 'pending',
        creationDate: new Date(),
        updatedAt: new Date(),
        completionDate: null,
        tasks: undefined,
      };
      const mockPhase2FromRepo: Phase = {
        id: phase2Id,
        prdId: testPrdId,
        name: 'Phase B',
        order: 2,
        status: 'in_progress',
        creationDate: new Date(),
        updatedAt: new Date(),
        completionDate: null,
        tasks: undefined,
      };
      const mockPhasesFromRepo = [mockPhase1FromRepo, mockPhase2FromRepo];

      const mockTasksForPhase1: Task[] = [
        {
          id: crypto.randomUUID(),
          phaseId: phase1Id,
          name: 'P1Task1',
          order: 1,
          status: 'pending',
          creationDate: new Date(),
          updatedAt: new Date(),
          completionDate: null,
          isValidated: false,
          dependencies: [],
        },
      ];
      const mockTasksForPhase2: Task[] = [];

      mockPhaseRepository.findByPrdId.mockResolvedValue(mockPhasesFromRepo);
      mockTaskRepository.findByPhaseId
        .calledWith(phase1Id)
        .mockResolvedValue(
          mockTasksForPhase1.map((t) => ({ ...t, dependencies: undefined }))
        );
      mockTaskRepository.findByPhaseId
        .calledWith(phase2Id)
        .mockResolvedValue(mockTasksForPhase2);

      getTaskDependenciesSpy = vi.spyOn(
        service as any,
        'getTaskDependencies'
      ) as MockInstance<[string], Promise<string[]>>;
      // The complex mockImplementation was causing an error and is overridden by mockResolvedValue anyway.
      // For this test, we just need getTaskDependencies to return an empty array for any task it's called with.
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
        // Ensure task exists before checking spy
        expect(getTaskDependenciesSpy).toHaveBeenCalledWith(
          mockTasksForPhase1[0].id
        );
      }
      // It might also be called for tasks in phase2 if any existed, here it would be with undefined if tasks array is empty
      // Depending on strictness, one might check it wasn't called for phase2 if no tasks

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
      const updatedPhaseFromRepo: Phase = {
        id: phaseId,
        prdId: testPrdId,
        name: updates.name,
        status: updates.status,
        order: 1,
        creationDate: new Date(),
        updatedAt: new Date(Date.now() + 1000),
        completionDate: null,
        tasks: undefined,
      };
      const mockTasks: Task[] = [
        {
          id: crypto.randomUUID(),
          phaseId,
          name: 'Task Update',
          order: 1,
          status: 'pending',
          creationDate: new Date(),
          updatedAt: new Date(),
          completionDate: null,
          isValidated: false,
          dependencies: [],
        },
      ];

      mockPhaseRepository.update.mockResolvedValue(updatedPhaseFromRepo);
      mockTaskRepository.findByPhaseId
        .calledWith(phaseId)
        .mockResolvedValue(
          mockTasks.map((t) => ({ ...t, dependencies: undefined }))
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

  describe('Task Management', () => {
    let testPhaseId: string;

    beforeEach(() => {
      testPhaseId = crypto.randomUUID();
    });

    afterEach(() => {
      if (getTaskDependenciesSpy) getTaskDependenciesSpy.mockRestore();
    });

    it('should create a Task successfully', async () => {
      const taskData = {
        name: 'Implement Feature X',
        description: 'Details for X',
        order: 1,
        phaseId: testPhaseId,
        status: 'pending' as TaskStatus,
        isValidated: false,
      };
      const expectedTaskId = crypto.randomUUID();
      const expectedCreationDate = new Date();
      const returnedTaskFromRepo: Task = {
        ...taskData,
        id: expectedTaskId,
        creationDate: expectedCreationDate,
        updatedAt: expectedCreationDate,
        completionDate: null,
        dependencies: [], // Repo create returns flat entity
      };

      mockTaskRepository.create.mockResolvedValue(returnedTaskFromRepo);
      const serviceTask = await service.createTask(taskData);

      expect(mockTaskRepository.create).toHaveBeenCalledWith(taskData); // service passes data almost directly
      expect(serviceTask).toEqual(returnedTaskFromRepo); // service returns what repo returns
    });

    it('should get a Task by ID and populate its dependencies', async () => {
      const taskId = crypto.randomUUID();
      const mockTaskFromRepo: Task = {
        id: taskId,
        phaseId: testPhaseId,
        name: 'Test Task Get',
        order: 1,
        status: 'pending',
        isValidated: false,
        creationDate: new Date(),
        updatedAt: new Date(),
        completionDate: null,
        dependencies: undefined,
      };
      const mockDependencyIds = [crypto.randomUUID()];

      mockTaskRepository.findById.mockResolvedValue(mockTaskFromRepo);
      getTaskDependenciesSpy = vi.spyOn(
        service as any,
        'getTaskDependencies'
      ) as MockInstance<[string], Promise<string[]>>;
      getTaskDependenciesSpy.mockResolvedValue(mockDependencyIds);

      const fetchedTask = await service.getTaskById(taskId);

      expect(mockTaskRepository.findById).toHaveBeenCalledWith(taskId);
      expect(getTaskDependenciesSpy).toHaveBeenCalledWith(taskId);
      expect(fetchedTask).not.toBeNull();
      expect(fetchedTask?.id).toBe(taskId);
      expect(fetchedTask?.dependencies).toEqual(mockDependencyIds);
    });

    it('should return null when getting a non-existent Task by ID', async () => {
      const nonExistentId = 'non-existent-task';
      mockTaskRepository.findById.mockResolvedValue(null);
      const task = await service.getTaskById(nonExistentId);
      expect(mockTaskRepository.findById).toHaveBeenCalledWith(nonExistentId);
      expect(task).toBeNull();
    });

    it('should get Tasks by Phase ID and populate their dependencies', async () => {
      const task1Id = crypto.randomUUID();
      const task2Id = crypto.randomUUID();
      const mockTask1FromRepo: Task = {
        id: task1Id,
        phaseId: testPhaseId,
        name: 'Task 1',
        order: 1,
        status: 'pending',
        isValidated: false,
        creationDate: new Date(),
        updatedAt: new Date(),
        completionDate: null,
        dependencies: undefined,
      };
      const mockTask2FromRepo: Task = {
        id: task2Id,
        phaseId: testPhaseId,
        name: 'Task 2',
        order: 2,
        status: 'in_progress',
        isValidated: true,
        creationDate: new Date(),
        updatedAt: new Date(),
        completionDate: null,
        dependencies: undefined,
      };
      const mockTasksFromRepo = [mockTask1FromRepo, mockTask2FromRepo];
      const mockDepsForTask1 = [crypto.randomUUID()];
      const mockDepsForTask2: string[] = [];

      mockTaskRepository.findByPhaseId.mockResolvedValue(mockTasksFromRepo);
      getTaskDependenciesSpy = vi.spyOn(
        service as any,
        'getTaskDependencies'
      ) as MockInstance<[string], Promise<string[]>>;
      getTaskDependenciesSpy.mockImplementation(async (id: string) => {
        if (id === task1Id) return mockDepsForTask1;
        if (id === task2Id) return mockDepsForTask2;
        return [];
      });

      const tasks = await service.getTasksByPhaseId(testPhaseId);

      expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
        testPhaseId,
        undefined // Explicitly check for undefined statusFilter
      );
      expect(getTaskDependenciesSpy).toHaveBeenCalledWith(task1Id);
      expect(getTaskDependenciesSpy).toHaveBeenCalledWith(task2Id);
      expect(tasks.length).toBe(2);
      expect(tasks[0].name).toBe('Task 1');
      expect(tasks[0].dependencies).toEqual(mockDepsForTask1);
      expect(tasks[1].name).toBe('Task 2');
      expect(tasks[1].dependencies).toEqual(mockDepsForTask2);
    });

    it('should get Tasks by Phase ID with status filter', async () => {
      const testPhaseId = crypto.randomUUID();
      const statusFilter: TaskStatus[] = ['pending', 'in_progress'];
      const mockFilteredTasksFromRepo: Task[] = [
        {
          id: crypto.randomUUID(),
          phaseId: testPhaseId,
          name: 'Task A Pending',
          order: 1,
          status: 'pending',
          isValidated: false,
          creationDate: new Date(),
          updatedAt: new Date(),
          completionDate: null,
          dependencies: undefined,
        },
      ];

      mockTaskRepository.findByPhaseId.mockResolvedValue(
        mockFilteredTasksFromRepo
      );
      // Initialize the spy for this test, similar to other tests
      getTaskDependenciesSpy = vi.spyOn(
        service as any,
        'getTaskDependencies'
      ) as MockInstance<[string], Promise<string[]>>;
      getTaskDependenciesSpy.mockImplementation(
        async (taskId: string): Promise<string[]> => {
          // For this test, we can return an empty array or specific dependencies if needed
          // This ensures the mock matches the spy's declared signature.
          return [];
        }
      );

      const tasks = await service.getTasksByPhaseId(testPhaseId, statusFilter);

      expect(mockTaskRepository.findByPhaseId).toHaveBeenCalledWith(
        testPhaseId,
        statusFilter
      );
      if (mockFilteredTasksFromRepo.length > 0) {
        expect(getTaskDependenciesSpy).toHaveBeenCalledWith(
          mockFilteredTasksFromRepo[0]!.id
        );
      }
      expect(tasks.length).toBe(mockFilteredTasksFromRepo.length);
      expect(tasks[0]?.status).toBe('pending');
    });

    it('should update a Task successfully and re-populate dependencies', async () => {
      const taskId = crypto.randomUUID();
      const updates = {
        name: 'Updated Task Name',
        status: 'completed' as TaskStatus,
      };
      const updatedTaskFromRepo: Task = {
        id: taskId,
        phaseId: testPhaseId,
        name: updates.name,
        status: updates.status,
        order: 1,
        isValidated: false,
        creationDate: new Date(),
        updatedAt: new Date(Date.now() + 1000),
        completionDate: null,
        dependencies: undefined,
      };
      const mockDependencyIds = [crypto.randomUUID()];

      mockTaskRepository.update.mockResolvedValue(updatedTaskFromRepo);
      getTaskDependenciesSpy = vi.spyOn(
        service as any,
        'getTaskDependencies'
      ) as MockInstance<[string], Promise<string[]>>;
      getTaskDependenciesSpy.mockResolvedValue(mockDependencyIds);

      const updatedTask = await service.updateTask(taskId, updates);

      expect(mockTaskRepository.update).toHaveBeenCalledWith(taskId, updates);
      expect(getTaskDependenciesSpy).toHaveBeenCalledWith(taskId);
      expect(updatedTask).not.toBeNull();
      expect(updatedTask?.name).toBe(updates.name);
      expect(updatedTask?.dependencies).toEqual(mockDependencyIds);
    });

    it('should return null when updating a non-existent task', async () => {
      const nonExistentId = 'non-existent-task';
      const updates = { name: 'New Task Name' };
      mockTaskRepository.update.mockResolvedValue(null);
      const result = await service.updateTask(nonExistentId, updates);
      expect(mockTaskRepository.update).toHaveBeenCalledWith(
        nonExistentId,
        updates
      );
      expect(result).toBeNull();
    });

    it('should delete a Task successfully, including its dependencies from task_dependencies table', async () => {
      const taskId = crypto.randomUUID();
      // db.prepare is already mocked at the top level
      mockTaskRepository.delete.mockResolvedValue(true);

      const result = await service.deleteTask(taskId);

      expect(mockDbPrepare).toHaveBeenCalledWith(
        'DELETE FROM task_dependencies WHERE taskId = ? OR dependencyId = ?'
      );
      expect(mockDbRun).toHaveBeenCalledWith(taskId, taskId);
      expect(mockTaskRepository.delete).toHaveBeenCalledWith(taskId);
      expect(result).toBe(true);
    });

    it('should return false when deleting a non-existent task from repository', async () => {
      const nonExistentId = 'non-existent-task';
      // db.prepare is already mocked
      mockTaskRepository.delete.mockResolvedValue(false);
      const result = await service.deleteTask(nonExistentId);

      expect(mockDbPrepare).toHaveBeenCalledWith(
        'DELETE FROM task_dependencies WHERE taskId = ? OR dependencyId = ?'
      );
      expect(mockDbRun).toHaveBeenCalledWith(nonExistentId, nonExistentId);
      expect(mockTaskRepository.delete).toHaveBeenCalledWith(nonExistentId);
      expect(result).toBe(false);
    });
  });

  // Task Dependency Management and Cascade Deletes tests are removed
});
