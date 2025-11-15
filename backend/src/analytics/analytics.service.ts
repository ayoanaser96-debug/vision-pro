import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class AnalyticsService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async getDoctorPerformance(doctorId: string, startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    const [casesReviewed, prescriptions, avgResponseTime] = await Promise.all([
      this.prisma.case.count({
        where: {
          assignedDoctors: { has: doctorId },
          ...dateFilter,
        },
      }),
      this.prisma.prescription.count({
        where: { doctorId, ...dateFilter },
      }),
      this.calculateAvgResponseTime(doctorId, dateFilter),
    ]);

    const cases = await this.prisma.case.findMany({
      where: {
        assignedDoctors: { has: doctorId },
        ...dateFilter,
      },
      include: { eyeTest: true },
    });

    let aiAgreement = 0;
    let totalCasesWithAI = 0;

    for (const caseData of cases) {
      const test = caseData.eyeTest;
      if (test?.aiAnalysis && caseData.diagnosis) {
        totalCasesWithAI++;
        const aiDetected = [
          (test.aiAnalysis as any).cataract?.detected,
          (test.aiAnalysis as any).glaucoma?.detected,
          (test.aiAnalysis as any).diabeticRetinopathy?.detected,
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
    const cases = await this.prisma.case.findMany({
      where: {
        assignedDoctors: { has: doctorId },
        ...dateFilter,
      },
    });
    
    let totalTime = 0;
    let count = 0;

    for (const caseData of cases) {
      const timeline = (caseData.timeline as any[]) || [];
      if (timeline.length > 1) {
        const assignedTime = caseData.createdAt;
        const firstActionTime = timeline[1]?.timestamp;
        if (firstActionTime && assignedTime) {
          const timeDiff = new Date(firstActionTime).getTime() - assignedTime.getTime();
          if (timeDiff > 0) {
            totalTime += timeDiff;
            count++;
          }
        }
      }
    }

    return count > 0 ? totalTime / count / (1000 * 60) : 0;
  }

  async getClinicInsights(startDate?: Date, endDate?: Date) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.createdAt = {};
      if (startDate) dateFilter.createdAt.gte = startDate;
      if (endDate) dateFilter.createdAt.lte = endDate;
    }

    const [totalPatients, totalTests, totalPrescriptions, tests] = await Promise.all([
      this.prisma.user.count({ where: { role: UserRole.PATIENT, ...dateFilter } }),
      this.prisma.eyeTest.count({ where: dateFilter }),
      this.prisma.prescription.count({ where: dateFilter }),
      this.prisma.eyeTest.findMany({
        where: dateFilter,
        include: { patient: true },
      }),
    ]);

    const diseaseCounts = {
      cataract: 0,
      glaucoma: 0,
      diabeticRetinopathy: 0,
      normal: 0,
    };

    for (const test of tests) {
      const analysis = test.aiAnalysis as any;
      if (analysis) {
        if (analysis.cataract?.detected) diseaseCounts.cataract++;
        if (analysis.glaucoma?.detected) diseaseCounts.glaucoma++;
        if (analysis.diabeticRetinopathy?.detected) diseaseCounts.diabeticRetinopathy++;
        if (!analysis.cataract?.detected && !analysis.glaucoma?.detected && !analysis.diabeticRetinopathy?.detected) {
          diseaseCounts.normal++;
        }
      }
    }

    const patients = await this.prisma.user.findMany({
      where: { role: UserRole.PATIENT, ...dateFilter },
    });
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

    const where: any = { createdAt: { gte: startDate } };
    if (patientId) where.patientId = patientId;

    const tests = await this.prisma.eyeTest.findMany({
      where,
      orderBy: { createdAt: 'asc' },
    });

    const trends: Record<string, number> = {};
    for (const test of tests) {
      const date = test.createdAt.toISOString().split('T')[0];
      trends[date] = (trends[date] || 0) + 1;
    }

    return Object.entries(trends).map(([date, count]) => ({ date, count }));
  }
}
