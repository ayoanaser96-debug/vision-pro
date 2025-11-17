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
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, PrescriptionStatus } from '@prisma/client';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private prisma: PrismaService,
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

    if (userRole === UserRole.PHARMACY) {
      const prescriptions = await this.prisma.prescription.findMany({
        where: {
          OR: [
            { pharmacyId: userId },
            { status: { in: [PrescriptionStatus.PENDING, PrescriptionStatus.PROCESSING] } },
          ],
        },
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
            },
          },
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      const doctorIds = [...new Set(
        prescriptions
          .map(p => p.doctorId)
          .filter(Boolean)
      )];
      
      for (const doctorId of doctorIds) {
        const doctor = await this.prisma.user.findUnique({
          where: { id: doctorId! },
        });
        if (doctor && doctor.role === UserRole.DOCTOR) {
          const prescriptionCount = await this.prisma.prescription.count({
            where: {
              doctorId: doctor.id,
              OR: [
                { pharmacyId: userId },
                { status: { in: [PrescriptionStatus.PENDING, PrescriptionStatus.PROCESSING] } },
              ],
            },
          });

          contacts.push({
            id: doctor.id,
            firstName: doctor.firstName,
            lastName: doctor.lastName,
            email: doctor.email,
            role: doctor.role,
            prescriptionCount,
          });
        }
      }
    } else if (userRole === UserRole.PATIENT) {
      const [doctors, prescriptions] = await Promise.all([
        this.prisma.user.findMany({
          where: { role: { in: [UserRole.DOCTOR, UserRole.OPTOMETRIST] } },
          take: 10,
        }),
        this.prisma.prescription.findMany({
          where: { patientId: userId },
          include: {
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        }),
      ]);

      prescriptions.forEach((prescription) => {
        if (prescription.doctor && !contacts.find(c => c.id === prescription.doctor!.id)) {
          contacts.push({
            id: prescription.doctor.id,
            firstName: prescription.doctor.firstName,
            lastName: prescription.doctor.lastName,
            email: prescription.doctor.email,
            role: UserRole.DOCTOR,
          });
        }
      });

      doctors.forEach((user) => {
        if (!contacts.find(c => c.id === user.id)) {
          contacts.push({
            id: user.id,
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            role: user.role,
          });
        }
      });
    } else if (userRole === UserRole.DOCTOR) {
      const prescriptions = await this.prisma.prescription.findMany({
        where: { doctorId: userId },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
      });

      prescriptions.forEach((prescription) => {
        const patientId = prescription.patientId;
        if (patientId && !contacts.find(c => c.id === patientId)) {
          contacts.push({
            id: prescription.patient.id,
            firstName: prescription.patient.firstName,
            lastName: prescription.patient.lastName,
            email: prescription.patient.email,
            role: UserRole.PATIENT,
          });
        }
      });
    }

    return {
      contacts: contacts.filter(c => c.id !== userId),
      message: `Found ${contacts.length} contacts`,
    };
  }

  @Put('message/:id/read')
  async markAsRead(@Param('id') id: string) {
    return this.chatService.markAsRead(id);
  }
}
