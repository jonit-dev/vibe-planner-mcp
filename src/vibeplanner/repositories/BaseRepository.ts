import crypto from 'crypto';
import 'reflect-metadata'; // Ensure tsyringe can work if logger is injected here later
import { container } from 'tsyringe';
import { ZodType } from 'zod';
import { db } from '../../services/db';
import { LoggerService } from '../../services/LoggerService'; // Import LoggerService

const logger = container.resolve(LoggerService); // Get logger instance

export type EntityWithId = {
  id: string;
  creationDate: Date;
  updatedAt: Date;
  [key: string]: any;
};
export type CreateDto<T extends EntityWithId> = Omit<
  T,
  'id' | 'creationDate' | 'updatedAt'
>;
export type UpdateDto<T extends EntityWithId> = Partial<
  Omit<T, 'id' | 'creationDate' | 'updatedAt'> & { id?: string }
>;

/**
 * Abstract BaseRepository class providing common CRUD operations and timestamp management.
 * @template TEntityType The type of the entity (e.g., Prd, Phase, Task).
 * @template TEntityZodSchema The Zod schema for the TEntityType.
 */
export abstract class BaseRepository<
  TEntityType extends EntityWithId,
  TEntityZodSchema extends ZodType<TEntityType>
> {
  protected readonly tableName: string;
  protected readonly entitySchema: TEntityZodSchema;

  constructor(tableName: string, entitySchema: TEntityZodSchema) {
    this.tableName = tableName;
    this.entitySchema = entitySchema;
    // Log when a repository instance is created and which DB it *should* be using
    // Note: db.name might not be available if using an in-memory db opened as :memory: without a file path.
    // However, for file-based DBs, it should show the path.
    try {
      logger.debug(
        `Repository for table '${tableName}' initialized, using DB: ${db.name}`
      );
    } catch (e) {
      logger.warn(
        `Repository for table '${tableName}' initialized, but could not log db.name.`
      );
    }
  }

  protected rowToEntity(row: any): TEntityType {
    if (!row) return null as any; // Should not happen if query is correct
    // Ensure date fields are converted from ISO strings to Date objects if necessary.
    // This is a basic conversion; specific repositories might need more complex logic.
    const entityData = { ...row };
    if (row.creationDate && typeof row.creationDate === 'string') {
      entityData.creationDate = new Date(row.creationDate);
    }
    if (row.updatedAt && typeof row.updatedAt === 'string') {
      entityData.updatedAt = new Date(row.updatedAt);
    }
    if (row.completionDate && typeof row.completionDate === 'string') {
      entityData.completionDate = new Date(row.completionDate);
    } else if (row.completionDate === null) {
      entityData.completionDate = null;
    }

    // Handle boolean conversion for SQLite (0/1 to false/true)
    // This requires knowing which fields are boolean. Subclasses should override or extend.
    // Example for a generic boolean field, assuming it exists in TEntityType and schema.
    // if ('isValidated' in entityData && (entityData.isValidated === 0 || entityData.isValidated === 1)) {
    //   entityData.isValidated = Boolean(entityData.isValidated);
    // }
    return this.entitySchema.parse(entityData);
  }

  // Helper to convert booleans to 0/1 for SQLite compatibility
  protected preprocessDataForDb(
    data: Record<string, any>
  ): Record<string, any> {
    const processedData = { ...data };
    for (const key in processedData) {
      if (typeof processedData[key] === 'boolean') {
        processedData[key] = processedData[key] ? 1 : 0;
      }
    }
    return processedData;
  }

  async create(data: CreateDto<TEntityType>): Promise<TEntityType> {
    logger.debug(
      `BaseRepository: Attempting to create record in table '${this.tableName}'. DB connected to: ${db.name}`
    );
    const id = crypto.randomUUID();
    const now = new Date().toISOString();

    // Preprocess data before inserting (e.g., convert booleans)
    const processedData = this.preprocessDataForDb({ ...data });

    const recordToInsert = {
      ...processedData,
      id,
      creationDate: now,
      updatedAt: now,
    };

    // Filter out undefined values to avoid inserting them as NULL if schema expects optional
    const validRecord = Object.fromEntries(
      Object.entries(recordToInsert).filter(([_, v]) => v !== undefined)
    );

    const columns = Object.keys(validRecord);
    const placeholders = columns.map(() => '?').join(', ');
    const values = Object.values(validRecord);

    const sqlQuery = `INSERT INTO ${this.tableName} (${columns
      .map((col) => `"${col}"`)
      .join(', ')}) VALUES (${placeholders})`;

    logger.debug(
      `BaseRepository: Executing SQL for CREATE in '${
        this.tableName
      }': Query: ${sqlQuery}, Values: ${JSON.stringify(values)}`
    );

    const stmt = db.prepare(sqlQuery);
    stmt.run(...values);

    // Fetch the created record to ensure it's parsed by Zod and dates are Date objects
    // This also confirms insertion and gets DB defaults if any were applied beyond this logic
    return this.findById(id) as Promise<TEntityType>; // We expect it to be found
  }

  async findById(id: string): Promise<TEntityType | null> {
    logger.debug(
      `BaseRepository: Attempting to findById from table '${this.tableName}', ID: ${id}. DB connected to: ${db.name}`
    );
    const stmt = db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`);
    const row = stmt.get(id);
    if (!row) {
      return null;
    }
    return this.rowToEntity(row);
  }

  async findAll(): Promise<TEntityType[]> {
    const stmt = db.prepare(`SELECT * FROM ${this.tableName}`);
    const rows = stmt.all();
    return rows.map((row) => this.rowToEntity(row));
  }

  async update(
    id: string,
    data: UpdateDto<TEntityType>
  ): Promise<TEntityType | null> {
    const current = await this.findById(id);
    if (!current) {
      return null;
    }

    const now = new Date().toISOString();
    // Preprocess data before updating (e.g., convert booleans)
    const processedUpdateData = this.preprocessDataForDb({ ...data });

    const updateData: Record<string, any> = {
      ...processedUpdateData,
      updatedAt: now,
    };
    delete updateData.id; // id should not be in SET part

    const fieldsToUpdate = Object.keys(updateData).map((key) => `"${key}" = ?`);

    if (fieldsToUpdate.length === 0) {
      // If only id was passed or data is empty, effectively just touch updatedAt
      // (or do nothing if updatedAt is not part of the actual update fields)
      // For consistency, if we are here with no actual fields, it implies no meaningful update.
      // A pure 'touch' might need a dedicated method or specific handling if only `updatedAt` is modified.
      // Here, we proceed to update updatedAt regardless if other fields are present.
      if (!Object.keys(data).length) {
        // if original data was empty
        db.prepare(
          `UPDATE ${this.tableName} SET updatedAt = ? WHERE id = ?`
        ).run(now, id);
        return this.findById(id);
      }
      // if data had only id, it means no actual update values were provided.
      return current;
    }

    const params = [...Object.values(updateData), id];
    const stmt = db.prepare(
      `UPDATE ${this.tableName} SET ${fieldsToUpdate.join(', ')} WHERE id = ?`
    );
    const result = stmt.run(...params);

    if (result.changes === 0) {
      // This might happen if the WHERE clause (id = ?) didn't match, or if data was same as current.
      // Re-fetch to be sure, or return null if strict update is required.
      return this.findById(id);
    }
    return this.findById(id);
  }

  async delete(id: string): Promise<boolean> {
    const stmt = db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }
}
