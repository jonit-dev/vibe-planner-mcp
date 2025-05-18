import { inject, singleton } from 'tsyringe';
import { Phase, PhaseStatus } from '../types';
import { DataPersistenceService } from './DataPersistenceService';

export interface AddPhaseDetails {
  name: string;
  description?: string | null;
  order: number;
  status?: PhaseStatus; // Optional, will default in schema if not provided
}

export interface UpdatePhaseDetails {
  name?: string;
  description?: string | null;
  order?: number;
  status?: PhaseStatus;
}

@singleton()
export class PhaseControlService {
  constructor(
    @inject(DataPersistenceService)
    private dataPersistenceService: DataPersistenceService
  ) {}

  async addPhaseToPrd(prdId: string, details: AddPhaseDetails): Promise<Phase> {
    const phaseData = {
      ...details,
      prdId,
      // DataPersistenceService.createPhase will handle id, creationDate, updatedAt, tasks, completionDate
      // Status will be handled by PrdSchema default if not provided in details
    };
    return this.dataPersistenceService.createPhase(
      phaseData as Omit<
        Phase,
        'id' | 'creationDate' | 'updatedAt' | 'tasks' | 'completionDate'
      >
    );
  }

  async getPhaseById(phaseId: string): Promise<Phase | null> {
    return this.dataPersistenceService.getPhaseById(phaseId);
  }

  async getPhasesForPrd(prdId: string): Promise<Phase[]> {
    // This method in DataPersistenceService already fetches tasks for each phase
    return this.dataPersistenceService.getPhasesByPrdId(prdId);
  }

  // Alias for getPhasesForPrd as per task description for PlanOverview
  async getPhasesWithTasks(prdId: string): Promise<Phase[]> {
    return this.getPhasesForPrd(prdId);
  }

  async updatePhase(
    phaseId: string,
    updates: UpdatePhaseDetails
  ): Promise<Phase | null> {
    // DataPersistenceService.updatePhase handles partial updates
    return this.dataPersistenceService.updatePhase(
      phaseId,
      updates as Partial<
        Omit<Phase, 'id' | 'creationDate' | 'updatedAt' | 'tasks' | 'prdId'>
      >
    );
  }

  async updatePhaseStatus(
    phaseId: string,
    status: PhaseStatus
  ): Promise<Phase | null> {
    return this.dataPersistenceService.updatePhase(phaseId, { status });
  }
}
