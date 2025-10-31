import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Prescription, PrescriptionDocument } from './schemas/prescription.schema';
import { PrescriptionTemplate, PrescriptionTemplateDocument } from './schemas/prescription-template.schema';

@Injectable()
export class PrescriptionsService {
  constructor(
    @InjectModel(Prescription.name)
    private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(PrescriptionTemplate.name)
    private templateModel: Model<PrescriptionTemplateDocument>,
  ) {}

  async create(createDto: any) {
    const prescription = new this.prescriptionModel(createDto);
    return prescription.save();
  }

  async findByPatient(patientId: string) {
    return this.prescriptionModel
      .find({ patientId })
      .populate('doctorId', 'firstName lastName specialty')
      .populate('pharmacyId', 'firstName lastName')
      .sort({ createdAt: -1 });
  }

  async findByDoctor(doctorId: string) {
    return this.prescriptionModel
      .find({ doctorId })
      .populate('patientId', 'firstName lastName')
      .populate('pharmacyId', 'firstName lastName')
      .sort({ createdAt: -1 });
  }

  async findById(id: string) {
    const prescription = await this.prescriptionModel
      .findById(id)
      .populate('patientId')
      .populate('doctorId')
      .populate('pharmacyId');
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }
    return prescription;
  }

  async update(id: string, updateDto: any) {
    return this.prescriptionModel.findByIdAndUpdate(id, updateDto, { new: true });
  }

  async assignToPharmacy(id: string, pharmacyId: string) {
    return this.prescriptionModel.findByIdAndUpdate(
      id,
      { pharmacyId, status: 'pending' },
      { new: true },
    );
  }

  async fillPrescription(id: string, notes?: string) {
    return this.prescriptionModel.findByIdAndUpdate(
      id,
      { status: 'filled', pharmacyNotes: notes },
      { new: true },
    );
  }

  async getAISuggestions(diagnosis: string, patientHistory?: any) {
    // AI-based prescription suggestions
    const suggestions: any[] = [];

    if (diagnosis.toLowerCase().includes('cataract')) {
      suggestions.push({
        medications: [
          {
            name: 'Artificial Tears',
            dosage: '1-2 drops',
            frequency: '4 times daily',
            duration: '2-4 weeks',
            instructions: 'Use as needed for dryness',
          },
        ],
        glasses: [
          {
            type: 'glasses',
            prescription: {
              sphere: patientHistory?.refraction?.sphere || '0.00',
              cylinder: patientHistory?.refraction?.cylinder || '0.00',
              axis: patientHistory?.refraction?.axis || '0',
            },
            lensType: 'Anti-reflective',
          },
        ],
        notes: 'Post-cataract surgery care. Monitor for inflammation.',
      });
    }

    if (diagnosis.toLowerCase().includes('glaucoma')) {
      suggestions.push({
        medications: [
          {
            name: 'Timolol Eye Drops',
            dosage: '1 drop',
            frequency: 'Twice daily',
            duration: 'Ongoing',
            instructions: 'Apply to affected eye(s). Monitor IOP regularly.',
          },
        ],
        notes: 'Regular IOP monitoring required. Follow-up in 3 months.',
      });
    }

    if (diagnosis.toLowerCase().includes('diabetic retinopathy')) {
      suggestions.push({
        medications: [
          {
            name: 'Lucentis (Ranibizumab)',
            dosage: '0.5mg',
            frequency: 'Monthly injections',
            duration: '3-6 months',
            instructions: 'Intravitreal injection by specialist',
          },
        ],
        notes: 'Requires specialist ophthalmologist consultation. Strict blood sugar control essential.',
      });
    }

    if (diagnosis.toLowerCase().includes('myopia') || diagnosis.toLowerCase().includes('nearsighted')) {
      suggestions.push({
        glasses: [
          {
            type: 'glasses',
            prescription: {
              sphere: patientHistory?.refraction?.sphere || '-2.00',
              cylinder: patientHistory?.refraction?.cylinder || '0.00',
              axis: patientHistory?.refraction?.axis || '0',
            },
            lensType: 'Single Vision',
          },
        ],
        notes: 'Regular vision check recommended annually.',
      });
    }

    return suggestions;
  }

  async getTemplates(specialty?: string) {
    const query = specialty ? { specialty } : {};
    return this.templateModel.find(query).sort({ name: 1 });
  }

  async createTemplate(templateData: any) {
    const template = new this.templateModel(templateData);
    return template.save();
  }

  async getTemplateById(id: string) {
    const template = await this.templateModel.findById(id);
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async signPrescription(id: string, signature: string, doctorId: string) {
    return this.prescriptionModel.findByIdAndUpdate(
      id,
      {
        $set: {
          'metadata.digitalSignature': signature,
          'metadata.signedBy': doctorId,
          'metadata.signedAt': new Date(),
        },
      },
      { new: true },
    );
  }
}

