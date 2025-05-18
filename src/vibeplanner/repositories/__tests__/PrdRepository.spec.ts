import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { db, initializeSchema } from '../../../services/db'; // Adjust path as needed
import { PrdRepository } from '../PrdRepository';

// Helper to load DDL from markdown
const getDdlStatements = () => {
  const schemaPath = path.join(process.cwd(), 'docs', 'database-schema.md');
  if (!fs.existsSync(schemaPath)) {
    throw new Error('database-schema.md not found');
  }
  const ddlMarkdown = fs.readFileSync(schemaPath, 'utf-8');
  const sqlBlocks = [];
  const regex = /```sql\n([\s\S]*?)\n```/g;
  let match;
  while ((match = regex.exec(ddlMarkdown)) !== null) {
    sqlBlocks.push(match[1]);
  }
  if (sqlBlocks.length === 0) {
    throw new Error('No SQL DDL found in database-schema.md');
  }
  return sqlBlocks.join('\n---\n');
};

const ddl = getDdlStatements();

const resetDatabase = () => {
  // Clear all tables. Order matters due to foreign keys.
  try {
    db.exec('DELETE FROM task_dependencies;');
    db.exec('DELETE FROM tasks;');
    db.exec('DELETE FROM phases;');
    db.exec('DELETE FROM prds;');
  } catch (error) {
    // console.warn('Warning: Could not delete all data, schema might not exist yet.', error.message);
    // This is okay if tables don't exist yet (first run)
  }
  initializeSchema(ddl);
};

describe('PrdRepository', () => {
  let prdRepository: PrdRepository;

  beforeEach(() => {
    resetDatabase();
    prdRepository = new PrdRepository();
  });

  afterEach(async () => {
    // No explicit close needed for in-memory usually, but good for consistency if other tests use file DBs
    // closeDbConnection(); // This would close the shared :memory: db, affecting other tests in the same worker
  });

  it('should create a PRD and find it by id', async () => {
    const prdData = {
      name: 'Test PRD 1',
      description: 'This is a test PRD',
      status: 'pending' as const,
    };
    const createdPrd = await prdRepository.create(prdData);

    expect(createdPrd.id).toBeTypeOf('string');
    expect(createdPrd.name).toBe(prdData.name);
    expect(createdPrd.description).toBe(prdData.description);
    expect(createdPrd.status).toBe('pending'); // DB default
    expect(createdPrd.creationDate).toBeInstanceOf(Date);
    expect(createdPrd.updatedAt).toBeInstanceOf(Date);
    expect(createdPrd.phases).toBeUndefined(); // .optional() in schema, not populated by base repo

    const foundPrd = await prdRepository.findById(createdPrd.id);
    expect(foundPrd).toEqual(createdPrd);
  });

  it('should return null if PRD not found by id', async () => {
    const foundPrd = await prdRepository.findById(crypto.randomUUID());
    expect(foundPrd).toBeNull();
  });

  it('should find all PRDs', async () => {
    await prdRepository.create({ name: 'PRD 1', status: 'pending' as const });
    await prdRepository.create({
      name: 'PRD 2',
      status: 'in_progress' as const,
    });

    const prds = await prdRepository.findAll();
    expect(prds).toHaveLength(2);
    expect(prds[0].name).toBe('PRD 1');
    expect(prds[0].status).toBe('pending');
    expect(prds[1].name).toBe('PRD 2');
    expect(prds[1].status).toBe('in_progress');
  });

  it('should update a PRD', async () => {
    const createdPrd = await prdRepository.create({
      name: 'Initial Name',
      status: 'pending' as const,
    });
    const updateData = {
      name: 'Updated Name',
      description: 'New Description',
      status: 'completed' as const,
    };

    // Introduce a slight delay to ensure updatedAt changes
    await new Promise((resolve) => setTimeout(resolve, 10));

    const updatedPrd = await prdRepository.update(createdPrd.id, updateData);

    expect(updatedPrd).toBeDefined();
    expect(updatedPrd!.id).toBe(createdPrd.id);
    expect(updatedPrd!.name).toBe(updateData.name);
    expect(updatedPrd!.description).toBe(updateData.description);
    expect(updatedPrd!.status).toBe('completed');
    expect(updatedPrd!.updatedAt.getTime()).toBeGreaterThan(
      createdPrd.updatedAt.getTime()
    );
    expect(updatedPrd!.creationDate.getTime()).toEqual(
      createdPrd.creationDate.getTime()
    );

    const foundPrd = await prdRepository.findById(createdPrd.id);
    expect(foundPrd!.name).toBe(updateData.name);
  });

  it('should return null when trying to update a non-existent PRD', async () => {
    const updatedPrd = await prdRepository.update(crypto.randomUUID(), {
      name: 'Non Existent',
    });
    expect(updatedPrd).toBeNull();
  });

  it('should delete a PRD', async () => {
    const prd1 = await prdRepository.create({
      name: 'To Be Deleted',
      status: 'pending' as const,
    });
    await prdRepository.create({
      name: 'To Be Kept',
      status: 'pending' as const,
    });

    const deleteResult = await prdRepository.delete(prd1.id);
    expect(deleteResult).toBe(true);

    const foundDeleted = await prdRepository.findById(prd1.id);
    expect(foundDeleted).toBeNull();

    const prds = await prdRepository.findAll();
    expect(prds).toHaveLength(1);
    expect(prds[0].name).toBe('To Be Kept');
  });

  it('should return false when trying to delete a non-existent PRD', async () => {
    const deleteResult = await prdRepository.delete(crypto.randomUUID());
    expect(deleteResult).toBe(false);
  });
});
