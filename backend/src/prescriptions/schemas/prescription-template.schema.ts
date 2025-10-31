import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PrescriptionTemplateDocument = PrescriptionTemplate & Document;

@Schema({ timestamps: true })
export class PrescriptionTemplate {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, type: String })
  specialty: string;

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
    type: string;
    prescription: {
      sphere: string;
      cylinder: string;
      axis: string;
      add?: string;
    };
    frame?: string;
    lensType?: string;
  }>;

  @Prop({ required: false })
  notes: string;

  @Prop({ required: false, type: String })
  createdBy?: string;
}

export const PrescriptionTemplateSchema = SchemaFactory.createForClass(PrescriptionTemplate);


