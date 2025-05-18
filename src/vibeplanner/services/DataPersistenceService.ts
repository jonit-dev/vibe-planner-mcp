import { inject, singleton } from 'tsyringe';
import { db } from '../../services/db';
import { RepositoryProvider } from './RepositoryProvider'; // Import the new provider
// Removed direct repository imports
// CreateDto, UpdateDto might still be needed if DataPersistenceService constructs these for updates.
// For now, assuming they are passed through or not strictly needed for this snippet's focus.
// import { CreateDto, UpdateDto } from '../repositories/BaseRepository';
import { Phase, Prd, Task, TaskStatus } from '../types';

@singleton()
export class DataPersistenceService {
  constructor(
    @inject(RepositoryProvider) private repositories: RepositoryProvider
  ) {}

  // PRD Methods
  async createPrd(
    data: Omit<
      Prd,
      'id' | 'creationDate' | 'updatedAt' | 'phases' | 'completionDate'
    >
  ): Promise<Prd> {
    return this.repositories.prdRepository.create(data);
  }

  async getPrdById(id: string): Promise<Prd | null> {
    const prd = await this.repositories.prdRepository.findById(id);
    if (prd) {
      prd.phases = await this.getPhasesByPrdId(prd.id);
    }
    return prd;
  }

  async getAllPrds(): Promise<Prd[]> {
    const prds = await this.repositories.prdRepository.findAll();
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
    const updatedPrd = await this.repositories.prdRepository.update(
      id,
      data as any
    ); // Cast as any for now, or import UpdateDto
    if (updatedPrd) {
      updatedPrd.phases = await this.getPhasesByPrdId(id);
    }
    return updatedPrd;
  }

  async deletePrd(id: string): Promise<boolean> {
    return this.repositories.prdRepository.delete(id);
  }

  // Phase Methods
  async createPhase(
    data: Omit<
      Phase,
      'id' | 'creationDate' | 'updatedAt' | 'tasks' | 'completionDate'
    >
  ): Promise<Phase> {
    return this.repositories.phaseRepository.create(data);
  }

  async getPhaseById(id: string): Promise<Phase | null> {
    const phase = await this.repositories.phaseRepository.findById(id);
    if (phase) {
      phase.tasks = await this.getTasksByPhaseId(id);
    }
    return phase;
  }

  async getPhasesByPrdId(prdId: string): Promise<Phase[]> {
    const phases = await this.repositories.phaseRepository.findByPrdId(prdId);
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
    const updatedPhase = await this.repositories.phaseRepository.update(
      id,
      data as any
    ); // Cast as any or import UpdateDto
    if (updatedPhase) {
      updatedPhase.tasks = await this.getTasksByPhaseId(id);
    }
    return updatedPhase;
  }

  async deletePhase(id: string): Promise<boolean> {
    return this.repositories.phaseRepository.delete(id);
  }

  // Task Methods
  async createTask(
    data: Omit<
      Task,
      'id' | 'creationDate' | 'updatedAt' | 'completionDate' | 'dependencies'
    >
  ): Promise<Task> {
    return this.repositories.taskRepository.create(data);
  }

  private async getTaskDependencies(taskId: string): Promise<string[]> {
    const stmt = db.prepare(
      'SELECT dependencyId FROM task_dependencies WHERE taskId = ?'
    );
    const rows = stmt.all(taskId) as { dependencyId: string }[];
    return rows.map((row) => row.dependencyId);
  }

  async getTaskById(id: string): Promise<Task | null> {
    const task = await this.repositories.taskRepository.findById(id);
    if (task) {
      task.dependencies = await this.getTaskDependencies(id);
    }
    return task;
  }

  async getTasksByPhaseId(
    phaseId: string,
    statusFilter?: TaskStatus[]
  ): Promise<Task[]> {
    const tasks = await this.repositories.taskRepository.findByPhaseId(
      phaseId,
      statusFilter
    );
    for (const task of tasks) {
      task.dependencies = await this.getTaskDependencies(task.id);
    }
    return tasks;
  }

  async updateTaskDependencies(
    taskId: string,
    dependencyIds: string[]
  ): Promise<void> {
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
  ): Promise<Task | null> {
    const updatedTask = await this.repositories.taskRepository.update(
      id,
      data as any
    ); // Cast as any or import UpdateDto
    if (updatedTask) {
      updatedTask.dependencies = await this.getTaskDependencies(id);
    }
    return updatedTask;
  }

  async deleteTask(id: string): Promise<boolean> {
    db.prepare(
      'DELETE FROM task_dependencies WHERE taskId = ? OR dependencyId = ?'
    ).run(id, id);
    return this.repositories.taskRepository.delete(id);
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
