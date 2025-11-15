import { Injectable, NotFoundException, Inject, forwardRef, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PrescriptionStatus } from '@prisma/client';
import { PatientJourneyService } from '../patients/patient-journey.service';

@Injectable()
export class PrescriptionsService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => PatientJourneyService))
    private patientJourneyService?: PatientJourneyService,
  ) {}

  async create(createDto: any) {
    return this.prisma.prescription.create({
      data: createDto,
    });
  }

  async findByPatient(patientId: string) {
    return this.prisma.prescription.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        pharmacy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByDoctor(doctorId: string) {
    return this.prisma.prescription.findMany({
      where: { doctorId },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        pharmacy: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findById(id: string) {
    const prescription = await this.prisma.prescription.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        pharmacy: true,
      },
    });
    if (!prescription) {
      throw new NotFoundException('Prescription not found');
    }
    return prescription;
  }

  async update(id: string, updateDto: any) {
    return this.prisma.prescription.update({
      where: { id },
      data: updateDto,
    });
  }

  async assignToPharmacy(id: string, pharmacyId: string) {
    return this.prisma.prescription.update({
      where: { id },
      data: {
        pharmacyId,
        status: PrescriptionStatus.PENDING,
      },
    });
  }

  async fillPrescription(id: string, notes?: string) {
    const updated = await this.prisma.prescription.update({
      where: { id },
      data: {
        status: PrescriptionStatus.FILLED,
        pharmacyNotes: notes,
      },
      include: {
        patient: true,
      },
    });
    
    // Update patient journey - mark pharmacy step as complete
    if (this.patientJourneyService && updated?.patientId) {
      try {
        await this.patientJourneyService.markPharmacyComplete(updated.patientId, undefined, id);
      } catch (error: any) {
        console.log('Journey update skipped:', error.message);
      }
    }
    
    return updated;
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
    try {
      const where = specialty ? { specialty } : {};
      let templates = await this.prisma.prescriptionTemplate.findMany({
        where,
        orderBy: { name: 'asc' },
      });
      
      // If no templates exist, create default templates
      if (templates.length === 0) {
        try {
          await this.createDefaultTemplates();
          templates = await this.prisma.prescriptionTemplate.findMany({
            where,
            orderBy: { name: 'asc' },
          });
        } catch (error) {
          console.error('Error creating default templates:', error);
          return [];
        }
      }
      
      return templates;
    } catch (error) {
      console.error('Error fetching templates:', error);
      throw error;
    }
  }

  private async createDefaultTemplates() {
    const defaultTemplates = [
      {
        name: 'Dry Eye Treatment',
        specialty: 'General Ophthalmology',
        medications: [
          {
            name: 'Artificial Tears',
            dosage: '1-2 drops',
            frequency: '4 times daily',
            duration: '4-6 weeks',
            instructions: 'Apply in each eye as needed for dryness',
          },
          {
            name: 'Cyclosporine Eye Drops',
            dosage: '1 drop',
            frequency: 'Twice daily',
            duration: '3-6 months',
            instructions: 'Apply before bedtime',
          },
        ],
        notes: 'Treat dry eye syndrome. Monitor for improvement after 2-4 weeks.',
      },
      {
        name: 'Glaucoma Management',
        specialty: 'Glaucoma',
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
      },
      {
        name: 'Eye Infection Treatment',
        specialty: 'General Ophthalmology',
        medications: [
          {
            name: 'Chloramphenicol Eye Drops',
            dosage: '1-2 drops',
            frequency: '4 times daily',
            duration: '7-10 days',
            instructions: 'Apply to infected eye. Wash hands before application.',
          },
          {
            name: 'Chloramphenicol Eye Ointment',
            dosage: 'Small amount',
            frequency: 'At bedtime',
            duration: '7-10 days',
            instructions: 'Apply before sleep for better coverage.',
          },
        ],
        notes: 'Complete full course even if symptoms improve. Avoid contact lenses during treatment.',
      },
      {
        name: 'Allergic Conjunctivitis',
        specialty: 'General Ophthalmology',
        medications: [
          {
            name: 'Antihistamine Eye Drops',
            dosage: '1-2 drops',
            frequency: 'Twice daily',
            duration: '2-4 weeks',
            instructions: 'Apply as needed for allergy symptoms',
          },
          {
            name: 'Artificial Tears',
            dosage: '1-2 drops',
            frequency: 'As needed',
            duration: 'As needed',
            instructions: 'Use to flush allergens',
          },
        ],
        notes: 'Avoid allergens. Cool compress may help reduce irritation.',
      },
      {
        name: 'Single Vision Glasses',
        specialty: 'Refractive Error',
        glasses: [
          {
            type: 'glasses',
            prescription: {
              sphere: '-2.00',
              cylinder: '0.00',
              axis: '0',
            },
            lensType: 'Single Vision',
            frame: 'Standard Frame',
          },
        ],
        notes: 'Standard single vision correction. Update prescription annually.',
      },
      {
        name: 'Progressive Lenses',
        specialty: 'Presbyopia',
        glasses: [
          {
            type: 'glasses',
            prescription: {
              sphere: '0.00',
              cylinder: '0.00',
              axis: '0',
              add: '+2.50',
            },
            lensType: 'Progressive',
            frame: 'Full Frame Recommended',
          },
        ],
        notes: 'Progressive lenses for presbyopia. Allow 1-2 weeks adaptation period.',
      },
      {
        name: 'Bifocal Glasses',
        specialty: 'Presbyopia',
        glasses: [
          {
            type: 'glasses',
            prescription: {
              sphere: '0.00',
              cylinder: '0.00',
              axis: '0',
              add: '+2.50',
            },
            lensType: 'Bifocal',
            frame: 'Standard Frame',
          },
        ],
        notes: 'Bifocal correction for near and distance vision.',
      },
      {
        name: 'Astigmatism Correction',
        specialty: 'Refractive Error',
        glasses: [
          {
            type: 'glasses',
            prescription: {
              sphere: '-2.00',
              cylinder: '-1.50',
              axis: '90',
            },
            lensType: 'Single Vision',
            frame: 'Standard Frame',
          },
        ],
        notes: 'Astigmatism correction. Ensure proper axis alignment.',
      },
      {
        name: 'Contact Lenses - Daily',
        specialty: 'Refractive Error',
        glasses: [
          {
            type: 'contact_lenses',
            prescription: {
              sphere: '-2.00',
              cylinder: '0.00',
              axis: '0',
            },
            lensType: 'Daily Disposable',
          },
        ],
        notes: 'Daily disposable contact lenses. Replace daily. Follow hygiene guidelines.',
      },
      {
        name: 'Contact Lenses - Monthly',
        specialty: 'Refractive Error',
        glasses: [
          {
            type: 'contact_lenses',
            prescription: {
              sphere: '-2.00',
              cylinder: '-0.75',
              axis: '180',
            },
            lensType: 'Monthly',
          },
        ],
        notes: 'Monthly contact lenses. Clean daily. Replace monthly or as recommended.',
      },
    ];

    try {
      for (const template of defaultTemplates) {
        try {
          const existing = await this.prisma.prescriptionTemplate.findFirst({
            where: { name: template.name },
          });
          if (!existing) {
            await this.prisma.prescriptionTemplate.create({
              data: {
                ...template,
                medications: template.medications as any,
                glasses: template.glasses as any,
              },
            });
          }
        } catch (error) {
          console.error(`Error creating template "${template.name}":`, error);
        }
      }
    } catch (error) {
      console.error('Error in createDefaultTemplates:', error);
      throw error;
    }
  }

  async createTemplate(templateData: any) {
    try {
      return await this.prisma.prescriptionTemplate.create({
        data: templateData,
      });
    } catch (error) {
      console.error('Error creating template:', error);
      throw error;
    }
  }

  async getTemplateById(id: string) {
    const template = await this.prisma.prescriptionTemplate.findUnique({
      where: { id },
    });
    if (!template) {
      throw new NotFoundException('Template not found');
    }
    return template;
  }

  async signPrescription(id: string, signature: string, doctorId: string) {
    const existing = await this.prisma.prescription.findUnique({
      where: { id },
    });
    
    if (!existing) {
      throw new NotFoundException('Prescription not found');
    }

    const metadata = (existing.metadata as any) || {};
    metadata.digitalSignature = signature;
    metadata.signedBy = doctorId;
    metadata.signedAt = new Date();

    return this.prisma.prescription.update({
      where: { id },
      data: {
        metadata: metadata as any,
      },
    });
  }
}
