import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type EyeTestDocument = EyeTest & Document;

export enum TestStatus {
  PENDING = 'pending',
  ANALYZING = 'analyzing',
  ANALYZED = 'analyzed',
  DOCTOR_REVIEW = 'doctor_review',
  COMPLETED = 'completed',
}

@Schema({ timestamps: true })
export class EyeTest {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  doctorId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  analystId?: MongooseSchema.Types.ObjectId;

  @Prop({ enum: TestStatus, default: TestStatus.PENDING })
  status: TestStatus;

  // Visual Acuity (Snellen chart)
  @Prop({ required: false })
  visualAcuityRight?: string;

  @Prop({ required: false })
  visualAcuityLeft?: string;

  // Color Vision test
  @Prop({ required: false })
  colorVisionResult?: string;

  // Refraction
  @Prop({ required: false, type: Object })
  refractionRight?: {
    sphere: string;
    cylinder: string;
    axis: string;
  };

  @Prop({ required: false, type: Object })
  refractionLeft?: {
    sphere: string;
    cylinder: string;
    axis: string;
  };

  // Retina imaging
  @Prop({ type: Array, default: [] })
  retinaImages: string[];

  // AI Analysis Results
  @Prop({ required: false, type: Object })
  aiAnalysis?: {
    cataract?: {
      detected: boolean;
      severity: string;
      confidence: number;
    };
    glaucoma?: {
      detected: boolean;
      severity: string;
      confidence: number;
    };
    diabeticRetinopathy?: {
      detected: boolean;
      severity: string;
      confidence: number;
    };
    overallAssessment: string;
  };

  // Analyst Notes
  @Prop({ required: false })
  analystNotes?: string;

  // Doctor Review
  @Prop({ required: false })
  doctorNotes?: string;

  @Prop({ required: false })
  doctorApproved?: boolean;

  @Prop({ required: false, type: Object })
  rawData?: any; // For storing device data

  createdAt?: Date;
  updatedAt?: Date;
}

export const EyeTestSchema = SchemaFactory.createForClass(EyeTest);

