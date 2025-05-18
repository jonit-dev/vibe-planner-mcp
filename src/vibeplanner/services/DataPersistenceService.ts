import crypto from 'crypto';
import { db } from '../../services/db';
import {
  Phase,
  PhaseSchema,
  Prd,
  PrdSchema,
  Task,
  TaskSchema,
  TaskStatusSchema,
} from '../types';

// Helper to convert DB row to Prd (handles dates and JSON parsing if needed)
function rowToPrd(row: any): Prd {
  return PrdSchema.parse({
    ...row,
    creationDate: new Date(row.creationDate),
    updatedAt: new Date(row.updatedAt),
    completionDate: row.completionDate ? new Date(row.completionDate) : null,
    // phases will be populated by dedicated methods
    phases: [],
  });
}

// Helper to convert DB row to Phase (handles dates)
function rowToPhase(row: any): Phase {
  return PhaseSchema.parse({
    ...row,
    creationDate: new Date(row.creationDate),
    updatedAt: new Date(row.updatedAt),
    completionDate: row.completionDate ? new Date(row.completionDate) : null,
    // tasks will be populated by dedicated methods
    tasks: [],
  });
}

// Helper to convert DB row to Task (handles dates and JSON parsing for dependencies)
function rowToTask(row: any, dependencies: string[] = []): Task {
  return TaskSchema.parse({
    ...row,
    isValidated: Boolean(row.isValidated),
    dependencies: dependencies, // Populated separately
    creationDate: new Date(row.creationDate),
    updatedAt: new Date(row.updatedAt),
    completionDate: row.completionDate ? new Date(row.completionDate) : null,
  });
}

export class DataPersistenceService {
  // PRD Methods
  async createPrd(
    data: Omit<
      Prd,
      | 'id'
      | 'creationDate'
      | 'updatedAt'
      | 'phases'
      | 'completionDate'
      | 'status'
    >
  ): Promise<Prd> {
    const id = crypto.randomUUID();
    const now = new Date();
    const newPrd: Prd = PrdSchema.parse({
      ...data,
      id,
      creationDate: now,
      updatedAt: now,
      completionDate: null,
      phases: [],
    });

    const stmt = db.prepare(
      'INSERT INTO prds (id, name, description, status, creationDate, updatedAt, completionDate) VALUES (?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      newPrd.id,
      newPrd.name,
      newPrd.description,
      newPrd.status,
      newPrd.creationDate.toISOString(),
      newPrd.updatedAt.toISOString(),
      newPrd.completionDate ? newPrd.completionDate.toISOString() : null
    );
    return newPrd;
  }

  async getPrdById(id: string): Promise<Prd | null> {
    const stmt = db.prepare('SELECT * FROM prds WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) {
      return null;
    }
    const prd = rowToPrd(row);
    prd.phases = await this.getPhasesByPrdId(id);
    return prd;
  }

  async getAllPrds(): Promise<Prd[]> {
    const stmt = db.prepare('SELECT * FROM prds ORDER BY creationDate DESC');
    const rows = stmt.all() as any[];
    const prds = await Promise.all(
      rows.map(async (row) => {
        const prd = rowToPrd(row);
        prd.phases = await this.getPhasesByPrdId(prd.id);
        return prd;
      })
    );
    return prds;
  }

  async updatePrd(
    id: string,
    data: Partial<Omit<Prd, 'id' | 'creationDate' | 'updatedAt' | 'phases'>>
  ): Promise<Prd | null> {
    const currentPrd = await this.getPrdById(id);
    if (!currentPrd) {
      return null;
    }

    // Validate incoming data against a partial schema if necessary
    // For simplicity, we assume valid partial data for now

    const newUpdatedAt = new Date();
    const updateData: Record<string, any> = {};
    const fieldsToUpdate: string[] = [];

    if (data.name !== undefined) {
      updateData.name = data.name;
      fieldsToUpdate.push('name = ?');
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
      fieldsToUpdate.push('description = ?');
    }
    if (data.status !== undefined) {
      updateData.status = data.status;
      fieldsToUpdate.push('status = ?');
    }
    if (data.completionDate !== undefined) {
      // handles null to clear date
      updateData.completionDate = data.completionDate
        ? data.completionDate.toISOString()
        : null;
      fieldsToUpdate.push('completionDate = ?');
    }

    if (fieldsToUpdate.length === 0) {
      // No actual fields to update, just touch updatedAt
      db.prepare('UPDATE prds SET updatedAt = ? WHERE id = ?').run(
        newUpdatedAt.toISOString(),
        id
      );
      return this.getPrdById(id); // Re-fetch to get the updated PRD
    }

    fieldsToUpdate.push('updatedAt = ?');
    const params = [
      ...Object.values(updateData),
      newUpdatedAt.toISOString(),
      id,
    ];

    const stmt = db.prepare(
      `UPDATE prds SET ${fieldsToUpdate.join(', ')} WHERE id = ?`
    );
    stmt.run(...params);

    return this.getPrdById(id); // Re-fetch to get the updated PRD
  }

  async deletePrd(id: string): Promise<boolean> {
    // Note: Cascading deletes for phases and tasks should be handled by DB foreign key constraints
    const stmt = db.prepare('DELETE FROM prds WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Phase Methods
  async createPhase(
    data: Omit<
      Phase,
      'id' | 'creationDate' | 'updatedAt' | 'tasks' | 'completionDate'
    >
  ): Promise<Phase> {
    const id = crypto.randomUUID();
    const now = new Date();
    const newPhase: Phase = PhaseSchema.parse({
      ...data,
      id,
      creationDate: now,
      updatedAt: now,
      completionDate: null,
      tasks: [], // Tasks are managed separately
    });

    const stmt = db.prepare(
      'INSERT INTO phases (id, name, description, status, creationDate, updatedAt, completionDate, "order", prdId) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      newPhase.id,
      newPhase.name,
      newPhase.description,
      newPhase.status,
      newPhase.creationDate.toISOString(),
      newPhase.updatedAt.toISOString(),
      newPhase.completionDate ? newPhase.completionDate.toISOString() : null,
      newPhase.order,
      newPhase.prdId
    );
    return newPhase;
  }

  async getPhaseById(id: string): Promise<Phase | null> {
    const stmt = db.prepare('SELECT * FROM phases WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) {
      return null;
    }
    const phase = rowToPhase(row);
    phase.tasks = await this.getTasksByPhaseId(id);
    return phase;
  }

  async getPhasesByPrdId(prdId: string): Promise<Phase[]> {
    const stmt = db.prepare(
      'SELECT * FROM phases WHERE prdId = ? ORDER BY "order" ASC'
    );
    const rows = stmt.all(prdId) as any[];
    const phases = await Promise.all(
      rows.map(async (row) => {
        const phase = rowToPhase(row);
        phase.tasks = await this.getTasksByPhaseId(phase.id);
        return phase;
      })
    );
    return phases;
  }

  async updatePhase(
    id: string,
    data: Partial<
      Omit<Phase, 'id' | 'creationDate' | 'updatedAt' | 'tasks' | 'prdId'>
    >
  ): Promise<Phase | null> {
    const currentPhase = await this.getPhaseById(id);
    if (!currentPhase) {
      return null;
    }
    const newUpdatedAt = new Date();
    const updateData: Record<string, any> = {};
    const fieldsToUpdate: string[] = [];

    // List of updatable fields for Phase
    const updatableFields: (keyof typeof data)[] = [
      'name',
      'description',
      'status',
      'completionDate',
      'order',
    ];

    updatableFields.forEach((field) => {
      if (data[field] !== undefined) {
        if (field === 'completionDate') {
          updateData[field] = (data[field] as Date | null)
            ? (data[field] as Date).toISOString()
            : null;
        } else {
          updateData[field] = data[field];
        }
        fieldsToUpdate.push(`"${field}" = ?`); // Quote field names like "order"
      }
    });

    if (fieldsToUpdate.length === 0) {
      db.prepare('UPDATE phases SET updatedAt = ? WHERE id = ?').run(
        newUpdatedAt.toISOString(),
        id
      );
      return this.getPhaseById(id);
    }

    fieldsToUpdate.push('updatedAt = ?');
    const params = [
      ...Object.values(updateData),
      newUpdatedAt.toISOString(),
      id,
    ];

    const stmtText = `UPDATE phases SET ${fieldsToUpdate.join(
      ', '
    )} WHERE id = ?`;
    const stmt = db.prepare(stmtText);
    stmt.run(...params);

    return this.getPhaseById(id);
  }

  async deletePhase(id: string): Promise<boolean> {
    // Cascading deletes for tasks handled by DB
    const stmt = db.prepare('DELETE FROM phases WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // Task Methods
  async createTask(
    data: Omit<
      Task,
      | 'id'
      | 'creationDate'
      | 'updatedAt'
      | 'completionDate'
      | 'isValidated'
      | 'dependencies'
    >
  ): Promise<Task> {
    const id = crypto.randomUUID();
    const now = new Date();
    // Ensure default for status if not provided, though schema has it
    const status = data.status || TaskStatusSchema.enum.pending;

    const newTaskData = {
      ...data,
      id,
      status, // use validated status
      isValidated: false, // default for new task
      dependencies: [], // handled separately
      creationDate: now,
      updatedAt: now,
      completionDate: null,
    };
    const newTask: Task = TaskSchema.parse(newTaskData);

    const stmt = db.prepare(
      'INSERT INTO tasks (id, name, description, status, isValidated, creationDate, updatedAt, completionDate, "order", phaseId, validationCommand, validationOutput, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
    );
    stmt.run(
      newTask.id,
      newTask.name,
      newTask.description,
      newTask.status,
      newTask.isValidated ? 1 : 0, // Boolean to integer for SQLite
      newTask.creationDate.toISOString(),
      newTask.updatedAt.toISOString(),
      newTask.completionDate ? newTask.completionDate.toISOString() : null,
      newTask.order,
      newTask.phaseId,
      newTask.validationCommand,
      newTask.validationOutput,
      newTask.notes
    );
    // Dependencies are handled by updateTaskDependencies
    return newTask;
  }

  private async getTaskDependencies(taskId: string): Promise<string[]> {
    const stmt = db.prepare(
      'SELECT dependencyId FROM task_dependencies WHERE taskId = ?'
    );
    const rows = stmt.all(taskId) as { dependencyId: string }[];
    return rows.map((r) => r.dependencyId);
  }

  async getTaskById(id: string): Promise<Task | null> {
    const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
    const row = stmt.get(id) as any;
    if (!row) {
      return null;
    }
    const dependencies = await this.getTaskDependencies(id);
    return rowToTask(row, dependencies);
  }

  async getTasksByPhaseId(phaseId: string): Promise<Task[]> {
    const stmt = db.prepare(
      'SELECT * FROM tasks WHERE phaseId = ? ORDER BY "order" ASC'
    );
    const rows = stmt.all(phaseId) as any[];
    const tasks = await Promise.all(
      rows.map(async (row) => {
        const dependencies = await this.getTaskDependencies(row.id);
        return rowToTask(row, dependencies);
      })
    );
    return tasks;
  }

  async updateTaskDependencies(
    taskId: string,
    dependencyIds: string[]
  ): Promise<void> {
    db.transaction(() => {
      // Remove existing dependencies for this task
      db.prepare('DELETE FROM task_dependencies WHERE taskId = ?').run(taskId);
      // Add new dependencies
      const insertStmt = db.prepare(
        'INSERT INTO task_dependencies (taskId, dependencyId) VALUES (?, ?)'
      );
      for (const depId of dependencyIds) {
        // Optionally, check if depId task exists
        insertStmt.run(taskId, depId);
      }
    })();
  }

  async updateTask(
    id: string,
    data: Partial<Omit<Task, 'id' | 'creationDate' | 'updatedAt' | 'phaseId'>>
  ): Promise<Task | null> {
    const currentTask = await this.getTaskById(id);
    if (!currentTask) {
      return null;
    }

    const newUpdatedAt = new Date();
    const updateData: Record<string, any> = {};
    const fieldsToUpdate: string[] = [];

    const updatableFields: (keyof typeof data)[] = [
      'name',
      'description',
      'status',
      'isValidated',
      'completionDate',
      'order',
      'validationCommand',
      'validationOutput',
      'notes',
    ];

    updatableFields.forEach((field) => {
      if (data[field] !== undefined) {
        if (field === 'completionDate') {
          updateData[field] = (data[field] as Date | null)
            ? (data[field] as Date).toISOString()
            : null;
        } else if (field === 'isValidated') {
          updateData[field] = data[field] ? 1 : 0;
        } else {
          updateData[field] = data[field];
        }
        fieldsToUpdate.push(`"${field}" = ?`);
      }
    });

    // Handle dependencies separately if provided
    if (data.dependencies !== undefined) {
      await this.updateTaskDependencies(id, data.dependencies);
    }

    if (fieldsToUpdate.length === 0 && data.dependencies === undefined) {
      // Only update timestamp if no other fields change and dependencies are not being updated
      db.prepare('UPDATE tasks SET updatedAt = ? WHERE id = ?').run(
        newUpdatedAt.toISOString(),
        id
      );
      return this.getTaskById(id); // re-fetch with potentially updated dependencies by side-effect if only deps changed
    }

    // Always update the timestamp if there are field changes or if dependencies were managed (even if fieldsToUpdate is empty)
    if (fieldsToUpdate.length > 0 || data.dependencies !== undefined) {
      if (fieldsToUpdate.length > 0) {
        fieldsToUpdate.push('updatedAt = ?');
        const params = [
          ...Object.values(updateData),
          newUpdatedAt.toISOString(),
          id,
        ];
        const stmtText = `UPDATE tasks SET ${fieldsToUpdate.join(
          ', '
        )} WHERE id = ?`;
        db.prepare(stmtText).run(...params);
      } else {
        // Only dependencies were updated, so just update the timestamp
        db.prepare('UPDATE tasks SET updatedAt = ? WHERE id = ?').run(
          newUpdatedAt.toISOString(),
          id
        );
      }
    }

    return this.getTaskById(id); // Re-fetch to get the updated task, including dependencies
  }

  async deleteTask(id: string): Promise<boolean> {
    // Dependencies are handled by cascade delete in task_dependencies table definition
    const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }
}

// Example usage (optional, for testing or direct script execution)
// async function main() {
//   const service = new DataPersistenceService();
//   // PRD Example
//   const newPrd = await service.createPrd({ name: "My First PRD", description: "This is a test PRD." });
//   console.log("Created PRD:", newPrd);

//   const fetchedPrd = await service.getPrdById(newPrd.id);
//   console.log("Fetched PRD:", fetchedPrd);

//   // Phase Example
//   const newPhase = await service.createPhase({ name: "Design Phase", prdId: newPrd.id, order: 1, description: "Phase for designing."});
//   console.log("Created Phase:", newPhase);

//   // Task Example
//   const newTask = await service.createTask({
//       name: "Define Color Palette",
//       phaseId: newPhase.id,
//       order: 1,
//       description: "Choose primary and secondary colors."
//   });
//   console.log("Created Task:", newTask);

//   const anotherTask = await service.createTask({
//     name: "Create Wireframes",
//     phaseId: newPhase.id,
//     order: 2,
//     description: "Low-fidelity wireframes."
//   });
//   console.log("Created Another Task:", anotherTask);

//   await service.updateTaskDependencies(newTask.id, [anotherTask.id]);
//   console.log(`Task ${newTask.id} now depends on ${anotherTask.id}`);

//   const updatedTask = await service.updateTask(newTask.id, { status: 'in_progress', dependencies: [anotherTask.id] });
//   console.log("Updated Task:", updatedTask);

//   const prdWithDetails = await service.getPrdById(newPrd.id);
//   console.log("PRD with details:", JSON.stringify(prdWithDetails, null, 2));

//   // Cleanup
//   // await service.deleteTask(newTask.id);
//   // await service.deleteTask(anotherTask.id);
//   // await service.deletePhase(newPhase.id);
//   // await service.deletePrd(newPrd.id);
//   // console.log("Cleaned up test data.");
// }

// if (process.env.NODE_ENV !== 'test') { // Avoid running main during test imports
//    // main().catch(console.error);
// }
