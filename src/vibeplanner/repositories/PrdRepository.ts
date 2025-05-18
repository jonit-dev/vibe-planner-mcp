import { Prd, PrdSchema } from '../types';
import { BaseRepository } from './BaseRepository';

export class PrdRepository extends BaseRepository<Prd, typeof PrdSchema> {
  constructor() {
    super('prds', PrdSchema);
  }

  // Add Prd-specific methods here if needed in the future
  // For example, finding a PRD by name, or fetching PRDs with their phases (complex)
}
