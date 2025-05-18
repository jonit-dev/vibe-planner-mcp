// import { db } from '../../services/db'; // No longer directly needed for CRUD
import { db } from '../../services/db'; // Still needed for task_dependencies for now
import { PhaseRepository } from '../repositories/PhaseRepository';
import { PrdRepository } from '../repositories/PrdRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import {
  Phase,
  // PhaseSchema, // No longer needed for rowToPhase
  Prd,
  // PrdSchema, // No longer needed for rowToPrd
  Task,
  TaskStatus,
} from '../types';

// Helper functions are no longer needed as repositories handle entity conversion.

export class DataPersistenceService {
  private prdRepository: PrdRepository;
  private phaseRepository: PhaseRepository;
  private taskRepository: TaskRepository;

  constructor(
    prdRepository: PrdRepository,
    phaseRepository: PhaseRepository,
    taskRepository: TaskRepository
  ) {
    this.prdRepository = prdRepository;
    this.phaseRepository = phaseRepository;
    this.taskRepository = taskRepository;
  }

  // PRD Methods
  async createPrd(
    data: Omit<
      Prd,
      'id' | 'creationDate' | 'updatedAt' | 'phases' | 'completionDate'
    >
  ): Promise<Prd> {
    const prdDataForRepo: Omit<
      Prd,
      'id' | 'creationDate' | 'updatedAt' | 'phases' | 'completionDate'
    > = data;
    return this.prdRepository.create(prdDataForRepo);
  }

  async getPrdById(id: string): Promise<Prd | null> {
    const prd = await this.prdRepository.findById(id);
    if (prd) {
      prd.phases = await this.getPhasesByPrdId(id);
    }
    return prd;
  }

  async getAllPrds(): Promise<Prd[]> {
    const prds = await this.prdRepository.findAll();
    for (const prd of prds) {
      prd.phases = await this.getPhasesByPrdId(prd.id);
    }
    return prds.sort(
      (a, b) => b.creationDate.getTime() - a.creationDate.getTime()
    );
  }

  async updatePrd(
    id: string,
    data: Partial<Omit<Prd, 'id' | 'creationDate' | 'updatedAt' | 'phases'>>
  ): Promise<Prd | null> {
    const updatedPrd = await this.prdRepository.update(id, data);
    if (updatedPrd) {
      updatedPrd.phases = await this.getPhasesByPrdId(id);
    }
    return updatedPrd;
  }

  async deletePrd(id: string): Promise<boolean> {
    return this.prdRepository.delete(id);
  }

  // Phase Methods
  async createPhase(
    data: Omit<
      Phase,
      'id' | 'creationDate' | 'updatedAt' | 'tasks' | 'completionDate'
    >
  ): Promise<Phase> {
    const phaseDataForRepo: Omit<
      Phase,
      'id' | 'creationDate' | 'updatedAt' | 'tasks' | 'completionDate'
    > = data;
    return this.phaseRepository.create(phaseDataForRepo);
  }

  async getPhaseById(id: string): Promise<Phase | null> {
    const phase = await this.phaseRepository.findById(id);
    if (phase) {
      phase.tasks = await this.getTasksByPhaseId(id);
    }
    return phase;
  }

  async getPhasesByPrdId(prdId: string): Promise<Phase[]> {
    const phases = await this.phaseRepository.findByPrdId(prdId);
    for (const phase of phases) {
      phase.tasks = await this.getTasksByPhaseId(phase.id);
    }
    return phases;
  }

  async updatePhase(
    id: string,
    data: Partial<
      Omit<Phase, 'id' | 'creationDate' | 'updatedAt' | 'tasks' | 'prdId'>
    >
  ): Promise<Phase | null> {
    const updatedPhase = await this.phaseRepository.update(id, data);
    if (updatedPhase) {
      updatedPhase.tasks = await this.getTasksByPhaseId(id);
    }
    return updatedPhase;
  }

  async deletePhase(id: string): Promise<boolean> {
    return this.phaseRepository.delete(id);
  }

  // Task Methods
  async createTask(
    data: Omit<
      Task,
      | 'id'
      | 'creationDate'
      | 'updatedAt'
      | 'completionDate'
      // | 'isValidated' // isValidated might have a default in schema/repo, TBD
      | 'dependencies'
    >
  ): Promise<Task> {
    // The DTO for repository create excludes id, creationDate, updatedAt.
    // dependencies is a relational property, not set at basic entity creation.
    // completionDate and isValidated are handled by repo or DB defaults/schema.
    const taskDataForRepo: Omit<
      Task,
      'id' | 'creationDate' | 'updatedAt' | 'dependencies' | 'completionDate'
    > = data;
    return this.taskRepository.create(taskDataForRepo);
  }

  // This method remains as it uses the task_dependencies table directly
  private async getTaskDependencies(taskId: string): Promise<string[]> {
    const stmt = db.prepare(
      'SELECT dependencyId FROM task_dependencies WHERE taskId = ?'
    );
    const rows = stmt.all(taskId) as { dependencyId: string }[];
    return rows.map((row) => row.dependencyId);
  }

  async getTaskById(id: string): Promise<Task | null> {
    const task = await this.taskRepository.findById(id);
    if (task) {
      // Repositories return flat entities. Populate dependencies here.
      task.dependencies = await this.getTaskDependencies(id);
    }
    return task;
  }

  async getTasksByPhaseId(
    phaseId: string,
    statusFilter?: TaskStatus[]
  ): Promise<Task[]> {
    // TaskRepository has findByPhaseId, which returns flat tasks.
    const tasks = await this.taskRepository.findByPhaseId(
      phaseId,
      statusFilter
    );
    // Populate dependencies for each task
    for (const task of tasks) {
      task.dependencies = await this.getTaskDependencies(task.id);
    }
    // findByPhaseId should already order by "order", even with filter
    return tasks;
  }

  // This method remains as it uses the task_dependencies table directly
  async updateTaskDependencies(
    taskId: string,
    dependencyIds: string[]
  ): Promise<void> {
    // Simple approach: delete all existing and insert new ones
    // More sophisticated logic (diffing) could be used for performance if needed
    db.transaction(() => {
      db.prepare('DELETE FROM task_dependencies WHERE taskId = ?').run(taskId);
      const stmt = db.prepare(
        'INSERT INTO task_dependencies (taskId, dependencyId) VALUES (?, ?)'
      );
      for (const depId of dependencyIds) {
        stmt.run(taskId, depId);
      }
    })();
  }

  async updateTask(
    id: string,
    data: Partial<
      Omit<
        Task,
        'id' | 'creationDate' | 'updatedAt' | 'phaseId' | 'dependencies'
      >
    >
    // phaseId is not typically updated this way (tasks are moved between phases differently)
    // dependencies are updated via updateTaskDependencies
  ): Promise<Task | null> {
    const updatedTask = await this.taskRepository.update(id, data);
    if (updatedTask) {
      // Re-fetch dependencies as they are not part of the direct update/return from repo
      updatedTask.dependencies = await this.getTaskDependencies(id);
    }
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    // Also delete associated dependencies
    db.prepare(
      'DELETE FROM task_dependencies WHERE taskId = ? OR dependencyId = ?'
    ).run(id, id);
    return this.taskRepository.delete(id);
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
