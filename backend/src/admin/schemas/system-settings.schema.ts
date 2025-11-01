import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SystemSettingsDocument = SystemSettings & Document;

@Schema({ timestamps: true })
export class SystemSettings {
  @Prop({ required: true, unique: true, default: 'global' })
  settingsKey: string;

  @Prop({ required: false, default: 'USD' })
  currency: string;

  @Prop({ required: false, default: 'en' })
  language: string;

  @Prop({ required: false, default: 'light' })
  theme: string;

  @Prop({ type: Object, required: false })
  otherSettings?: {
    [key: string]: any;
  };

  createdAt?: Date;
  updatedAt?: Date;
}

export const SystemSettingsSchema = SchemaFactory.createForClass(SystemSettings);

