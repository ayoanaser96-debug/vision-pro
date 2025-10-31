import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type SupplierDocument = Supplier & Document;

@Schema({ timestamps: true })
export class Supplier {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  contactEmail: string;

  @Prop({ required: true })
  contactPhone: string;

  @Prop({ required: false })
  address?: string;

  @Prop({ type: Object, default: {} })
  rating: {
    deliveryTime: number; // 1-5
    reliability: number; // 1-5
    quality: number; // 1-5
    overall: number; // 1-5
  };

  @Prop({ required: false })
  notes?: string;

  @Prop({ required: false })
  pharmacyId?: MongooseSchema.Types.ObjectId;

  createdAt?: Date;
  updatedAt?: Date;
}

export const SupplierSchema = SchemaFactory.createForClass(Supplier);


