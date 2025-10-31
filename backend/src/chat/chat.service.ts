import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ChatMessage, ChatMessageDocument } from './schemas/chat-message.schema';

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatMessage.name)
    private chatMessageModel: Model<ChatMessageDocument>,
  ) {}

  async saveMessage(data: {
    senderId: string;
    receiverId: string;
    message: string;
    appointmentId?: string;
  }) {
    const message = new this.chatMessageModel(data);
    return message.save();
  }

  async getConversation(user1Id: string, user2Id: string) {
    return this.chatMessageModel
      .find({
        $or: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id },
        ],
      })
      .populate('senderId', 'firstName lastName')
      .populate('receiverId', 'firstName lastName')
      .sort({ createdAt: 1 });
  }

  async markAsRead(messageId: string) {
    return this.chatMessageModel.findByIdAndUpdate(
      messageId,
      { isRead: true },
      { new: true },
    );
  }
}


