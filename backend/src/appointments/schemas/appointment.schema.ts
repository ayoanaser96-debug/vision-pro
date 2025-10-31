import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type AppointmentDocument = Appointment & Document;

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
}

export enum AppointmentType {
  IN_PERSON = 'in_person',
  VIDEO = 'video',
  PHONE = 'phone',
}

@Schema({ timestamps: true })
export class Appointment {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  doctorId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  appointmentDate: Date;

  @Prop({ required: true })
  appointmentTime: string;

  @Prop({ enum: AppointmentType, default: AppointmentType.IN_PERSON })
  type: AppointmentType;

  @Prop({ enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  status: AppointmentStatus;

  @Prop({ required: false })
  reason: string;

  @Prop({ required: false })
  notes: string;

  @Prop({ required: false })
  videoLink?: string;
}

export const AppointmentSchema = SchemaFactory.createForClass(Appointment);


