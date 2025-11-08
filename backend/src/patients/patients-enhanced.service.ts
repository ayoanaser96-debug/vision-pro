import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { EyeTest, EyeTestDocument } from '../eye-tests/schemas/eye-test.schema';
import { Prescription, PrescriptionDocument } from '../prescriptions/schemas/prescription.schema';
import { Case, CaseDocument } from '../cases/schemas/case.schema';

@Injectable()
export class PatientsEnhancedService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(EyeTest.name) private eyeTestModel: Model<EyeTestDocument>,
    @InjectModel(Prescription.name) private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(Case.name) private caseModel: Model<CaseDocument>,
  ) {}

  // 1. Unified Medical Journey
  async getUnifiedMedicalJourney(patientId: string) {
    const [appointments, tests, prescriptions, cases] = await Promise.all([
      this.appointmentModel.find({ patientId }).populate('doctorId').sort({ appointmentDate: -1 }).lean(),
      this.eyeTestModel.find({ patientId }).populate('doctorId').populate('analystId').sort({ createdAt: -1 }).lean(),
      this.prescriptionModel.find({ patientId }).populate('doctorId').populate('pharmacyId').sort({ createdAt: -1 }).lean(),
      this.caseModel.find({ patientId }).populate('assignedDoctors').sort({ createdAt: -1 }).lean(),
    ]);

    // Create unified timeline
    const timeline: any[] = [];

    appointments.forEach((apt: any) => {
      timeline.push({
        type: 'appointment',
        id: apt._id,
        date: apt.appointmentDate,
        title: `Appointment with Dr. ${apt.doctorId?.firstName} ${apt.doctorId?.lastName}`,
        description: apt.notes || `Status: ${apt.status}`,
        status: apt.status,
        data: apt,
      });
    });

    tests.forEach((test: any) => {
      timeline.push({
        type: 'test',
        id: test._id,
        date: test.createdAt,
        title: 'Eye Test Result',
        description: `Status: ${test.status} • AI Analysis: ${test.aiAnalysis ? 'Available' : 'Pending'}`,
        status: test.status,
        data: test,
      });
    });

    prescriptions.forEach((pres: any) => {
      timeline.push({
        type: 'prescription',
        id: pres._id,
        date: pres.createdAt,
        title: `Prescription from Dr. ${pres.doctorId?.firstName} ${pres.doctorId?.lastName}`,
        description: `Status: ${pres.status} • ${pres.medications?.length || 0} medications`,
        status: pres.status,
        data: pres,
      });
    });

    cases.forEach((caseItem: any) => {
      timeline.push({
        type: 'case',
        id: caseItem._id,
        date: caseItem.createdAt,
        title: `Case: ${caseItem.diagnosis || 'Eye Care'}`,
        description: `Priority: ${caseItem.priority} • Status: ${caseItem.status}`,
        status: caseItem.status,
        data: caseItem,
      });
    });

    // Sort by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      timeline,
      summary: {
        totalAppointments: appointments.length,
        totalTests: tests.length,
        totalPrescriptions: prescriptions.length,
        totalCases: cases.length,
        upcomingAppointments: appointments.filter((apt: any) => 
          new Date(apt.appointmentDate) > new Date() && apt.status === 'scheduled'
        ).length,
        pendingPrescriptions: prescriptions.filter((pres: any) => pres.status === 'pending').length,
        activeCases: cases.filter((c: any) => c.status !== 'closed').length,
      },
    };
  }

  // 2. Smart Appointment Booking
  async getSuggestedAppointments(patientId: string, urgency?: string, condition?: string) {
    // Get available doctors
    const doctors = await this.userModel.find({ role: 'doctor', status: 'active' }).lean();
    
    // Get existing appointments to find gaps
    const existingAppointments = await this.appointmentModel.find({
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
    }).lean();

    const suggestions = [];

    for (const doctor of doctors) {
      // Simple AI-based suggestion (in production, this would use ML)
      const today = new Date();
      const suggestedDate = new Date(today);
      suggestedDate.setDate(today.getDate() + (urgency === 'urgent' ? 1 : 3));
      
      // Find available time slots
      const availableSlots = ['09:00', '10:00', '11:00', '14:00', '15:00', '16:00'];
      const suggestedSlots = availableSlots.filter(slot => {
        const slotDateTime = new Date(suggestedDate);
        const [hours, minutes] = slot.split(':');
        slotDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        const conflict = existingAppointments.some((apt: any) => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate.toDateString() === slotDateTime.toDateString() &&
                 apt.appointmentTime === slot &&
                 apt.doctorId?.toString() === doctor._id.toString();
        });
        
        return !conflict;
      });

      if (suggestedSlots.length > 0) {
        suggestions.push({
          doctorId: doctor._id,
          doctorName: `${doctor.firstName} ${doctor.lastName}`,
          specialty: doctor.specialty,
          suggestedDate: suggestedDate.toISOString().split('T')[0],
          suggestedTimes: suggestedSlots,
          urgency: urgency || 'normal',
          matchScore: urgency === 'urgent' ? 95 : 85, // AI matching score
        });
      }
    }

    // Sort by match score
    suggestions.sort((a, b) => b.matchScore - a.matchScore);

    return suggestions;
  }

  async getWaitTimePrediction(appointmentId: string) {
    const appointment = await this.appointmentModel.findById(appointmentId).populate('doctorId');
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Calculate queue position
    const queue = await this.appointmentModel.find({
      doctorId: appointment.doctorId,
      appointmentDate: appointment.appointmentDate,
      appointmentTime: { $lte: appointment.appointmentTime },
      status: { $in: ['scheduled', 'confirmed'] },
    }).sort({ appointmentTime: 1 });

    const position = queue.findIndex((apt: any) => apt._id.toString() === appointmentId) + 1;
    const avgWaitTime = 15; // 15 minutes per appointment
    const predictedWait = position * avgWaitTime;

    return {
      position,
      estimatedWaitMinutes: predictedWait,
      estimatedWaitTime: `${Math.floor(predictedWait / 60)}h ${predictedWait % 60}m`,
    };
  }

  // 3. Health Records & Reports
  async getHealthTimeline(patientId: string) {
    const [tests, prescriptions, appointments] = await Promise.all([
      this.eyeTestModel.find({ patientId }).sort({ createdAt: -1 }).lean(),
      this.prescriptionModel.find({ patientId }).populate('doctorId').sort({ createdAt: -1 }).lean(),
      this.appointmentModel.find({ patientId }).populate('doctorId').sort({ appointmentDate: -1 }).lean(),
    ]);

    const timeline: any[] = [];

    // Add test results
    tests.forEach((test: any) => {
      timeline.push({
        type: 'test',
        date: test.createdAt,
        title: 'Eye Test',
        details: {
          visualAcuity: `${test.visualAcuityRight || 'N/A'} / ${test.visualAcuityLeft || 'N/A'}`,
          aiAnalysis: test.aiAnalysis,
          status: test.status,
        },
        doctorNotes: test.doctorNotes,
        analystNotes: test.analystNotes,
        images: test.retinaImages || [],
      });
    });

    // Add prescriptions
    prescriptions.forEach((pres: any) => {
      timeline.push({
        type: 'prescription',
        date: pres.createdAt,
        title: 'Prescription',
        details: {
          medications: pres.medications,
          glasses: pres.glasses,
          notes: pres.notes,
          status: pres.status,
        },
        doctor: pres.doctorId,
        pharmacy: pres.pharmacyId,
      });
    });

    // Add appointments
    appointments.forEach((apt: any) => {
      timeline.push({
        type: 'appointment',
        date: apt.appointmentDate,
        title: 'Appointment',
        details: {
          status: apt.status,
          notes: apt.notes,
          time: apt.appointmentTime,
        },
        doctor: apt.doctorId,
      });
    });

    // Sort by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }

  async getComparativeAnalysis(patientId: string, testId?: string) {
    const tests = await this.eyeTestModel.find({ patientId }).sort({ createdAt: 1 }).lean();
    
    if (tests.length < 2) {
      return { message: 'Need at least 2 tests for comparison' };
    }

    const latestTest = testId ? tests.find((t: any) => t._id.toString() === testId) : tests[tests.length - 1];
    const previousTest = tests[tests.length - 2];

    const comparison: any = {
      visualAcuity: {
        right: {
          previous: previousTest.visualAcuityRight || 'N/A',
          current: latestTest.visualAcuityRight || 'N/A',
          change: this.calculateChange(previousTest.visualAcuityRight, latestTest.visualAcuityRight),
        },
        left: {
          previous: previousTest.visualAcuityLeft || 'N/A',
          current: latestTest.visualAcuityLeft || 'N/A',
          change: this.calculateChange(previousTest.visualAcuityLeft, latestTest.visualAcuityLeft),
        },
      },
      aiAnalysis: {
        previous: previousTest.aiAnalysis,
        current: latestTest.aiAnalysis,
      },
      trends: this.analyzeTrends(tests),
    };

    return comparison;
  }

  private calculateChange(previous: string, current: string): string {
    // Simplified change calculation
    if (!previous || !current) return 'N/A';
    // In production, this would parse Snellen values and calculate improvement
    return current === previous ? 'No change' : 'Changed';
  }

  private analyzeTrends(tests: any[]): any {
    // Analyze trends over time
    const trends = {
      visualAcuityTrend: 'stable', // improved, declined, stable
      riskLevel: 'low', // low, medium, high
      recommendations: [],
    };

    if (tests.length >= 3) {
      // Analyze if vision is improving or declining
      const latest = tests[tests.length - 1];
      const middle = tests[Math.floor(tests.length / 2)];
      
      // Simplified trend analysis
      if (latest.aiAnalysis) {
        const risks = [];
        if (latest.aiAnalysis.cataract?.detected) risks.push('cataract');
        if (latest.aiAnalysis.glaucoma?.detected) risks.push('glaucoma');
        if (latest.aiAnalysis.diabeticRetinopathy?.detected) risks.push('diabetic_retinopathy');
        
        trends.riskLevel = risks.length > 0 ? 'high' : 'low';
        trends.recommendations = [
          'Regular eye checkups recommended',
          'Monitor symptoms closely',
        ];
      }
    }

    return trends;
  }

  // 4. AI Insights & Self-Monitoring
  async getAIInsights(patientId: string) {
    const tests = await this.eyeTestModel.find({ patientId }).sort({ createdAt: -1 }).lean();
    const prescriptions = await this.prescriptionModel.find({ patientId }).sort({ createdAt: -1 }).lean();
    const cases = await this.caseModel.find({ patientId }).lean();

    const insights: any = {
      healthSummary: '',
      riskFactors: [],
      recommendations: [],
      nextSteps: [],
    };

    if (tests.length > 0) {
      const latestTest = tests[0];
      
      // Generate simple health summary
      if (latestTest.aiAnalysis) {
        const analysis = latestTest.aiAnalysis;
        const findings: string[] = [];
        
        if (analysis.cataract?.detected) {
          findings.push(`Cataract detected (${analysis.cataract.severity})`);
          insights.riskFactors.push('Cataract');
        }
        if (analysis.glaucoma?.detected) {
          findings.push(`Glaucoma detected (${analysis.glaucoma.severity})`);
          insights.riskFactors.push('Glaucoma');
        }
        if (analysis.diabeticRetinopathy?.detected) {
          findings.push(`Diabetic Retinopathy detected (${analysis.diabeticRetinopathy.severity})`);
          insights.riskFactors.push('Diabetic Retinopathy');
        }
        
        if (findings.length === 0) {
          insights.healthSummary = 'Your eye examination shows normal results with no significant abnormalities detected.';
        } else {
          insights.healthSummary = `Recent test detected: ${findings.join(', ')}. Please follow your doctor's recommendations.`;
        }

        insights.recommendations = [
          'Schedule regular follow-up appointments',
          'Take medications as prescribed',
          'Protect eyes from UV exposure',
        ];
      } else {
        insights.healthSummary = 'Your eye pressure and vision are within normal ranges. Continue regular checkups.';
      }
    }

    // Risk prediction
    const riskScore = this.calculateRiskScore(tests, cases);
    insights.riskScore = riskScore;
    insights.riskLevel = riskScore > 70 ? 'high' : riskScore > 40 ? 'medium' : 'low';

    // Next steps
    if (prescriptions.length > 0) {
      const pendingPrescriptions = prescriptions.filter((p: any) => p.status === 'pending');
      if (pendingPrescriptions.length > 0) {
        insights.nextSteps.push('Pick up pending prescriptions from pharmacy');
      }
    }

    const upcomingAppointments = await this.appointmentModel.find({
      patientId,
      appointmentDate: { $gte: new Date() },
      status: { $in: ['scheduled', 'confirmed'] },
    }).countDocuments();

    if (upcomingAppointments > 0) {
      insights.nextSteps.push(`You have ${upcomingAppointments} upcoming appointment(s)`);
    }

    return insights;
  }

  private calculateRiskScore(tests: any[], cases: any[]): number {
    let score = 0;

    // Base risk score from test results
    tests.forEach((test: any) => {
      if (test.aiAnalysis) {
        if (test.aiAnalysis.cataract?.detected) score += 20;
        if (test.aiAnalysis.glaucoma?.detected) score += 30;
        if (test.aiAnalysis.diabeticRetinopathy?.detected) score += 40;
      }
    });

    // Risk from active cases
    const urgentCases = cases.filter((c: any) => c.priority === 'urgent');
    score += urgentCases.length * 15;

    return Math.min(score, 100);
  }

  // 5. Prescription Tracking
  async getPrescriptionTracking(patientId: string) {
    const prescriptions = await this.prescriptionModel.find({ patientId })
      .populate('doctorId')
      .populate('pharmacyId')
      .sort({ createdAt: -1 })
      .lean();

    return prescriptions.map((pres: any) => ({
      ...pres,
      tracking: {
        status: pres.status,
        statusHistory: [
          { status: 'created', date: pres.createdAt },
          ...(pres.status !== 'pending' ? [{ status: pres.status, date: pres.updatedAt }] : []),
        ],
        pharmacyStatus: pres.pharmacyId ? 'assigned' : 'pending',
        deliveryInfo: pres.deliveryInfo || null,
      },
    }));
  }

  // 6. Billing History
  async getBillingHistory(patientId: string) {
    const [appointments, prescriptions] = await Promise.all([
      this.appointmentModel.find({ patientId, status: 'completed' }).lean(),
      this.prescriptionModel.find({ patientId, status: { $in: ['filled', 'completed'] } }).lean(),
    ]);

    const invoices = [];

    // Appointment invoices
    appointments.forEach((apt: any) => {
      invoices.push({
        type: 'appointment',
        id: apt._id,
        date: apt.appointmentDate,
        description: `Consultation with Dr. ${apt.doctorId?.firstName || 'Doctor'}`,
        amount: 100, // Default consultation fee
        status: 'paid',
        items: [
          { name: 'Consultation', price: 100 },
        ],
      });
    });

    // Prescription invoices
    prescriptions.forEach((pres: any) => {
      const medicationCost = (pres.medications?.length || 0) * 25; // $25 per medication
      const glassesCost = (pres.glasses?.length || 0) * 150; // $150 per glasses
      const total = medicationCost + glassesCost;

      invoices.push({
        type: 'prescription',
        id: pres._id,
        date: pres.createdAt,
        description: `Prescription from Dr. ${pres.doctorId?.firstName || 'Doctor'}`,
        amount: total,
        status: pres.status === 'completed' ? 'paid' : 'pending',
        items: [
          ...(pres.medications?.map((med: any) => ({ name: med.name, price: 25 })) || []),
          ...(pres.glasses?.map((glass: any) => ({ name: `${glass.type} - ${glass.lensType}`, price: 150 })) || []),
        ],
      });
    });

    // Sort by date
    invoices.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalAmount = invoices.reduce((sum, inv) => sum + inv.amount, 0);
    const paidAmount = invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + inv.amount, 0);

    return {
      invoices,
      summary: {
        totalInvoices: invoices.length,
        totalAmount,
        paidAmount,
        pendingAmount: totalAmount - paidAmount,
      },
    };
  }

  // 7. Health Dashboard Analytics
  async getHealthDashboard(patientId: string) {
    const [tests, prescriptions, appointments] = await Promise.all([
      this.eyeTestModel.find({ patientId }).sort({ createdAt: 1 }).lean(),
      this.prescriptionModel.find({ patientId }).lean(),
      this.appointmentModel.find({ patientId }).lean(),
    ]);

    // Vision trends
    const visionTrends = tests.map((test: any) => ({
      date: test.createdAt,
      visualAcuityRight: test.visualAcuityRight || 'N/A',
      visualAcuityLeft: test.visualAcuityLeft || 'N/A',
    }));

    // Medication adherence (simplified)
    const medicationAdherence = this.calculateMedicationAdherence(prescriptions);

    // Health goals progress
    const goals = {
      regularCheckups: {
        target: 4, // per year
        current: appointments.filter((apt: any) => 
          new Date(apt.appointmentDate).getFullYear() === new Date().getFullYear()
        ).length,
      },
      medicationAdherence: {
        percentage: medicationAdherence,
      },
    };

    return {
      visionTrends,
      medicationAdherence,
      goals,
      recentActivity: {
        lastAppointment: appointments.length > 0 ? appointments[appointments.length - 1] : null,
        lastTest: tests.length > 0 ? tests[tests.length - 1] : null,
        lastPrescription: prescriptions.length > 0 ? prescriptions[prescriptions.length - 1] : null,
      },
    };
  }

  private calculateMedicationAdherence(prescriptions: any[]): number {
    // Simplified calculation - in production, this would track actual medication intake
    if (prescriptions.length === 0) return 0;
    const completed = prescriptions.filter((p: any) => p.status === 'completed' || p.status === 'filled').length;
    return Math.round((completed / prescriptions.length) * 100);
  }

  // 8. Final Results Summary (Doctor diagnosis, Analyst result, Pharmacy prescription)
  async getFinalResultsSummary(patientId: string) {
    const [latestTest, latestPrescription, latestCase] = await Promise.all([
      this.eyeTestModel
        .findOne({ patientId })
        .populate('doctorId')
        .populate('analystId')
        .sort({ createdAt: -1 })
        .lean(),
      this.prescriptionModel
        .findOne({ patientId })
        .populate('doctorId')
        .populate('pharmacyId')
        .sort({ createdAt: -1 })
        .lean(),
      this.caseModel
        .findOne({ patientId })
        .populate('assignedDoctors')
        .sort({ createdAt: -1 })
        .lean(),
    ]);

    const analystSummary = latestTest
      ? {
          testId: latestTest._id,
          date: latestTest.createdAt,
          analyst: latestTest.analystId && typeof latestTest.analystId === 'object' && 'firstName' in latestTest.analystId
            ? `${(latestTest.analystId as any).firstName} ${(latestTest.analystId as any).lastName}`
            : null,
          doctor: latestTest.doctorId && typeof latestTest.doctorId === 'object' && 'firstName' in latestTest.doctorId
            ? `${(latestTest.doctorId as any).firstName} ${(latestTest.doctorId as any).lastName}`
            : null,
          status: latestTest.status,
          aiAnalysis: latestTest.aiAnalysis || null,
          notes: latestTest.analystNotes || latestTest.doctorNotes || null,
        }
      : null;

    const diagnosisSummary = latestCase
      ? {
          caseId: latestCase._id,
          date: latestCase.createdAt,
          diagnosis: latestCase.diagnosis || null,
          status: latestCase.status,
          priority: latestCase.priority,
          doctors:
            Array.isArray(latestCase.assignedDoctors)
              ? latestCase.assignedDoctors.map((d: any) => `${d.firstName} ${d.lastName}`)
              : [],
          notes: latestCase.notes || null,
        }
      : null;

    const prescriptionSummary = latestPrescription
      ? {
          prescriptionId: latestPrescription._id,
          date: latestPrescription.createdAt,
          status: latestPrescription.status,
          doctor: latestPrescription.doctorId && typeof latestPrescription.doctorId === 'object' && 'firstName' in latestPrescription.doctorId
            ? `${(latestPrescription.doctorId as any).firstName} ${(latestPrescription.doctorId as any).lastName}`
            : null,
          pharmacy: latestPrescription.pharmacyId && typeof latestPrescription.pharmacyId === 'object' && ('name' in latestPrescription.pharmacyId || 'firstName' in latestPrescription.pharmacyId)
            ? `${(latestPrescription.pharmacyId as any).name || (latestPrescription.pharmacyId as any).firstName || ''}`.trim() || null
            : null,
          medications: latestPrescription.medications || [],
          glasses: latestPrescription.glasses || [],
          notes: latestPrescription.notes || null,
        }
      : null;

    return {
      analystSummary,
      diagnosisSummary,
      prescriptionSummary,
      updatedAt: new Date(),
    };
  }
}

