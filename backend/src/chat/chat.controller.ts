import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get('conversation')
  async getConversation(@Request() req, @Query('userId') userId: string) {
    return this.chatService.getConversation(req.user.id, userId);
  }

  @Post('message')
  async sendMessage(
    @Request() req,
    @Body() body: { receiverId: string; message: string; appointmentId?: string },
  ) {
    return this.chatService.saveMessage({
      senderId: req.user.id,
      receiverId: body.receiverId,
      message: body.message,
      appointmentId: body.appointmentId,
    });
  }

  @Get('contacts')
  async getContacts(@Request() req) {
    // Get contacts based on user role
    // Patients can chat with doctors, analysts, pharmacists
    // Doctors can chat with patients, analysts
    // This is a simplified version - in production, fetch from database
    return {
      contacts: [],
      message: 'Contacts will be loaded based on appointments and assignments',
    };
  }

  @Put('message/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.chatService.markAsRead(id);
  }
}

