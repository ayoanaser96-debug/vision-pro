import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserDocumentDocument = UserDocument & Document;

export enum DocumentType {
  ID_CARD = 'id_card',
  PASSPORT = 'passport',
  DRIVER_LICENSE = 'driver_license',
  OTHER = 'other',
}

@Schema({ timestamps: true })
export class UserDocument {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, enum: DocumentType })
  documentType: DocumentType;

  @Prop({ required: true })
  frontImage: string; // Base64 encoded document image

  @Prop({ required: false })
  backImage?: string; // For ID cards that have back side

  @Prop({ type: Object, required: false })
  extractedData?: {
    fullName?: string;
    firstName?: string;
    lastName?: string;
    middleName?: string;
    dateOfBirth?: string;
    nationality?: string;
    documentNumber?: string;
    issueDate?: string;
    expiryDate?: string;
    address?: string;
    gender?: string;
    // Additional fields
    [key: string]: any;
  };

  @Prop({ required: false })
  ocrConfidence: number; // OCR confidence score

  @Prop({ type: Object, required: false })
  metadata?: {
    scannedAt?: Date;
    scannerType?: string;
    imageQuality?: number;
    verified?: boolean;
    verifiedBy?: MongooseSchema.Types.ObjectId;
    verifiedAt?: Date;
  };

  @Prop({ required: false, default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserDocumentSchema = SchemaFactory.createForClass(UserDocument);

