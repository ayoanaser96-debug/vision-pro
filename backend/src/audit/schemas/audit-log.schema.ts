import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AuditLogDocument = AuditLog & Document;

export enum AuditAction {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  VIEW = 'view',
  APPROVE = 'approve',
  REJECT = 'reject',
  SIGN = 'sign',
}

@Schema({ timestamps: true })
export class AuditLog {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: AuditAction })
  action: AuditAction;

  @Prop({ required: true })
  entityType: string; // 'Prescription', 'EyeTest', 'Case', etc.

  @Prop({ type: MongooseSchema.Types.ObjectId })
  entityId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  description: string;

  @Prop({ type: Object })
  changes?: {
    before?: any;
    after?: any;
  };

  @Prop({ required: false })
  ipAddress?: string;

  @Prop({ type: Object })
  metadata?: any;
}

export const AuditLogSchema = SchemaFactory.createForClass(AuditLog);


