import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum UserRole {
  PATIENT = 'patient',
  OPTOMETRIST = 'optometrist',
  DOCTOR = 'doctor',
  ADMIN = 'admin',
  PHARMACY = 'pharmacy',
}

export enum UserStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  SUSPENDED = 'suspended',
}

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true, unique: true })
  email: string;

  @Prop({ required: false, unique: true, sparse: true })
  phone?: string;

  @Prop({ required: false, unique: true, sparse: true })
  nationalId?: string;

  @Prop({ required: true })
  password: string;

  @Prop({ required: true })
  firstName: string;

  @Prop({ required: true })
  lastName: string;

  @Prop({ required: true, enum: UserRole })
  role: UserRole;

  @Prop({ enum: UserStatus, default: UserStatus.ACTIVE })
  status: UserStatus;

  @Prop({ required: false })
  specialty?: string; // For doctors

  @Prop({ required: false })
  profileImage?: string;

  @Prop({ required: false })
  dateOfBirth?: Date;

  @Prop({ required: false })
  address?: string;

  @Prop({ default: false })
  emailVerified: boolean;

  @Prop({ default: false })
  phoneVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);


