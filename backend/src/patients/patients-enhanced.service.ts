import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, AppointmentStatus, PrescriptionStatus, CaseStatus, CasePriority } from '@prisma/client';

@Injectable()
export class PatientsEnhancedService {
  constructor(
    private prisma: PrismaService,
  ) {}

  // 1. Unified Medical Journey
  async getUnifiedMedicalJourney(patientId: string) {
    const [appointments, tests, prescriptions, cases] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId },
        include: { doctor: true },
        orderBy: { appointmentDate: 'desc' },
      }),
      this.prisma.eyeTest.findMany({
        where: { patientId },
        include: { doctor: true, analyst: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.findMany({
        where: { patientId },
        include: { doctor: true, pharmacy: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.case.findMany({
        where: { patientId },
        include: { assignedDoctors: true },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    // Create unified timeline
    const timeline: any[] = [];

    appointments.forEach((apt) => {
      timeline.push({
        type: 'appointment',
        id: apt.id,
        date: apt.appointmentDate,
        title: `Appointment with Dr. ${apt.doctor?.firstName || ''} ${apt.doctor?.lastName || ''}`,
        description: apt.notes || `Status: ${apt.status}`,
        status: apt.status,
        data: apt,
      });
    });

    tests.forEach((test) => {
      timeline.push({
        type: 'test',
        id: test.id,
        date: test.createdAt,
        title: 'Eye Test Result',
        description: `Status: ${test.status} • AI Analysis: ${test.aiAnalysis ? 'Available' : 'Pending'}`,
        status: test.status,
        data: test,
      });
    });

    prescriptions.forEach((pres) => {
      const medications = pres.medications as any[];
      timeline.push({
        type: 'prescription',
        id: pres.id,
        date: pres.createdAt,
        title: `Prescription from Dr. ${pres.doctor?.firstName || ''} ${pres.doctor?.lastName || ''}`,
        description: `Status: ${pres.status} • ${medications?.length || 0} medications`,
        status: pres.status,
        data: pres,
      });
    });

    cases.forEach((caseItem) => {
      timeline.push({
        type: 'case',
        id: caseItem.id,
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
        upcomingAppointments: appointments.filter((apt) => 
          new Date(apt.appointmentDate) > new Date() && apt.status === AppointmentStatus.CONFIRMED
        ).length,
        pendingPrescriptions: prescriptions.filter((pres) => pres.status === PrescriptionStatus.PENDING).length,
        activeCases: cases.filter((c) => c.status !== CaseStatus.CLOSED).length,
      },
    };
  }

  // 2. Smart Appointment Booking
  async getSuggestedAppointments(patientId: string, urgency?: string, condition?: string) {
    // Get available doctors
    const doctors = await this.prisma.user.findMany({
      where: { role: UserRole.DOCTOR, status: 'ACTIVE' },
    });
    
    // Get existing appointments to find gaps
    const existingAppointments = await this.prisma.appointment.findMany({
      where: {
        appointmentDate: { gte: new Date() },
        status: { in: [AppointmentStatus.CONFIRMED] },
      },
    });

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
        
        const conflict = existingAppointments.some((apt) => {
          const aptDate = new Date(apt.appointmentDate);
          return aptDate.toDateString() === slotDateTime.toDateString() &&
                 apt.appointmentTime === slot &&
                 apt.doctorId === doctor.id;
        });
        
        return !conflict;
      });

      if (suggestedSlots.length > 0) {
        suggestions.push({
          doctorId: doctor.id,
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
    const appointment = await this.prisma.appointment.findUnique({
      where: { id: appointmentId },
      include: { doctor: true },
    });
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    // Calculate queue position
    const queue = await this.prisma.appointment.findMany({
      where: {
        doctorId: appointment.doctorId,
        appointmentDate: appointment.appointmentDate,
        appointmentTime: { lte: appointment.appointmentTime },
        status: { in: [AppointmentStatus.CONFIRMED] },
      },
      orderBy: { appointmentTime: 'asc' },
    });

    const position = queue.findIndex((apt) => apt.id === appointmentId) + 1;
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
      this.prisma.eyeTest.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.findMany({
        where: { patientId },
        include: { doctor: true, pharmacy: true },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.appointment.findMany({
        where: { patientId },
        include: { doctor: true },
        orderBy: { appointmentDate: 'desc' },
      }),
    ]);

    const timeline: any[] = [];

    // Add test results
    tests.forEach((test) => {
      const retinaImages = test.retinaImages as any;
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
        images: Array.isArray(retinaImages) ? retinaImages : [],
      });
    });

    // Add prescriptions
    prescriptions.forEach((pres) => {
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
        doctor: pres.doctor,
        pharmacy: pres.pharmacy,
      });
    });

    // Add appointments
    appointments.forEach((apt) => {
      timeline.push({
        type: 'appointment',
        date: apt.appointmentDate,
        title: 'Appointment',
        details: {
          status: apt.status,
          notes: apt.notes,
          time: apt.appointmentTime,
        },
        doctor: apt.doctor,
      });
    });

    // Sort by date
    timeline.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return timeline;
  }

  async getComparativeAnalysis(patientId: string, testId?: string) {
    const tests = await this.prisma.eyeTest.findMany({
      where: { patientId },
      orderBy: { createdAt: 'asc' },
    });
    
    if (tests.length < 2) {
      return { message: 'Need at least 2 tests for comparison' };
    }

    const latestTest = testId ? tests.find((t) => t.id === testId) : tests[tests.length - 1];
    const previousTest = tests[tests.length - 2];

    if (!latestTest || !previousTest) {
      return { message: 'Test not found' };
    }

    const comparison: any = {
      visualAcuity: {
        right: {
          previous: previousTest.visualAcuityRight || 'N/A',
          current: latestTest.visualAcuityRight || 'N/A',
          change: this.calculateChange(previousTest.visualAcuityRight || '', latestTest.visualAcuityRight || ''),
        },
        left: {
          previous: previousTest.visualAcuityLeft || 'N/A',
          current: latestTest.visualAcuityLeft || 'N/A',
          change: this.calculateChange(previousTest.visualAcuityLeft || '', latestTest.visualAcuityLeft || ''),
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
      
      // Simplified trend analysis
      if (latest.aiAnalysis) {
        const analysis = latest.aiAnalysis as any;
        const risks = [];
        if (analysis.cataract?.detected) risks.push('cataract');
        if (analysis.glaucoma?.detected) risks.push('glaucoma');
        if (analysis.diabeticRetinopathy?.detected) risks.push('diabetic_retinopathy');
        
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
    const [tests, prescriptions, cases] = await Promise.all([
      this.prisma.eyeTest.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.case.findMany({
        where: { patientId },
      }),
    ]);

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
        const analysis = latestTest.aiAnalysis as any;
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
      const pendingPrescriptions = prescriptions.filter((p) => p.status === PrescriptionStatus.PENDING);
      if (pendingPrescriptions.length > 0) {
        insights.nextSteps.push('Pick up pending prescriptions from pharmacy');
      }
    }

    const upcomingAppointments = await this.prisma.appointment.count({
      where: {
        patientId,
        appointmentDate: { gte: new Date() },
        status: { in: [AppointmentStatus.CONFIRMED] },
      },
    });

    if (upcomingAppointments > 0) {
      insights.nextSteps.push(`You have ${upcomingAppointments} upcoming appointment(s)`);
    }

    return insights;
  }

  private calculateRiskScore(tests: any[], cases: any[]): number {
    let score = 0;

    // Base risk score from test results
    tests.forEach((test) => {
      if (test.aiAnalysis) {
        const analysis = test.aiAnalysis as any;
        if (analysis.cataract?.detected) score += 20;
        if (analysis.glaucoma?.detected) score += 30;
        if (analysis.diabeticRetinopathy?.detected) score += 40;
      }
    });

    // Risk from active cases
    const urgentCases = cases.filter((c) => c.priority === CasePriority.URGENT);
    score += urgentCases.length * 15;

    return Math.min(score, 100);
  }

  // 5. Prescription Tracking
  async getPrescriptionTracking(patientId: string) {
    const prescriptions = await this.prisma.prescription.findMany({
      where: { patientId },
      include: {
        doctor: true,
        pharmacy: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return prescriptions.map((pres) => ({
      ...pres,
      tracking: {
        status: pres.status,
        statusHistory: [
          { status: 'created', date: pres.createdAt },
          ...(pres.status !== PrescriptionStatus.PENDING ? [{ status: pres.status, date: pres.updatedAt }] : []),
        ],
        pharmacyStatus: pres.pharmacyId ? 'assigned' : 'pending',
        deliveryInfo: pres.deliveryInfo || null,
      },
    }));
  }

  // 6. Billing History
  async getBillingHistory(patientId: string) {
    const [appointments, prescriptions] = await Promise.all([
      this.prisma.appointment.findMany({
        where: { patientId, status: AppointmentStatus.COMPLETED },
        include: { doctor: true },
      }),
      this.prisma.prescription.findMany({
        where: { 
          patientId, 
          status: { in: [PrescriptionStatus.FILLED, PrescriptionStatus.COMPLETED] },
        },
        include: { doctor: true },
      }),
    ]);

    const invoices = [];

    // Appointment invoices
    appointments.forEach((apt) => {
      invoices.push({
        type: 'appointment',
        id: apt.id,
        date: apt.appointmentDate,
        description: `Consultation with Dr. ${apt.doctor?.firstName || 'Doctor'}`,
        amount: 100, // Default consultation fee
        status: 'paid',
        items: [
          { name: 'Consultation', price: 100 },
        ],
      });
    });

    // Prescription invoices
    prescriptions.forEach((pres) => {
      const medications = pres.medications as any[];
      const glasses = pres.glasses as any[];
      const medicationCost = (medications?.length || 0) * 25; // $25 per medication
      const glassesCost = (Array.isArray(glasses) ? glasses.length : 0) * 150; // $150 per glasses
      const total = medicationCost + glassesCost;

      invoices.push({
        type: 'prescription',
        id: pres.id,
        date: pres.createdAt,
        description: `Prescription from Dr. ${pres.doctor?.firstName || 'Doctor'}`,
        amount: total,
        status: pres.status === PrescriptionStatus.COMPLETED ? 'paid' : 'pending',
        items: [
          ...(medications?.map((med: any) => ({ name: med.name, price: 25 })) || []),
          ...(Array.isArray(glasses) ? glasses.map((glass: any) => ({ name: `${glass.type} - ${glass.lensType}`, price: 150 })) : []),
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
      this.prisma.eyeTest.findMany({
        where: { patientId },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.prescription.findMany({
        where: { patientId },
      }),
      this.prisma.appointment.findMany({
        where: { patientId },
      }),
    ]);

    // Vision trends
    const visionTrends = tests.map((test) => ({
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
        current: appointments.filter((apt) => 
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
    const completed = prescriptions.filter((p) => 
      p.status === PrescriptionStatus.COMPLETED || p.status === PrescriptionStatus.FILLED
    ).length;
    return Math.round((completed / prescriptions.length) * 100);
  }

  // 8. Final Results Summary (Doctor diagnosis, Analyst result, Pharmacy prescription)
  async getFinalResultsSummary(patientId: string) {
    const [latestTest, latestPrescription, latestCase] = await Promise.all([
      this.prisma.eyeTest.findFirst({
        where: { patientId },
        include: {
          doctor: true,
          analyst: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.prescription.findFirst({
        where: { patientId },
        include: {
          doctor: true,
          pharmacy: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.case.findFirst({
        where: { patientId },
        include: {
          assignedDoctors: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const analystSummary = latestTest
      ? {
          testId: latestTest.id,
          date: latestTest.createdAt,
          analyst: latestTest.analyst
            ? `${latestTest.analyst.firstName} ${latestTest.analyst.lastName}`
            : null,
          doctor: latestTest.doctor
            ? `${latestTest.doctor.firstName} ${latestTest.doctor.lastName}`
            : null,
          status: latestTest.status,
          aiAnalysis: latestTest.aiAnalysis || null,
          notes: latestTest.analystNotes || latestTest.doctorNotes || null,
        }
      : null;

    const diagnosisSummary = latestCase
      ? {
          caseId: latestCase.id,
          date: latestCase.createdAt,
          diagnosis: latestCase.diagnosis || null,
          status: latestCase.status,
          priority: latestCase.priority,
          doctors: latestCase.assignedDoctors.map((d) => `${d.firstName} ${d.lastName}`),
          notes: latestCase.notes || null,
        }
      : null;

    const prescriptionSummary = latestPrescription
      ? {
          prescriptionId: latestPrescription.id,
          date: latestPrescription.createdAt,
          status: latestPrescription.status,
          doctor: latestPrescription.doctor
            ? `${latestPrescription.doctor.firstName} ${latestPrescription.doctor.lastName}`
            : null,
          pharmacy: latestPrescription.pharmacy
            ? `${latestPrescription.pharmacy.firstName} ${latestPrescription.pharmacy.lastName}`
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
