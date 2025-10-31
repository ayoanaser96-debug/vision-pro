import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type MedicalHistoryDocument = MedicalHistory & Document;

@Schema({ timestamps: true })
export class MedicalHistory {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  patientId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  visitDate: Date;

  @Prop({ required: false })
  diagnosis: string;

  @Prop({ type: Array, default: [] })
  symptoms: string[];

  @Prop({ required: false })
  notes: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User' })
  doctorId?: MongooseSchema.Types.ObjectId;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Appointment' })
  appointmentId?: MongooseSchema.Types.ObjectId;
}

export const MedicalHistorySchema = SchemaFactory.createForClass(MedicalHistory);


