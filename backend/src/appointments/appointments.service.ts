import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AppointmentStatus } from '@prisma/client';

@Injectable()
export class AppointmentsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(createDto: any) {
    try {
      // Validate required fields
      if (!createDto.appointmentDate || !createDto.appointmentTime) {
        throw new BadRequestException('Appointment date and time are required');
      }

      // Convert date string to Date object if needed
      if (typeof createDto.appointmentDate === 'string') {
        const date = new Date(createDto.appointmentDate);
        if (isNaN(date.getTime())) {
          throw new BadRequestException('Invalid appointment date format');
        }
        createDto.appointmentDate = date;
      }

      // Ensure patientId is set
      if (!createDto.patientId) {
        throw new BadRequestException('Patient ID is required');
      }

      // Remove any fields that are not in the schema (like 'urgency')
      const { urgency, ...validData } = createDto;

      // Ensure status is valid (default to 'pending' if invalid)
      const validStatuses = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];
      if (validData.status && !validStatuses.includes(validData.status)) {
        validData.status = 'PENDING';
      }

      return await this.prisma.appointment.create({
        data: {
          ...validData,
          status: (validData.status || 'PENDING') as AppointmentStatus,
        },
      });
    } catch (error: any) {
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      console.error('Error creating appointment:', error);
      const errorMessage = error.message || 'Failed to create appointment';
      throw new BadRequestException(errorMessage);
    }
  }

  async findByPatient(patientId: string) {
    return this.prisma.appointment.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async findByDoctor(doctorId: string) {
    return this.prisma.appointment.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async findAll() {
    return this.prisma.appointment.findMany({
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: { appointmentDate: 'desc' },
    });
  }

  async findById(id: string) {
    const appointment = await this.prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
      },
    });
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async update(id: string, updateDto: any) {
    return this.prisma.appointment.update({
      where: { id },
      data: updateDto,
    });
  }

  async cancel(id: string) {
    return this.prisma.appointment.update({
      where: { id },
      data: { status: AppointmentStatus.CANCELLED },
    });
  }

  async getUpcomingByPatient(patientId: string) {
    return this.prisma.appointment.findMany({
      where: {
        patientId,
        appointmentDate: { gte: new Date() },
        status: { in: [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED] },
      },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: { appointmentDate: 'asc' },
    });
  }
}


