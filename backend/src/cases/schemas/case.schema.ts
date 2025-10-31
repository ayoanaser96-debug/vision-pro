import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type CaseDocument = Case & Document;

export enum CasePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

export enum CaseStatus {
  OPEN = 'open',
  IN_PROGRESS = 'in_progress',
  REVIEWED = 'reviewed',
  CLOSED = 'closed',
}

@Schema({ timestamps: true })
export class Case {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ type: [MongooseSchema.Types.ObjectId], ref: 'User', default: [] })
  assignedDoctors: MongooseSchema.Types.ObjectId[];

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'EyeTest' })
  eyeTestId?: MongooseSchema.Types.ObjectId;

  @Prop({ enum: CasePriority, default: CasePriority.MEDIUM })
  priority: CasePriority;

  @Prop({ enum: CaseStatus, default: CaseStatus.OPEN })
  status: CaseStatus;

  @Prop({ required: false })
  diagnosis?: string;

  @Prop({ type: Array, default: [] })
  timeline: Array<{
    type: string;
    timestamp: Date;
    userId: string;
    description: string;
    data?: any;
  }>;

  @Prop({ type: Object })
  aiInsights?: {
    urgency: number;
    riskFactors: string[];
    recommendations: string[];
  };

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  primaryDoctorId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  delegatedFromId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  notes?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const CaseSchema = SchemaFactory.createForClass(Case);

