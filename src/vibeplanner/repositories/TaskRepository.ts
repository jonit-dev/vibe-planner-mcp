import 'reflect-metadata';
import { container, injectable } from 'tsyringe';
import { db } from '../../services/db'; // For custom queries
import { LoggerService } from '../../services/LoggerService';
import { Task, TaskSchema, TaskStatus } from '../types';
import { BaseRepository } from './BaseRepository';

const logger = container.resolve(LoggerService);

@injectable()
export class TaskRepository extends BaseRepository<Task, typeof TaskSchema> {
  constructor() {
    super('tasks', TaskSchema);
    // The BaseRepository constructor already logs this. This is redundant but added per request for explicitness.
    try {
      logger.debug(
        `TaskRepository constructor: Initialized for table 'tasks', using DB: ${db.name}`
      );
    } catch (e) {
      logger.warn(
        `TaskRepository constructor: Initialized for table 'tasks', but could not log db.name.`
      );
    }
  }

  protected override rowToEntity(row: any): Task {
    if (!row) return null as any; // Should not happen

    const entityData = { ...row };

    // Convert isValidated from 0/1 to boolean
    if (entityData.isValidated === 0 || entityData.isValidated === 1) {
      entityData.isValidated = Boolean(entityData.isValidated);
    }

    // Call super.rowToEntity to handle common conversions (dates) and Zod parsing
    // We pass the modified entityData to it.
    return super.rowToEntity(entityData);
  }

  async findByPhaseId(
    phaseId: string,
    statusFilter?: TaskStatus[]
  ): Promise<Task[]> {
    // Log db name before custom query in TaskRepository
    logger.debug(
      `TaskRepository.findByPhaseId: Operating on DB: ${db.name} for phaseId: ${phaseId}`
    );
    let query = `SELECT * FROM ${this.tableName} WHERE phaseId = ?`;
    const params: (string | number)[] = [phaseId];

    if (statusFilter && statusFilter.length > 0) {
      const placeholders = statusFilter.map(() => '?').join(',');
      query += ` AND status IN (${placeholders})`;
      params.push(...statusFilter);
    }

    query += ' ORDER BY "order" ASC';

    const stmt = db.prepare(query);
    const rows = stmt.all(...params);
    return rows.map((row) => this.rowToEntity(row));
  }

  // TODO: Implement methods for managing task dependencies (task_dependencies table)
  // async findDependencies(taskId: string): Promise<Task[]> { ... }
  // async findDependents(taskId: string): Promise<Task[]> { ... }
  // async addDependency(taskId: string, dependencyId: string): Promise<void> { ... }
  // async removeDependency(taskId: string, dependencyId: string): Promise<void> { ... }
}
