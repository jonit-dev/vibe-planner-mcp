import 'reflect-metadata';
import { container, injectable } from 'tsyringe';
import { db } from '../../services/db'; // For custom queries
import { LoggerService } from '../../services/LoggerService';
import { Phase, PhaseSchema } from '../types';
import { BaseRepository } from './BaseRepository';

const logger = container.resolve(LoggerService);

@injectable()
export class PhaseRepository extends BaseRepository<Phase, typeof PhaseSchema> {
  constructor() {
    super('phases', PhaseSchema);
    // The BaseRepository constructor already logs this. This is redundant but added per request for explicitness.
    try {
      logger.debug(
        `PhaseRepository constructor: Initialized for table 'phases', using DB: ${db.name}`
      );
    } catch (e) {
      logger.warn(
        `PhaseRepository constructor: Initialized for table 'phases', but could not log db.name.`
      );
    }
  }

  async findByPrdId(prdId: string): Promise<Phase[]> {
    // Log db name before custom query in PhaseRepository
    logger.debug(
      `PhaseRepository.findByPrdId: Operating on DB: ${db.name} for prdId: ${prdId}`
    );
    const stmt = db.prepare(
      `SELECT * FROM ${this.tableName} WHERE prdId = ? ORDER BY "order" ASC`
    );
    const rows = stmt.all(prdId);
    return rows.map((row) => this.rowToEntity(row));
  }

  // Add other Phase-specific methods here if needed
}
