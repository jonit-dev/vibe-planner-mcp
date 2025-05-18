// import 'reflect-metadata';
import { injectable } from 'tsyringe';
import { db } from '../../services/db'; // For custom queries
import { Task, TaskSchema, TaskStatus } from '../types';
import { BaseRepository } from './BaseRepository';

@injectable()
export class TaskRepository extends BaseRepository<Task, typeof TaskSchema> {
  constructor() {
    super('tasks', TaskSchema);
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
