// World instance lifecycle management

import pino from 'pino';
import type { WorldTemplate, Result as ResultType } from '@murmur/types';
import { ResultUtil as Result } from '@murmur/types';
import type { InstanceRepo, TemplateRepo } from '@murmur/db';

const logger = pino({ name: 'instance-manager' });

export interface InstanceManagerDeps {
  instanceRepo: InstanceRepo;
  templateRepo: TemplateRepo;
  resolveTemplate: (templateId: string) => WorldTemplate | null;
}

export interface CreateInstanceResult {
  id: string;
  templateId: string;
  status: string;
  currentTurn: number;
}

export class InstanceManager {
  private readonly deps: InstanceManagerDeps;

  constructor(deps: InstanceManagerDeps) {
    this.deps = deps;
  }

  async createInstance(templateId: string): Promise<ResultType<CreateInstanceResult, Error>> {
    const template = this.deps.resolveTemplate(templateId);
    if (!template) {
      let dbTemplate;
      try {
        dbTemplate = await this.deps.templateRepo.findById(templateId);
      } catch (err) {
        return Result.err(err instanceof Error ? err : new Error(String(err)));
      }
      if (!dbTemplate) {
        return Result.err(new Error(`Template not found: ${templateId}`));
      }
    }

    let row;
    try {
      row = await this.deps.instanceRepo.create({ templateId });
      await this.deps.templateRepo.incrementPlayCount(templateId);
    } catch (err) {
      return Result.err(err instanceof Error ? err : new Error(String(err)));
    }

    logger.info({ event: 'instance_created', instanceId: row.id, templateId });

    return Result.ok({
      id: row.id,
      templateId: row.templateId,
      status: row.status,
      currentTurn: row.currentTurn,
    });
  }

  async getInstance(instanceId: string): Promise<ResultType<{
    id: string;
    templateId: string;
    status: string;
    currentTurn: number;
    observerCount: number;
    createdAt: Date;
    endedAt: Date | null;
  }, Error>> {
    let row;
    try {
      row = await this.deps.instanceRepo.findById(instanceId);
    } catch (err) {
      return Result.err(err instanceof Error ? err : new Error(String(err)));
    }
    if (!row) {
      return Result.err(new Error(`Instance not found: ${instanceId}`));
    }
    return Result.ok({
      id: row.id,
      templateId: row.templateId,
      status: row.status,
      currentTurn: row.currentTurn,
      observerCount: row.observerCount,
      createdAt: row.createdAt,
      endedAt: row.endedAt,
    });
  }
}
