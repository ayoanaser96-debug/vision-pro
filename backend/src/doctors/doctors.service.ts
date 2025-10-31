import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { EyeTestsService } from '../eye-tests/eye-tests.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { PatientsService } from '../patients/patients.service';

@Injectable()
export class DoctorsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private eyeTestsService: EyeTestsService,
    private prescriptionsService: PrescriptionsService,
    private appointmentsService: AppointmentsService,
    private patientsService: PatientsService,
  ) {}

  async getAssignedPatients(doctorId: string) {
    // Get patients assigned to this doctor via appointments or tests
    const appointments = await this.appointmentsService.findByDoctor(doctorId);
    const patientIds = [...new Set(appointments.map(apt => apt.patientId.toString()))];
    
    return Promise.all(
      patientIds.map(id => this.patientsService.getPatientProfile(id))
    );
  }

  async getCasesForReview(doctorId?: string) {
    return this.eyeTestsService.findAnalyzedForDoctor(doctorId);
  }

  async reviewTest(testId: string, review: any, doctorId: string) {
    return this.eyeTestsService.doctorReview(testId, {
      ...review,
      doctorId,
    });
  }

  async createPrescription(data: any, doctorId: string) {
    return this.prescriptionsService.create({
      ...data,
      doctorId,
    });
  }

  async getMyAppointments(doctorId: string) {
    return this.appointmentsService.findByDoctor(doctorId);
  }
}


