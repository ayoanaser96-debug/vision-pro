import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Appointment, AppointmentDocument } from './schemas/appointment.schema';

@Injectable()
export class AppointmentsService {
  constructor(
    @InjectModel(Appointment.name)
    private appointmentModel: Model<AppointmentDocument>,
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

      // Ensure doctorId is set (optional but validate if provided)
      if (createDto.doctorId) {
        // Validate doctorId is a valid ObjectId format
        if (typeof createDto.doctorId !== 'string' || createDto.doctorId.length !== 24) {
          throw new BadRequestException('Invalid doctor ID format');
        }
      }

      // Remove any fields that are not in the schema (like 'urgency')
      const { urgency, ...validData } = createDto;

      // Ensure status is valid (default to 'pending' if invalid)
      const validStatuses = ['pending', 'confirmed', 'completed', 'cancelled'];
      if (validData.status && !validStatuses.includes(validData.status)) {
        validData.status = 'pending';
      }

      const appointment = new this.appointmentModel(validData);
      return await appointment.save();
    } catch (error: any) {
      // If it's already a NestJS exception, re-throw it
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      // Log the full error for debugging
      console.error('Error creating appointment:', error);
      // Return a more helpful error message
      const errorMessage = error.message || 'Failed to create appointment';
      throw new BadRequestException(errorMessage);
    }
  }

  async findByPatient(patientId: string) {
    return this.appointmentModel
      .find({ patientId })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ appointmentDate: -1 });
  }

  async findByDoctor(doctorId: string) {
    return this.appointmentModel
      .find({ doctorId })
      .populate('patientId', 'firstName lastName email phone')
      .sort({ appointmentDate: -1 });
  }

  async findAll() {
    return this.appointmentModel
      .find()
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ appointmentDate: -1 });
  }

  async findById(id: string) {
    const appointment = await this.appointmentModel
      .findById(id)
      .populate('patientId')
      .populate('doctorId');
    if (!appointment) {
      throw new NotFoundException('Appointment not found');
    }
    return appointment;
  }

  async update(id: string, updateDto: any) {
    return this.appointmentModel.findByIdAndUpdate(id, updateDto, { new: true });
  }

  async cancel(id: string) {
    return this.appointmentModel.findByIdAndUpdate(
      id,
      { status: 'cancelled' },
      { new: true },
    );
  }

  async getUpcomingByPatient(patientId: string) {
    return this.appointmentModel
      .find({
        patientId,
        appointmentDate: { $gte: new Date() },
        status: { $in: ['pending', 'confirmed'] },
      })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ appointmentDate: 1 });
  }
}


