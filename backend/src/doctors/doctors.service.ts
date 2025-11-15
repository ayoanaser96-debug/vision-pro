import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EyeTestsService } from '../eye-tests/eye-tests.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { AppointmentsService } from '../appointments/appointments.service';
import { PatientsService } from '../patients/patients.service';

@Injectable()
export class DoctorsService {
  constructor(
    private prisma: PrismaService,
    private eyeTestsService: EyeTestsService,
    private prescriptionsService: PrescriptionsService,
    private appointmentsService: AppointmentsService,
    private patientsService: PatientsService,
  ) {}

  async getAssignedPatients(doctorId: string) {
    const appointments = await this.appointmentsService.findByDoctor(doctorId);
    const patientIds = [...new Set(appointments.map(apt => apt.patientId as string))];
    
    return Promise.all(
      patientIds.map((id: string) => this.patientsService.getPatientProfile(id))
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
