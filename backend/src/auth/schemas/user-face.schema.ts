import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type UserFaceDocument = UserFace & Document;

@Schema({ timestamps: true })
export class UserFace {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User', unique: true })
  userId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  faceDescriptor: string; // Base64 encoded face descriptor/embedding

  @Prop({ required: false })
  faceImage: string; // Base64 encoded face image for display

  @Prop({ required: false })
  confidence: number; // Recognition confidence score

  @Prop({ type: Object, required: false })
  metadata?: {
    age?: number;
    gender?: string;
    landmarks?: any[];
    boundingBox?: {
      x: number;
      y: number;
      width: number;
      height: number;
    };
  };

  @Prop({ required: false, default: true })
  isActive: boolean;

  createdAt?: Date;
  updatedAt?: Date;
}

export const UserFaceSchema = SchemaFactory.createForClass(UserFace);

