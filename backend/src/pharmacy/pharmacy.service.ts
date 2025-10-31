import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prescription, PrescriptionDocument } from '../prescriptions/schemas/prescription.schema';
import { PrescriptionsService } from '../prescriptions/prescriptions.service';

@Injectable()
export class PharmacyService {
  constructor(
    private prescriptionsService: PrescriptionsService,
    @InjectModel(Prescription.name) private prescriptionModel: Model<PrescriptionDocument>,
  ) {}

  async getPrescriptions(pharmacyId: string) {
    // Get prescriptions assigned to this pharmacy
    return this.prescriptionModel
      .find({ pharmacyId })
      .populate('patientId', 'firstName lastName email phone')
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ createdAt: -1 });
  }

  async getAllPendingPrescriptions() {
    // Get all pending prescriptions (for pharmacy selection)
    return this.prescriptionModel
      .find({ status: 'pending' })
      .populate('patientId', 'firstName lastName')
      .populate('doctorId', 'firstName lastName')
      .sort({ createdAt: -1 });
  }

  async fillPrescription(prescriptionId: string, notes?: string) {
    return this.prescriptionsService.fillPrescription(prescriptionId, notes);
  }
}

