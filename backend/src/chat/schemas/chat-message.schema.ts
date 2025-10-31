import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type ChatMessageDocument = ChatMessage & Document;

@Schema({ timestamps: true })
export class ChatMessage {
  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  senderId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true, type: MongooseSchema.Types.ObjectId, ref: 'User' })
  receiverId: MongooseSchema.Types.ObjectId;

  @Prop({ required: true })
  message: string;

  @Prop({ default: false })
  isRead: boolean;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'Appointment' })
  appointmentId?: MongooseSchema.Types.ObjectId;
}

export const ChatMessageSchema = SchemaFactory.createForClass(ChatMessage);


