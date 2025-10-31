import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { EyeTest, EyeTestDocument } from '../eye-tests/schemas/eye-test.schema';
import { Prescription, PrescriptionDocument } from '../prescriptions/schemas/prescription.schema';
import { Case, CaseDocument } from '../cases/schemas/case.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(EyeTest.name) private eyeTestModel: Model<EyeTestDocument>,
    @InjectModel(Prescription.name) private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(Case.name) private caseModel: Model<CaseDocument>,
  ) {}

  async getDoctorPerformance(doctorId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const [casesReviewed, prescriptions, avgResponseTime] = await Promise.all([
      this.caseModel.countDocuments({ assignedDoctors: doctorId, ...dateFilter }),
      this.prescriptionModel.countDocuments({ doctorId, ...dateFilter }),
      this.calculateAvgResponseTime(doctorId, dateFilter),
    ]);

    const cases = await this.caseModel
      .find({ assignedDoctors: doctorId, ...dateFilter })
      .populate('eyeTestId');

    let aiAgreement = 0;
    let totalCasesWithAI = 0;

    for (const caseData of cases) {
      const test: any = caseData.eyeTestId;
      if (test?.aiAnalysis && caseData.diagnosis) {
        totalCasesWithAI++;
        // Simple agreement check (in production, use more sophisticated comparison)
        const aiDetected = [
          test.aiAnalysis.cataract?.detected,
          test.aiAnalysis.glaucoma?.detected,
          test.aiAnalysis.diabeticRetinopathy?.detected,
        ].some(Boolean);

        if (aiDetected && caseData.diagnosis) {
          aiAgreement++;
        }
      }
    }

    return {
      casesReviewed,
      prescriptions,
      avgResponseTime,
      aiAgreementRate: totalCasesWithAI > 0 ? (aiAgreement / totalCasesWithAI) * 100 : 0,
    };
  }

  private async calculateAvgResponseTime(doctorId: string, dateFilter: any): Promise<number> {
    // Calculate average time from case assignment to first action
    const cases = await this.caseModel.find({ assignedDoctors: doctorId, ...dateFilter });
    
    let totalTime = 0;
    let count = 0;

    for (const caseData of cases) {
      if (caseData.timeline && caseData.timeline.length > 1) {
        const assignedTime = (caseData as any).createdAt;
        const firstActionTime = caseData.timeline[1]?.timestamp;
        if (firstActionTime && assignedTime) {
          const timeDiff = firstActionTime.getTime() - new Date(assignedTime).getTime();
          if (timeDiff > 0) {
            totalTime += timeDiff;
            count++;
          }
        }
      }
    }

    return count > 0 ? totalTime / count / (1000 * 60) : 0; // Return in minutes
  }

  async getClinicInsights(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.$gte = startDate;
      if (endDate) dateFilter.createdAt.$lte = endDate;
    }

    const [totalPatients, totalTests, totalPrescriptions, tests] = await Promise.all([
      this.userModel.countDocuments({ role: 'patient', ...dateFilter }),
      this.eyeTestModel.countDocuments(dateFilter),
      this.prescriptionModel.countDocuments(dateFilter),
      this.eyeTestModel.find(dateFilter).populate('patientId'),
    ]);

    // Disease distribution
    const diseaseCounts = {
      cataract: 0,
      glaucoma: 0,
      diabeticRetinopathy: 0,
      normal: 0,
    };

    for (const test of tests) {
      const analysis = (test as any).aiAnalysis;
      if (analysis) {
        if (analysis.cataract?.detected) diseaseCounts.cataract++;
        if (analysis.glaucoma?.detected) diseaseCounts.glaucoma++;
        if (analysis.diabeticRetinopathy?.detected) diseaseCounts.diabeticRetinopathy++;
        if (!analysis.cataract?.detected && !analysis.glaucoma?.detected && !analysis.diabeticRetinopathy?.detected) {
          diseaseCounts.normal++;
        }
      }
    }

    // Patient demographics (age groups)
    const patients = await this.userModel.find({ role: 'patient', ...dateFilter });
    const ageGroups = {
      '0-18': 0,
      '19-35': 0,
      '36-50': 0,
      '51-65': 0,
      '65+': 0,
    };

    const now = new Date();
    for (const patient of patients) {
      if (patient.dateOfBirth) {
        const age = now.getFullYear() - patient.dateOfBirth.getFullYear();
        if (age <= 18) ageGroups['0-18']++;
        else if (age <= 35) ageGroups['19-35']++;
        else if (age <= 50) ageGroups['36-50']++;
        else if (age <= 65) ageGroups['51-65']++;
        else ageGroups['65+']++;
      }
    }

    return {
      overview: {
        totalPatients,
        totalTests,
        totalPrescriptions,
      },
      diseaseDistribution: diseaseCounts,
      patientDemographics: ageGroups,
    };
  }

  async getTestTrends(patientId?: string, days = 30) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const query: any = { createdAt: { $gte: startDate } };
    if (patientId) query.patientId = patientId;

    const tests = await this.eyeTestModel.find(query).sort({ createdAt: 1 });

    // Group by date
    const trends: Record<string, number> = {};
    for (const test of tests) {
      const createdAt = (test as any).createdAt;
      if (createdAt) {
        const date = new Date(createdAt).toISOString().split('T')[0];
        trends[date] = (trends[date] || 0) + 1;
      }
    }

    return Object.entries(trends).map(([date, count]) => ({ date, count }));
  }
}

