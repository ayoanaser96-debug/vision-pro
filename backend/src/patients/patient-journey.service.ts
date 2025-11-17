import { Injectable, NotFoundException, Inject, forwardRef, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType, NotificationPriority, JourneyStep, JourneyStatus } from '@prisma/client';

@Injectable()
export class PatientJourneyService {
  constructor(
    private prisma: PrismaService,
    @Optional() @Inject(forwardRef(() => NotificationsService))
    private notificationsService?: NotificationsService,
  ) {}

  async checkIn(patientId: string, patientData: any) {
    // Check if journey already exists for today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let journey = await this.prisma.patientJourney.findFirst({
      where: {
        patientId,
        checkInTime: { gte: today },
      },
    });

    if (!journey) {
      // Create new journey with all steps
      const steps = [
        { step: JourneyStep.REGISTRATION, status: JourneyStatus.COMPLETED, completedAt: new Date() },
        { step: JourneyStep.PAYMENT, status: JourneyStatus.PENDING },
        { step: JourneyStep.OPTOMETRIST, status: JourneyStatus.PENDING },
        { step: JourneyStep.DOCTOR, status: JourneyStatus.PENDING },
        { step: JourneyStep.PHARMACY, status: JourneyStatus.PENDING },
      ];

      // Default costs
      const costs = {
        registration: 0,
        payment: 100,
        optometrist: 50,
        doctor: 150,
        pharmacy: 75,
        total: 375,
      };

      journey = await this.prisma.patientJourney.create({
        data: {
          patientId,
          patientName: `${patientData.firstName} ${patientData.lastName}`,
          patientEmail: patientData.email,
          patientPhone: patientData.phone,
          checkInTime: new Date(),
          steps: steps as any,
          overallStatus: JourneyStatus.IN_PROGRESS,
          currentStep: JourneyStep.PAYMENT,
          costs: costs as any,
        },
      });

      // Send notification
      await this.sendStepNotification(patientId, JourneyStep.REGISTRATION, 'Registration completed! Please proceed to payment.');
    }

    return journey;
  }

  private async sendStepNotification(patientId: string, step: JourneyStep, message: string) {
    if (this.notificationsService) {
      try {
        await this.notificationsService.create({
          userId: patientId,
          title: `Step Completed: ${step.charAt(0).toUpperCase() + step.slice(1)}`,
          message,
          type: NotificationType.JOURNEY,
          priority: NotificationPriority.MEDIUM,
        });
      } catch (error: any) {
        console.log('Notification creation skipped:', error.message);
      }
    }
  }

  async getJourney(patientId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const journey = await this.prisma.patientJourney.findFirst({
      where: {
        patientId,
        checkInTime: { gte: today },
      },
      orderBy: { checkInTime: 'desc' },
    });

    if (!journey) {
      throw new NotFoundException('No active journey found for today');
    }

    return journey;
  }

  async updateStep(
    patientId: string,
    step: JourneyStep,
    status: JourneyStatus,
    staffId?: string,
    notes?: string,
  ) {
    const journey = await this.getJourney(patientId);
    const steps = journey.steps as any[];

    const stepIndex = steps.findIndex((s) => s.step === step);
    if (stepIndex === -1) {
      throw new NotFoundException(`Step ${step} not found in journey`);
    }

    const wasPending = steps[stepIndex].status === JourneyStatus.PENDING;
    steps[stepIndex].status = status;
    if (status === JourneyStatus.COMPLETED) {
      steps[stepIndex].completedAt = new Date();
      if (wasPending) {
        // Send notification when step is completed
        const stepNames: Record<JourneyStep, string> = {
          [JourneyStep.REGISTRATION]: 'Registration',
          [JourneyStep.PAYMENT]: 'Payment',
          [JourneyStep.OPTOMETRIST]: 'Eye Test & Analysis',
          [JourneyStep.DOCTOR]: 'Doctor Consultation',
          [JourneyStep.PHARMACY]: 'Pharmacy',
          [JourneyStep.COMPLETED]: 'Completed',
        };
        
        const nextStepMessages: Record<JourneyStep, string> = {
          [JourneyStep.REGISTRATION]: 'Please proceed to the Finance counter for payment.',
          [JourneyStep.PAYMENT]: 'Payment completed! Please proceed to the Optometrist station for eye testing.',
          [JourneyStep.OPTOMETRIST]: 'Eye test completed! Please proceed to see the Doctor.',
          [JourneyStep.DOCTOR]: 'Consultation completed! Please proceed to the Pharmacy.',
          [JourneyStep.PHARMACY]: 'All steps completed! Please collect your receipt.',
          [JourneyStep.COMPLETED]: '',
        };

        await this.sendStepNotification(
          patientId,
          step,
          `${stepNames[step]} completed successfully! ${nextStepMessages[step]}`
        );
      }
    }
    if (staffId) {
      steps[stepIndex].staffId = staffId;
    }
    if (notes) {
      steps[stepIndex].notes = notes;
    }

    // Update current step
    const nextPendingStep = steps.find(
      (s) => s.status === JourneyStatus.PENDING,
    );
    let currentStep = nextPendingStep ? nextPendingStep.step : JourneyStep.COMPLETED;
    let overallStatus = nextPendingStep ? JourneyStatus.IN_PROGRESS : JourneyStatus.COMPLETED;
    let checkOutTime = journey.checkOutTime;
    let receiptGenerated = journey.receiptGenerated;

    if (!nextPendingStep && !receiptGenerated) {
      checkOutTime = new Date();
      receiptGenerated = true;
      await this.sendStepNotification(
        patientId,
        JourneyStep.COMPLETED,
        `Your visit is complete! Total cost: $${(journey.costs as any)?.total || 0}. Receipt has been generated.`
      );
    }

    return this.prisma.patientJourney.update({
      where: { id: journey.id },
      data: {
        steps: steps as any,
        currentStep,
        overallStatus,
        checkOutTime,
        receiptGenerated,
      },
    });
  }

  async generateReceipt(patientId: string) {
    const journey = await this.getJourney(patientId);
    
    if (journey.overallStatus !== JourneyStatus.COMPLETED) {
      throw new NotFoundException('Journey is not yet completed');
    }

    return {
      patientName: journey.patientName,
      patientId: journey.patientId,
      checkInTime: journey.checkInTime,
      checkOutTime: journey.checkOutTime,
      costs: journey.costs,
      steps: (journey.steps as any[]).map(s => ({
        step: s.step,
        completedAt: s.completedAt,
      })),
      totalCost: (journey.costs as any)?.total || 0,
      receiptDate: new Date(),
    };
  }

  async markPaymentComplete(patientId: string, staffId?: string) {
    return this.updateStep(patientId, JourneyStep.PAYMENT, JourneyStatus.COMPLETED, staffId);
  }

  async markOptometristComplete(patientId: string, staffId?: string) {
    return this.updateStep(patientId, JourneyStep.OPTOMETRIST, JourneyStatus.COMPLETED, staffId);
  }

  async markDoctorComplete(patientId: string, staffId?: string, appointmentId?: string) {
    const journey = await this.updateStep(patientId, JourneyStep.DOCTOR, JourneyStatus.COMPLETED, staffId);
    if (appointmentId) {
      return this.prisma.patientJourney.update({
        where: { id: journey.id },
        data: { appointmentId },
      });
    }
    return journey;
  }

  async markPharmacyComplete(patientId: string, staffId?: string, prescriptionId?: string) {
    const journey = await this.updateStep(patientId, JourneyStep.PHARMACY, JourneyStatus.COMPLETED, staffId);
    if (prescriptionId) {
      return this.prisma.patientJourney.update({
        where: { id: journey.id },
        data: { prescriptionId },
      });
    }
    return journey;
  }

  async getAllActiveJourneys() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    return this.prisma.patientJourney.findMany({
      where: {
        checkInTime: { gte: today },
        overallStatus: { not: JourneyStatus.COMPLETED },
      },
      orderBy: { checkInTime: 'desc' },
    });
  }
}

