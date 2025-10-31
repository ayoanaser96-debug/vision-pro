import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Patient, PatientDocument } from './schemas/patient.schema';
import { MedicalHistory, MedicalHistoryDocument } from './schemas/medical-history.schema';

@Injectable()
export class PatientsService {
  constructor(
    @InjectModel(Patient.name) private patientModel: Model<PatientDocument>,
    @InjectModel(MedicalHistory.name) private historyModel: Model<MedicalHistoryDocument>,
  ) {}

  async getPatientProfile(userId: string) {
    return this.patientModel.findOne({ userId }).populate('userId');
  }

  async updatePatientProfile(userId: string, data: any) {
    return this.patientModel.findOneAndUpdate(
      { userId },
      { userId, ...data },
      { upsert: true, new: true },
    );
  }

  async createOrUpdatePatient(userId: string, data: any) {
    return this.patientModel.findOneAndUpdate(
      { userId },
      { userId, ...data },
      { upsert: true, new: true },
    );
  }

  async getMedicalHistory(patientId: string) {
    return this.historyModel
      .find({ patientId })
      .populate('doctorId', 'firstName lastName specialty')
      .sort({ visitDate: -1 });
  }

  async addMedicalHistory(data: any) {
    const history = new this.historyModel(data);
    return history.save();
  }
}

