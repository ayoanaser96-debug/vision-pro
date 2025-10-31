import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Case, CaseDocument, CasePriority, CaseStatus } from './schemas/case.schema';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class CasesService {
  constructor(
    @InjectModel(Case.name) private caseModel: Model<CaseDocument>,
    private notificationsService: NotificationsService,
  ) {}

  async create(createDto: any) {
    const caseData = new this.caseModel(createDto);
    const saved = await caseData.save();
    
    // Auto-prioritize based on AI insights
    if (createDto.eyeTestId) {
      await this.autoPrioritize(saved._id.toString());
    }
    
    return saved;
  }

  async autoPrioritize(caseId: string) {
    const caseData = await this.caseModel.findById(caseId).populate('eyeTestId');
    if (!caseData) return;

    let priority = CasePriority.MEDIUM;
    const riskFactors: string[] = [];
    const recommendations: string[] = [];

    const test: any = caseData.eyeTestId;
    if (test?.aiAnalysis) {
      const analysis = test.aiAnalysis;
      
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

      caseData.aiInsights = {
        urgency: priority === CasePriority.URGENT ? 100 : priority === CasePriority.HIGH ? 75 : 50,
        riskFactors,
        recommendations,
      };
      caseData.priority = priority;
      await caseData.save();

      // Send notification to assigned doctors
      if (caseData.assignedDoctors.length > 0) {
        for (const doctorId of caseData.assignedDoctors) {
          await this.notificationsService.create({
            userId: doctorId.toString(),
            type: 'abnormal_finding' as any,
            priority: priority as any,
            title: `Urgent: Abnormal Findings - ${priority} Priority`,
            message: `Case ${caseId.substring(0, 8)} requires immediate attention`,
            relatedTestId: test._id?.toString(),
            metadata: { caseId, priority, riskFactors },
          });
        }
      }
    }

    return caseData;
  }

  async findByDoctor(doctorId: string) {
    return this.caseModel
      .find({ assignedDoctors: doctorId })
      .populate('patientId', 'firstName lastName email phone')
      .populate('eyeTestId')
      .sort({ priority: -1, createdAt: -1 });
  }

  async findById(id: string) {
    return this.caseModel
      .findById(id)
      .populate('patientId')
      .populate('assignedDoctors', 'firstName lastName specialty')
      .populate('eyeTestId')
      .populate('primaryDoctorId', 'firstName lastName')
      .populate('delegatedFromId', 'firstName lastName');
  }

  async addTimelineEntry(caseId: string, entry: any) {
    return this.caseModel.findByIdAndUpdate(
      caseId,
      {
        $push: {
          timeline: {
            ...entry,
            timestamp: new Date(),
          },
        },
      },
      { new: true },
    );
  }

  async updateStatus(caseId: string, status: CaseStatus, doctorId: string) {
    const caseData = await this.caseModel.findByIdAndUpdate(
      caseId,
      { status },
      { new: true },
    );

    await this.addTimelineEntry(caseId, {
      type: 'status_change',
      userId: doctorId,
      description: `Case status changed to ${status}`,
    });

    return caseData;
  }

  async delegate(caseId: string, fromDoctorId: string, toDoctorId: string) {
    const caseData = await this.caseModel.findByIdAndUpdate(
      caseId,
      {
        $addToSet: { assignedDoctors: toDoctorId },
        delegatedFromId: fromDoctorId,
      },
      { new: true },
    );

    await this.addTimelineEntry(caseId, {
      type: 'delegation',
      userId: fromDoctorId,
      description: `Case delegated to another doctor`,
      data: { toDoctorId },
    });

    await this.notificationsService.create({
      userId: toDoctorId,
      type: 'case_delegated' as any,
      priority: 'medium' as any,
      title: 'Case Delegated to You',
      message: `A case has been delegated to you for review`,
      relatedTestId: caseData.eyeTestId?.toString(),
      metadata: { caseId, fromDoctorId },
    });

    return caseData;
  }

  async assignDoctor(caseId: string, doctorId: string) {
    return this.caseModel.findByIdAndUpdate(
      caseId,
      {
        $addToSet: { assignedDoctors: doctorId },
        primaryDoctorId: doctorId,
      },
      { new: true },
    );
  }
}


