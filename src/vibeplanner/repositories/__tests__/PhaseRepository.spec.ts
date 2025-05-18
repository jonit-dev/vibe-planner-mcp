import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { beforeEach, describe, expect, it } from 'vitest';
import { db, initializeSchema } from '../../../services/db';
import { Prd } from '../../types';
import { PhaseRepository } from '../PhaseRepository';
import { PrdRepository } from '../PrdRepository'; // To create a Prd for context

const getDdlStatements = () => {
  const schemaPath = path.join(process.cwd(), 'docs', 'database-schema.md');
  if (!fs.existsSync(schemaPath))
    throw new Error('database-schema.md not found');
  const ddlMarkdown = fs.readFileSync(schemaPath, 'utf-8');
  const sqlBlocks = [];
  const regex = /```sql\n([\s\S]*?)\n```/g;
  let match;
  while ((match = regex.exec(ddlMarkdown)) !== null) sqlBlocks.push(match[1]);
  if (sqlBlocks.length === 0) throw new Error('No SQL DDL found');
  return sqlBlocks.join('\n---\n');
};

const ddl = getDdlStatements();

const resetDatabase = () => {
  try {
    db.exec('DELETE FROM task_dependencies;');
    db.exec('DELETE FROM tasks;');
    db.exec('DELETE FROM phases;');
    db.exec('DELETE FROM prds;');
  } catch (error) {
    /* console.warn('Could not delete all data', error.message); */
  }
  initializeSchema(ddl);
};

describe('PhaseRepository', () => {
  let phaseRepository: PhaseRepository;
  let prdRepository: PrdRepository;
  let testPrd: Prd;

  beforeEach(async () => {
    resetDatabase();
    phaseRepository = new PhaseRepository();
    prdRepository = new PrdRepository();
    testPrd = await prdRepository.create({
      name: 'Test PRD for Phases',
      status: 'pending' as const,
    });
  });

  it('should create a phase and find it by id', async () => {
    const phaseData = {
      name: 'Test Phase 1',
      description: 'This is a test phase',
      status: 'pending' as const,
      order: 1,
      prdId: testPrd.id,
    };
    const createdPhase = await phaseRepository.create(phaseData);

    expect(createdPhase.id).toBeTypeOf('string');
    expect(createdPhase.name).toBe(phaseData.name);
    expect(createdPhase.description).toBe(phaseData.description);
    expect(createdPhase.status).toBe('pending');
    expect(createdPhase.order).toBe(1);
    expect(createdPhase.prdId).toBe(testPrd.id);
    expect(createdPhase.creationDate).toBeInstanceOf(Date);
    expect(createdPhase.updatedAt).toBeInstanceOf(Date);
    expect(createdPhase.tasks).toBeUndefined();

    const foundPhase = await phaseRepository.findById(createdPhase.id);
    expect(foundPhase).toEqual(createdPhase);
  });

  it('should return null if phase not found by id', async () => {
    const foundPhase = await phaseRepository.findById(crypto.randomUUID());
    expect(foundPhase).toBeNull();
  });

  it('should find phases by prdId, ordered by "order"', async () => {
    await phaseRepository.create({
      name: 'Phase B',
      prdId: testPrd.id,
      order: 2,
      status: 'pending' as const,
    });
    await phaseRepository.create({
      name: 'Phase A',
      prdId: testPrd.id,
      order: 1,
      status: 'in_progress' as const,
    });

    const otherPrd = await prdRepository.create({
      name: 'Other PRD',
      status: 'pending' as const,
    });
    await phaseRepository.create({
      name: 'Phase C',
      prdId: otherPrd.id,
      order: 1,
      status: 'pending' as const,
    });

    const phasesForTestPrd = await phaseRepository.findByPrdId(testPrd.id);
    expect(phasesForTestPrd).toHaveLength(2);
    expect(phasesForTestPrd[0].name).toBe('Phase A');
    expect(phasesForTestPrd[0].order).toBe(1);
    expect(phasesForTestPrd[1].name).toBe('Phase B');
    expect(phasesForTestPrd[1].order).toBe(2);

    const phasesForOtherPrd = await phaseRepository.findByPrdId(otherPrd.id);
    expect(phasesForOtherPrd).toHaveLength(1);
    expect(phasesForOtherPrd[0].name).toBe('Phase C');
  });

  it('should return an empty array if no phases found for prdId', async () => {
    const phases = await phaseRepository.findByPrdId(crypto.randomUUID());
    expect(phases).toEqual([]);
  });

  it('should find all phases (less common, but for completeness)', async () => {
    await phaseRepository.create({
      name: 'Phase 1',
      prdId: testPrd.id,
      order: 1,
      status: 'pending' as const,
    });
    const otherPrd = await prdRepository.create({
      name: 'Other PRD',
      status: 'pending' as const,
    });
    await phaseRepository.create({
      name: 'Phase 2',
      prdId: otherPrd.id,
      order: 1,
      status: 'in_progress' as const,
    });

    const phases = await phaseRepository.findAll();
    expect(phases).toHaveLength(2);
    // Order of findAll is not guaranteed unless specified, so check for presence
    expect(
      phases.some((p) => p.name === 'Phase 1' && p.prdId === testPrd.id)
    ).toBe(true);
    expect(
      phases.some((p) => p.name === 'Phase 2' && p.prdId === otherPrd.id)
    ).toBe(true);
  });

  it('should update a phase', async () => {
    const createdPhase = await phaseRepository.create({
      name: 'Initial Phase Name',
      prdId: testPrd.id,
      order: 1,
      status: 'pending' as const,
    });
    const updateData = {
      name: 'Updated Phase Name',
      description: 'New Phase Desc',
      status: 'completed' as const,
      order: 2,
    };

    await new Promise((resolve) => setTimeout(resolve, 10)); // Ensure updatedAt changes
    const updatedPhase = await phaseRepository.update(
      createdPhase.id,
      updateData
    );

    expect(updatedPhase).toBeDefined();
    expect(updatedPhase!.name).toBe(updateData.name);
    expect(updatedPhase!.description).toBe(updateData.description);
    expect(updatedPhase!.status).toBe('completed');
    expect(updatedPhase!.order).toBe(2);
    expect(updatedPhase!.updatedAt.getTime()).toBeGreaterThan(
      createdPhase.updatedAt.getTime()
    );
  });

  it('should return null when trying to update a non-existent phase', async () => {
    const updatedPhase = await phaseRepository.update(crypto.randomUUID(), {
      name: 'Non Existent Phase',
    });
    expect(updatedPhase).toBeNull();
  });

  it('should delete a phase', async () => {
    const phase1 = await phaseRepository.create({
      name: 'To Delete',
      prdId: testPrd.id,
      order: 1,
      status: 'pending' as const,
    });
    await phaseRepository.create({
      name: 'To Keep',
      prdId: testPrd.id,
      order: 2,
      status: 'pending' as const,
    });

    const deleteResult = await phaseRepository.delete(phase1.id);
    expect(deleteResult).toBe(true);

    const foundDeleted = await phaseRepository.findById(phase1.id);
    expect(foundDeleted).toBeNull();

    const phases = await phaseRepository.findByPrdId(testPrd.id);
    expect(phases).toHaveLength(1);
    expect(phases[0].name).toBe('To Keep');
  });

  it('should return false when trying to delete a non-existent phase', async () => {
    const deleteResult = await phaseRepository.delete(crypto.randomUUID());
    expect(deleteResult).toBe(false);
  });
});
