import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';
import { PrescriptionStatus } from '@prisma/client';

@Injectable()
export class PharmacyService {
  constructor(
    private prescriptionsService: PrescriptionsService,
    private prisma: PrismaService,
  ) {}

  async getPrescriptions(pharmacyId: string) {
    return this.prisma.prescription.findMany({
      where: { pharmacyId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async getAllPendingPrescriptions() {
    return this.prisma.prescription.findMany({
      where: { status: PrescriptionStatus.PENDING },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async fillPrescription(prescriptionId: string, notes?: string) {
    return this.prescriptionsService.fillPrescription(prescriptionId, notes);
  }
}
