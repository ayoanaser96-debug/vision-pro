import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PatientDocument = Patient & Document;

@Schema({ timestamps: true })
export class Patient {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ type: Array, default: [] })
  allergies: string[];

  @Prop({ type: Array, default: [] })
  chronicConditions: string[];

  @Prop({ type: Array, default: [] })
  medications: string[];

  @Prop({ type: Array, default: [] })
  emergencyContacts: Array<{
    name: string;
    relationship: string;
    phone: string;
  }>;
}

export const PatientSchema = SchemaFactory.createForClass(Patient);


