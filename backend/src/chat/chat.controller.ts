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
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../users/schemas/user.schema';
import { Prescription } from '../prescriptions/schemas/prescription.schema';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    @InjectModel('User') private userModel: Model<User>,
    @InjectModel('Prescription') private prescriptionModel: Model<Prescription>,
  ) {}

  @Get('conversation')
  async getConversation(@Request() req, @Query('userId') userId: string) {
    return this.chatService.getConversation(req.user.id, userId);
  }

  @Post('message')
  async sendMessage(
    @Request() req,
    @Body() body: { receiverId: string; message: string; appointmentId?: string; prescriptionId?: string },
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
    const userId = req.user.id;
    const userRole = req.user.role;
    const contacts: any[] = [];

    if (userRole === 'pharmacy') {
      // For pharmacy: get doctors from prescriptions assigned to this pharmacy
      const prescriptions = await this.prescriptionModel
        .find({
          $or: [
            { pharmacyId: userId },
            { status: { $in: ['pending', 'processing'] } },
          ],
        })
        .populate('doctorId', 'firstName lastName email role')
        .populate('patientId', 'firstName lastName email')
        .exec();

      // Get unique doctor IDs
      const doctorIds = [...new Set(
        prescriptions
          .map((p: any) => {
            if (p.doctorId && typeof p.doctorId === 'object' && p.doctorId._id) {
              return p.doctorId._id.toString();
            }
            if (p.doctorId && typeof p.doctorId === 'string') {
              return p.doctorId;
            }
            return null;
          })
          .filter(Boolean)
      )];
      
      for (const doctorId of doctorIds) {
        const doctor = await this.userModel.findById(doctorId);
        if (doctor && doctor.role === 'doctor') {
          // Get prescription count for this doctor
          const prescriptionCount = await this.prescriptionModel.countDocuments({
            doctorId: doctor._id,
            $or: [
              { pharmacyId: userId },
              { status: { $in: ['pending', 'processing'] } },
            ],
          });

          contacts.push({
            _id: doctor._id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            email: doctor.email,
            role: doctor.role,
            prescriptionCount,
          });
        }
      }
    } else if (userRole === 'patient') {
      // For patients: get doctors and analysts from appointments and prescriptions
      const [appointments, prescriptions] = await Promise.all([
        this.userModel.find({ role: { $in: ['doctor', 'analyst'] } }).limit(10).exec(),
        this.prescriptionModel.find({ patientId: userId }).populate('doctorId', 'firstName lastName email').exec(),
      ]);

      // Add doctors from prescriptions
      prescriptions.forEach((prescription: any) => {
        if (prescription.doctorId && !contacts.find(c => c._id.toString() === prescription.doctorId._id.toString())) {
          contacts.push({
            _id: prescription.doctorId._id,
            firstName: prescription.doctorId.firstName,
            lastName: prescription.doctorId.lastName,
            email: prescription.doctorId.email,
            role: 'doctor',
          });
        }
      });

      // Add doctors and analysts from appointments
      appointments.forEach((user: any) => {
        if (!contacts.find(c => c._id.toString() === user._id.toString())) {
          contacts.push({
            _id: user._id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          });
        }
      });
    } else if (userRole === 'doctor') {
      // For doctors: get patients from prescriptions
      const prescriptions = await this.prescriptionModel
        .find({ doctorId: userId })
        .populate('patientId', 'firstName lastName email')
        .exec();

      prescriptions.forEach((prescription: any) => {
        const patientId = prescription.patientId?._id || prescription.patientId;
        if (patientId && !contacts.find(c => c._id.toString() === patientId.toString())) {
          contacts.push({
            _id: patientId,
            firstName: prescription.patientId?.firstName || '',
            lastName: prescription.patientId?.lastName || '',
            email: prescription.patientId?.email || '',
            role: 'patient',
          });
        }
      });
    }

    return {
      contacts: contacts.filter(c => c._id.toString() !== userId),
      message: `Found ${contacts.length} contacts`,
    };
  }

  @Put('message/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.chatService.markAsRead(id);
  }
}

