import { Injectable, NotFoundException, Inject, forwardRef, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TestStatus } from '@prisma/client';
import { PatientJourneyService } from '../patients/patient-journey.service';

@Injectable()
export class EyeTestsService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => PatientJourneyService))
    private patientJourneyService?: PatientJourneyService,
  ) {}

  async create(createDto: any) {
    return this.prisma.eyeTest.create({
      data: createDto,
    });
  }

  async runAIAnalysis(testId: string) {
    const test = await this.prisma.eyeTest.findUnique({
      where: { id: testId },
    });
    if (!test) {
      throw new NotFoundException('Test not found');
    }

    // Simulate AI analysis (replace with actual AI model integration)
    const aiAnalysis = this.simulateAIAnalysis(test);

    return this.prisma.eyeTest.update({
      where: { id: testId },
      data: {
        aiAnalysis: aiAnalysis as any,
        status: TestStatus.ANALYZED,
      },
    });
  }

  private simulateAIAnalysis(test: any): any {
    // Simulate AI analysis results
    return {
      cataract: {
        detected: Math.random() > 0.7,
        severity: Math.random() > 0.5 ? 'mild' : 'none',
        confidence: Math.random() * 0.3 + 0.7,
      },
      glaucoma: {
        detected: Math.random() > 0.8,
        severity: Math.random() > 0.5 ? 'mild' : 'none',
        confidence: Math.random() * 0.3 + 0.7,
      },
      diabeticRetinopathy: {
        detected: Math.random() > 0.85,
        severity: Math.random() > 0.5 ? 'mild' : 'none',
        confidence: Math.random() * 0.3 + 0.7,
      },
      overallAssessment: 'Normal eye examination with no significant abnormalities detected.',
    };
  }

  async findByPatient(patientId: string) {
    return this.prisma.eyeTest.findMany({
      where: { patientId },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        analyst: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findPendingForAnalysis() {
    return this.prisma.eyeTest.findMany({
      where: { status: TestStatus.PENDING },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findAnalyzedForDoctor(doctorId?: string) {
    const where: any = { status: TestStatus.ANALYZED };
    if (doctorId) {
      where.doctorId = doctorId;
    }
    return this.prisma.eyeTest.findMany({
      where,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        analyst: {
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
    const test = await this.prisma.eyeTest.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
        analyst: true,
      },
    });
    if (!test) {
      throw new NotFoundException('Test not found');
    }
    return test;
  }

  async update(id: string, updateDto: any) {
    return this.prisma.eyeTest.update({
      where: { id },
      data: updateDto,
    });
  }

  async addAnalystNotes(id: string, notes: string, analystId: string) {
    const updated = await this.prisma.eyeTest.update({
      where: { id },
      data: {
        analystNotes: notes,
        analystId,
        status: TestStatus.DOCTOR_REVIEW,
      },
      include: {
        patient: true,
      },
    });
    
    // Update patient journey - mark analyst step as complete
    if (this.patientJourneyService && updated?.patientId) {
      try {
        await this.patientJourneyService.markAnalystComplete(updated.patientId, analystId);
      } catch (error: any) {
        console.log('Journey update skipped:', error.message);
      }
    }
    
    return updated;
  }

  async doctorReview(id: string, review: any) {
    const updated = await this.prisma.eyeTest.update({
      where: { id },
      data: {
        doctorNotes: review.notes,
        doctorApproved: review.approved,
        doctorId: review.doctorId,
        status: review.approved ? TestStatus.COMPLETED : TestStatus.DOCTOR_REVIEW,
      },
      include: {
        patient: true,
      },
    });

    // Update patient journey - mark doctor step as complete
    if (this.patientJourneyService && updated?.patientId && review.approved) {
      try {
        await this.patientJourneyService.markDoctorComplete(updated.patientId, review.doctorId);
      } catch (error: any) {
        console.log('Journey update skipped:', error.message);
      }
    }

    return updated;
  }
}

