import { inject, singleton } from 'tsyringe';
import { LoggerService } from '../../services/LoggerService';
import { PhaseStatus, PhaseStatusSchema, Prd } from '../types';
import { DataPersistenceService } from './DataPersistenceService';

export interface InitializePrdDetails {
  name: string;
  description?: string | null; // Optional and nullable
  sourceTool?: string; // Plan mentioned this, but it's not in PrdSchema yet. Adding for future.
  status?: PhaseStatus; // Added optional status
}

@singleton()
export class PrdLifecycleService {
  private logger: LoggerService;

  constructor(
    @inject(DataPersistenceService)
    private dataPersistenceService: DataPersistenceService,
    @inject(LoggerService) loggerService: LoggerService
  ) {
    this.logger = loggerService;
    this.logger.info('PrdLifecycleService initialized');
  }

  async initializePrd(details: InitializePrdDetails): Promise<Prd> {
    this.logger.info(
      '[PrdLifecycleService] Initializing PRD with details:',
      details
    );

    let prdStatus: PhaseStatus = PhaseStatusSchema.enum.pending;
    if (details.status) {
      const parsedStatus = PhaseStatusSchema.safeParse(details.status);
      if (parsedStatus.success) {
        prdStatus = parsedStatus.data;
        this.logger.debug(
          `[PrdLifecycleService] Using provided status: ${prdStatus}`
        );
      } else {
        this.logger.warn(
          `[PrdLifecycleService] Invalid status '${details.status}' provided. Defaulting to 'pending'.`
        );
      }
    } else {
      this.logger.debug(
        "[PrdLifecycleService] No status provided. Defaulting to 'pending'"
      );
    }

    const prdData = {
      name: details.name,
      description: details.description ?? '',
      status: prdStatus,
    };

    this.logger.info(
      '[PrdLifecycleService] Calling DataPersistenceService.createPrd with data:',
      prdData
    );
    try {
      const newPrd = await this.dataPersistenceService.createPrd(prdData);
      this.logger.info(
        '[PrdLifecycleService] Successfully initialized PRD:',
        newPrd
      );
      return newPrd;
    } catch (error) {
      this.logger.error(
        '[PrdLifecycleService] Error initializing PRD:',
        error as Error
      );
      throw error;
    }
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

  async deletePrd(prdId: string): Promise<boolean> {
    this.logger.info(`[PrdLifecycleService] Deleting PRD with ID: ${prdId}`);
    try {
      // Future: Add logic here to delete associated phases and tasks if needed (cascading delete)
      // For now, it relies on DataPersistenceService.deletePrd which might or might not cascade.
      // Based on DataPersistenceService.deletePrd, it only deletes the PRD itself.
      // We might need to explicitly delete phases and tasks here, or ensure DataPersistenceService handles it.
      // For now, directly calling deletePrd.
      const result = await this.dataPersistenceService.deletePrd(prdId);
      if (result) {
        this.logger.info(
          `[PrdLifecycleService] Successfully deleted PRD ID: ${prdId}`
        );
      } else {
        this.logger.warn(
          `[PrdLifecycleService] Failed to delete PRD ID: ${prdId} (not found or error).`
        );
      }
      return result;
    } catch (error) {
      this.logger.error(
        `[PrdLifecycleService] Error deleting PRD ID: ${prdId}:`,
        error as Error
      );
      throw error;
    }
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
