import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type InventoryItemDocument = InventoryItem & Document;

@Schema({ timestamps: true })
export class InventoryItem {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  genericName: string;

  @Prop({ required: true })
  manufacturer: string;

  @Prop({ required: true })
  stock: number;

  @Prop({ required: true })
  unit: string; // e.g., 'tablets', 'ml', 'drops'

  @Prop({ required: true })
  expiryDate: Date;

  @Prop({ required: true })
  batchNumber: string;

  @Prop({ required: true })
  lotNumber: string;

  @Prop({ required: true })
  purchasePrice: number;

  @Prop({ required: true })
  sellingPrice: number;

  @Prop({ required: false })
  reorderLevel: number;

  @Prop({ required: false })
  supplierId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  pharmacyId?: MongooseSchema.Types.ObjectId;

  @Prop({ required: false })
  category?: string; // e.g., 'antibiotic', 'eye_drops', 'vitamins'

  @Prop({ type: Object, default: {} })
  alternativeNames: string[];

  @Prop({ required: false })
  description?: string;

  @Prop({ required: false })
  barcode?: string;

  createdAt?: Date;
  updatedAt?: Date;
}

export const InventoryItemSchema = SchemaFactory.createForClass(InventoryItem);


