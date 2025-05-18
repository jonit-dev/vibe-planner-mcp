import { inject, singleton } from 'tsyringe';
import { PhaseStatus, PhaseStatusSchema, Prd } from '../types';
import { DataPersistenceService } from './DataPersistenceService';

export interface InitializePrdDetails {
  name: string;
  description?: string | null; // Optional and nullable
  sourceTool?: string; // Plan mentioned this, but it's not in PrdSchema yet. Adding for future.
}

@singleton()
export class PrdLifecycleService {
  constructor(
    @inject(DataPersistenceService)
    private dataPersistenceService: DataPersistenceService
  ) {}

  async initializePrd(details: InitializePrdDetails): Promise<Prd> {
    // The PrdSchema now includes a status, which defaults to 'pending'.
    // DataPersistenceService.createPrd handles id, creationDate, updatedAt, phases, completionDate.
    const prdData = {
      name: details.name,
      description: details.description ?? undefined, // Pass undefined if null/undefined for Zod .optional()
      status: PhaseStatusSchema.enum.pending, // Set default status
      // sourceTool is not in current PrdSchema. If added later, pass it here.
    };
    // Type assertion to satisfy Omit requirement if PrdSchema has more fields than InitializePrdDetails
    return this.dataPersistenceService.createPrd(prdData);
  }

  async getPrd(prdId: string): Promise<Prd | null> {
    return this.dataPersistenceService.getPrdById(prdId);
  }

  async listPrds(): Promise<Prd[]> {
    return this.dataPersistenceService.getAllPrds();
  }

  async updatePrdStatus(
    prdId: string,
    status: PhaseStatus
  ): Promise<Prd | null> {
    // The PrdSchema expects status to be part of the object for updates if it changes
    return this.dataPersistenceService.updatePrd(prdId, { status });
  }

  async updatePrdDetails(
    prdId: string,
    details: Partial<Pick<Prd, 'name' | 'description'>>
  ): Promise<Prd | null> {
    return this.dataPersistenceService.updatePrd(prdId, details);
  }

  // Placeholder for more complex status derivation logic if needed in the future
  // async derivePrdStatus(prdId: string): Promise<PhaseStatus | null> {
  //   const prd = await this.getPrd(prdId);
  //   if (!prd || !prd.phases || prd.phases.length === 0) {
  //     return prd?.status || null; // Return current status or null if no PRD/phases
  //   }
  //   // Example: if all phases are 'completed', PRD is 'completed'
  //   // if any phase is 'in_progress', PRD is 'in_progress'
  //   // otherwise, 'pending' or 'on_hold' based on other criteria
  //   const phaseStatuses = prd.phases.map(p => p.status);
  //   if (phaseStatuses.every(s => s === 'completed')) return 'completed';
  //   if (phaseStatuses.some(s => s === 'in_progress')) return 'in_progress';
  //   if (phaseStatuses.some(s => s === 'on_hold')) return 'on_hold';
  //   return 'pending';
  // }
}
