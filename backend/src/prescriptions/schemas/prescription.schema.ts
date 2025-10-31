import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PrescriptionDocument = Prescription & Document;

export enum PrescriptionStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  READY = 'ready',
  DELIVERED = 'delivered',
  COMPLETED = 'completed',
  FILLED = 'filled',
  CANCELLED = 'cancelled',
}

@Schema({ timestamps: true })
export class Prescription {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  doctorId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Array, default: [] })
  medications: Array<{
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions?: string;
  }>;

  @Prop({ type: Array, default: [] })
  glasses?: Array<{
    type: string; // glasses, contact_lenses
    prescription: {
      sphere: string;
      cylinder: string;
      axis: string;
      add?: string; // for bifocals
    };
    frame?: string;
    lensType?: string;
  }>;

  @Prop({ required: false })
  notes: string;

  @Prop({ enum: PrescriptionStatus, default: PrescriptionStatus.PENDING })
  status: PrescriptionStatus;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  pharmacyId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  pharmacyNotes?: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'EyeTest' })
  relatedTestId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  totalAmount?: number;

  @Prop({ required: false })
  diagnosis?: string;

  @Prop({ type: Object, required: false })
  metadata?: {
    digitalSignature?: string;
    signedBy?: MongooseSchema.Types.ObjectId;
    signedAt?: Date;
    qrCode?: string;
  };

  @Prop({ type: Object, required: false })
  deliveryInfo?: {
    address?: string;
    phone?: string;
    trackingNumber?: string;
    estimatedDelivery?: Date;
    currentLocation?: string;
    status?: string; // dispatched, in_transit, delivered
    deliveredAt?: Date;
  };

  @Prop({ type: Date, required: false })
  readyAt?: Date;

  @Prop({ type: Date, required: false })
  deliveredAt?: Date;

  @Prop({ type: Date, required: false })
  completedAt?: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const PrescriptionSchema = SchemaFactory.createForClass(Prescription);

