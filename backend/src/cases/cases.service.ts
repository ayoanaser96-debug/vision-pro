import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CasePriority, CaseStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CasesService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
  ) {}

  async create(createDto: any) {
    const saved = await this.prisma.case.create({
      data: createDto,
    });
    
    // Auto-prioritize based on AI insights
    if (createDto.eyeTestId) {
      await this.autoPrioritize(saved.id);
    }
    
    return saved;
  }

  async autoPrioritize(caseId: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: { 
        eyeTest: true,
        assignedDoctors: {
          select: { id: true },
        },
      },
    });
    if (!caseData) return;

    let priority: CasePriority = CasePriority.MEDIUM;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    const test = caseData.eyeTest;
    if (test?.aiAnalysis) {
      const analysis = test.aiAnalysis as any;
      
      // Check for urgent conditions
      if (analysis.diabeticRetinopathy?.detected && analysis.diabeticRetinopathy.severity !== 'none') {
        priority = CasePriority.URGENT;
        riskFactors.push('Diabetic Retinopathy detected');
        recommendations.push('Immediate ophthalmologist consultation required');
      } else if (analysis.glaucoma?.detected && analysis.glaucoma.severity !== 'none') {
        priority = CasePriority.HIGH;
        riskFactors.push('Glaucoma detected');
        recommendations.push('Pressure monitoring and treatment initiation');
      } else if (analysis.cataract?.detected && analysis.cataract.severity === 'severe') {
        priority = CasePriority.HIGH;
        riskFactors.push('Severe cataract');
        recommendations.push('Surgical consultation recommended');
      }

      const aiInsights = {
        urgency: priority === CasePriority.URGENT ? 100 : priority === CasePriority.HIGH ? 75 : 50,
        riskFactors,
        recommendations,
      };

      await this.prisma.case.update({
        where: { id: caseId },
        data: {
          aiInsights: aiInsights as any,
          priority,
        },
      });

      // Send notification to assigned doctors
      if (caseData.assignedDoctors.length > 0) {
        for (const doctor of caseData.assignedDoctors) {
          await this.notificationsService.create({
            userId: doctor.id,
            type: 'ABNORMAL_FINDING' as any,
            priority: priority as any,
            title: `Urgent: Abnormal Findings - ${priority} Priority`,
            message: `Case ${caseId.substring(0, 8)} requires immediate attention`,
            relatedTestId: test.id,
            metadata: { caseId, priority, riskFactors } as any,
          });
        }
      }
    }

    return this.prisma.case.findUnique({
      where: { id: caseId },
    });
  }

  async findByDoctor(doctorId: string) {
    return this.prisma.case.findMany({
      where: {
        assignedDoctors: {
          some: {
            id: doctorId,
          },
        },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        eyeTest: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findById(id: string) {
    return this.prisma.case.findUnique({
      where: { id },
      include: {
        patient: true,
        assignedDoctors: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        eyeTest: true,
        primaryDoctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        delegatedFrom: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  async addTimelineEntry(caseId: string, entry: any) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
    });
    
    if (!caseData) {
      throw new Error('Case not found');
    }

    const timeline = (caseData.timeline as any[]) || [];
    timeline.push({
            ...entry,
            timestamp: new Date(),
    });

    return this.prisma.case.update({
      where: { id: caseId },
      data: {
        timeline: timeline as any,
      },
    });
  }

  async updateStatus(caseId: string, status: CaseStatus, doctorId: string) {
    const caseData = await this.prisma.case.update({
      where: { id: caseId },
      data: { status },
    });

    await this.addTimelineEntry(caseId, {
      type: 'status_change',
      userId: doctorId,
      description: `Case status changed to ${status}`,
    });

    return caseData;
  }

  async delegate(caseId: string, fromDoctorId: string, toDoctorId: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        assignedDoctors: {
          select: { id: true },
        },
      },
    });
    
    if (!caseData) {
      throw new Error('Case not found');
    }

    const existingDoctorIds = caseData.assignedDoctors.map(d => d.id);
    const uniqueDoctors = [...new Set([...existingDoctorIds, toDoctorId])];

    const updated = await this.prisma.case.update({
      where: { id: caseId },
      data: {
        assignedDoctors: {
          set: uniqueDoctors.map(id => ({ id })),
        },
        delegatedFromId: fromDoctorId,
      },
    });

    await this.addTimelineEntry(caseId, {
      type: 'delegation',
      userId: fromDoctorId,
      description: `Case delegated to another doctor`,
      data: { toDoctorId },
    });

    await this.notificationsService.create({
      userId: toDoctorId,
      type: 'CASE_DELEGATED' as any,
      priority: 'MEDIUM' as any,
      title: 'Case Delegated to You',
      message: `A case has been delegated to you for review`,
      relatedTestId: caseData.eyeTestId || undefined,
      metadata: { caseId, fromDoctorId } as any,
    });

    return updated;
  }

  async assignDoctor(caseId: string, doctorId: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
      include: {
        assignedDoctors: {
          select: { id: true },
        },
      },
    });
    
    if (!caseData) {
      throw new Error('Case not found');
    }

    const existingDoctorIds = caseData.assignedDoctors.map(d => d.id);
    const uniqueDoctors = [...new Set([...existingDoctorIds, doctorId])];

    return this.prisma.case.update({
      where: { id: caseId },
      data: {
        assignedDoctors: {
          set: uniqueDoctors.map(id => ({ id })),
        },
        primaryDoctorId: doctorId,
      },
    });
  }
}
