import { db } from '../../services/db'; // For custom queries
import { Phase, PhaseSchema } from '../types';
import { BaseRepository } from './BaseRepository';

export class PhaseRepository extends BaseRepository<Phase, typeof PhaseSchema> {
  constructor() {
    super('phases', PhaseSchema);
  }

  async findByPrdId(prdId: string): Promise<Phase[]> {
    const stmt = db.prepare(
      `SELECT * FROM ${this.tableName} WHERE prdId = ? ORDER BY "order" ASC`
    );
    const rows = stmt.all(prdId);
    return rows.map((row) => this.rowToEntity(row));
  }

  // Add other Phase-specific methods here if needed
}
