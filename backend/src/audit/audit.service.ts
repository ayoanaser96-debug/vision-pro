import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { AuditLog, AuditLogDocument, AuditAction } from './schemas/audit-log.schema';

@Injectable()
export class AuditService {
  constructor(
    @InjectModel(AuditLog.name) private auditLogModel: Model<AuditLogDocument>,
  ) {}

  async log(data: {
    userId: string;
    action: AuditAction;
    entityType: string;
    entityId?: string;
    description?: string;
    changes?: { before?: any; after?: any };
    ipAddress?: string;
    metadata?: any;
  }) {
    const log = new this.auditLogModel(data);
    return log.save();
  }

  async findByEntity(entityType: string, entityId: string) {
    return this.auditLogModel
      .find({ entityType, entityId })
      .populate('userId', 'firstName lastName role')
      .sort({ createdAt: -1 });
  }

  async findByUser(userId: string, limit = 50) {
    return this.auditLogModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit);
  }
}


