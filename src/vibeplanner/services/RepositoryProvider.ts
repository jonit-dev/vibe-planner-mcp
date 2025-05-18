import { inject, injectable } from 'tsyringe';
import { PhaseRepository } from '../repositories/PhaseRepository';
import { PrdRepository } from '../repositories/PrdRepository';
import { TaskRepository } from '../repositories/TaskRepository';

@injectable() // Using injectable as it will be a dependency, can be registered as singleton in tests/app root.
export class RepositoryProvider {
  constructor(
    @inject(PrdRepository) public readonly prdRepository: PrdRepository,
    @inject(PhaseRepository) public readonly phaseRepository: PhaseRepository,
    @inject(TaskRepository) public readonly taskRepository: TaskRepository
  ) {}
}
