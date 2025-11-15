import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PatientsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getPatientProfile(userId: string) {
    return this.prisma.patient.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async updatePatientProfile(userId: string, data: any) {
    return this.prisma.patient.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async createOrUpdatePatient(userId: string, data: any) {
    return this.prisma.patient.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async getMedicalHistory(patientId: string) {
    return this.prisma.medicalHistory.findMany({
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
      orderBy: { visitDate: 'desc' },
    });
  }

  async addMedicalHistory(data: any) {
    return this.prisma.medicalHistory.create({
      data,
    });
  }
}

