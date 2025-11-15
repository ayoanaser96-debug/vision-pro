import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ChatService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async saveMessage(data: {
    senderId: string;
    receiverId: string;
    message: string;
    appointmentId?: string;
  }) {
    return this.prisma.chatMessage.create({
      data,
    });
  }

  async getConversation(user1Id: string, user2Id: string) {
    return this.prisma.chatMessage.findMany({
      where: {
        OR: [
          { senderId: user1Id, receiverId: user2Id },
          { senderId: user2Id, receiverId: user1Id },
        ],
      },
      include: {
        sender: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        receiver: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async markAsRead(messageId: string) {
    return this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { isRead: true },
    });
  }
}
