import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../users/schemas/user.schema';
import { EyeTest, EyeTestDocument } from '../eye-tests/schemas/eye-test.schema';
import { Appointment, AppointmentDocument } from '../appointments/schemas/appointment.schema';
import { Prescription, PrescriptionDocument } from '../prescriptions/schemas/prescription.schema';
import { Case, CaseDocument } from '../cases/schemas/case.schema';
import { SystemSettings, SystemSettingsDocument } from './schemas/system-settings.schema';

// Device Monitoring Schema (inline for now)
export interface DeviceStatus {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  status: 'online' | 'offline' | 'maintenance' | 'error';
  lastDataSync?: Date;
  calibrationStatus: 'calibrated' | 'needs_calibration' | 'calibrating';
  firmwareVersion?: string;
  location?: string;
}

@Injectable()
export class AdminEnhancedService {
  // Mock device data (in production, this would be in a database)
  private devices: DeviceStatus[] = [
    {
      deviceId: 'fundus-001',
      deviceName: 'Fundus Camera - Room 1',
      deviceType: 'fundus_camera',
      status: 'online',
      lastDataSync: new Date(),
      calibrationStatus: 'calibrated',
      firmwareVersion: 'v2.3.1',
      location: 'Exam Room 1',
    },
    {
      deviceId: 'auto-001',
      deviceName: 'Auto Refractor - Room 2',
      deviceType: 'autorefractor',
      status: 'online',
      lastDataSync: new Date(Date.now() - 300000), // 5 minutes ago
      calibrationStatus: 'calibrated',
      firmwareVersion: 'v1.8.2',
      location: 'Exam Room 2',
    },
  ];

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(EyeTest.name) private eyeTestModel: Model<EyeTestDocument>,
    @InjectModel(Appointment.name) private appointmentModel: Model<AppointmentDocument>,
    @InjectModel(Prescription.name) private prescriptionModel: Model<PrescriptionDocument>,
    @InjectModel(Case.name) private caseModel: Model<CaseDocument>,
    @InjectModel(SystemSettings.name) private settingsModel: Model<SystemSettingsDocument>,
  ) {}

  // 1. Smart User & Role Management
  async getUsersWithActivity() {
    const users = await this.userModel.find().select('-password').lean();
    // Add activity tracking (in production, this would be from a sessions/activity collection)
    return users.map((user: any) => ({
      ...user,
      lastLogin: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random last 7 days
      isActive: Math.random() > 0.3,
      failedLoginAttempts: Math.random() > 0.9 ? Math.floor(Math.random() * 5) : 0,
    }));
  }

  async updateUserRole(userId: string, role: string, permissions?: any) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { role, permissions },
      { new: true },
    ).select('-password');
  }

  async revokeUserAccess(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      { status: 'suspended' },
      { new: true },
    ).select('-password');
  }

  async getUserActivity(userId: string, days: number = 30) {
    // In production, this would query an activity log collection
    return {
      logins: Array.from({ length: days }, () => ({
        date: new Date(),
        ip: '192.168.1.' + Math.floor(Math.random() * 255),
        successful: Math.random() > 0.1,
      })),
      actions: [],
      dataDownloads: [],
    };
  }

  // 2. Device Monitoring
  async getDevices() {
    return this.devices;
  }

  async updateDeviceStatus(deviceId: string, status: Partial<DeviceStatus>) {
    const device = this.devices.find(d => d.deviceId === deviceId);
    if (device) {
      Object.assign(device, status);
    }
    return device;
  }

  async getDeviceAlerts() {
    const alerts = [];
    for (const device of this.devices) {
      if (device.status === 'offline' || device.status === 'error') {
        alerts.push({
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          severity: device.status === 'error' ? 'high' : 'medium',
          message: `Device ${device.status}`,
          timestamp: new Date(),
        });
      }
      if (device.lastDataSync) {
        const minutesSinceSync = (Date.now() - device.lastDataSync.getTime()) / (1000 * 60);
        if (minutesSinceSync > 30) {
          alerts.push({
            deviceId: device.deviceId,
            deviceName: device.deviceName,
            severity: 'medium',
            message: 'No data sync for over 30 minutes',
            timestamp: device.lastDataSync,
          });
        }
      }
      if (device.calibrationStatus === 'needs_calibration') {
        alerts.push({
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          severity: 'low',
          message: 'Device needs calibration',
          timestamp: new Date(),
        });
      }
    }
    return alerts;
  }

  // 3. Appointment Analytics & Scheduling
  async getAppointmentAnalytics(startDate?: Date, endDate?: Date) {
    const query: any = {};
    if (startDate) query.appointmentDate = { $gte: startDate };
    if (endDate && query.appointmentDate) {
      query.appointmentDate.$lte = endDate;
    }

    const appointments = await this.appointmentModel.find(query).populate('doctorId').lean();
    
    // Calculate wait times (simulated)
    const avgWaitTime = Math.floor(Math.random() * 30) + 10; // 10-40 minutes
    
    // Predict wait time based on queue
    const pendingCount = appointments.filter((apt: any) => apt.status === 'scheduled').length;
    const predictedWait = pendingCount * 15; // 15 min per appointment

    return {
      total: appointments.length,
      scheduled: appointments.filter((apt: any) => apt.status === 'scheduled').length,
      completed: appointments.filter((apt: any) => apt.status === 'completed').length,
      cancelled: appointments.filter((apt: any) => apt.status === 'cancelled').length,
      avgWaitTime,
      predictedWaitTime: predictedWait,
      byDay: this.groupAppointmentsByDay(appointments),
      byDoctor: this.groupAppointmentsByDoctor(appointments),
    };
  }

  private groupAppointmentsByDay(appointments: any[]) {
    const grouped: Record<string, number> = {};
    appointments.forEach((apt: any) => {
      const date = new Date(apt.appointmentDate).toISOString().split('T')[0];
      grouped[date] = (grouped[date] || 0) + 1;
    });
    return Object.entries(grouped).map(([date, count]) => ({ date, count }));
  }

  private groupAppointmentsByDoctor(appointments: any[]) {
    const grouped: Record<string, number> = {};
    appointments.forEach((apt: any) => {
      const doctorId = apt.doctorId?._id?.toString() || 'unassigned';
      grouped[doctorId] = (grouped[doctorId] || 0) + 1;
    });
    return Object.entries(grouped).map(([doctorId, count]) => ({
      doctorId,
      doctorName: appointments.find((apt: any) => 
        apt.doctorId?._id?.toString() === doctorId
      )?.doctorId?.firstName || 'Unassigned',
      count,
    }));
  }

  // 4. Billing & Financial Management
  async getBillingAnalytics(startDate?: Date, endDate?: Date) {
    const query: any = {};
    if (startDate) query.createdAt = { $gte: startDate };

    const prescriptions = await this.prescriptionModel.find(query).lean();
    const appointments = await this.appointmentModel.find(query).lean();

    // Simulated billing data
    const revenue = {
      prescriptions: prescriptions.length * 50, // $50 per prescription
      appointments: appointments.filter((apt: any) => apt.status === 'completed').length * 100, // $100 per appointment
      total: 0,
    };
    revenue.total = revenue.prescriptions + revenue.appointments;

    // Detect potential fraud (duplicate charges, unusual patterns)
    const fraudAlerts = this.detectBillingFraud(prescriptions, appointments);

    return {
      revenue,
      byDay: this.groupBillingByDay(prescriptions, appointments),
      currency: 'USD', // In production, this would come from clinic settings
      fraudAlerts,
      pendingInvoices: appointments.filter((apt: any) => apt.status === 'scheduled').length,
      paidInvoices: appointments.filter((apt: any) => apt.status === 'completed').length,
    };
  }

  private detectBillingFraud(prescriptions: any[], appointments: any[]) {
    const alerts = [];
    
    // Check for duplicate prescriptions
    const prescriptionDates = prescriptions.map(p => 
      new Date(p.createdAt).toISOString().split('T')[0]
    );
    const duplicateDates = prescriptionDates.filter((date, index) => 
      prescriptionDates.indexOf(date) !== index
    );
    
    if (duplicateDates.length > 0) {
      alerts.push({
        type: 'duplicate_prescriptions',
        severity: 'medium',
        message: `Multiple prescriptions created on same date: ${duplicateDates[0]}`,
        count: duplicateDates.length,
      });
    }

    // Check for unusual billing patterns
    if (prescriptions.length > appointments.length * 2) {
      alerts.push({
        type: 'unusual_pattern',
        severity: 'low',
        message: 'Prescription count significantly higher than appointments',
      });
    }

    return alerts;
  }

  private groupBillingByDay(prescriptions: any[], appointments: any[]) {
    const grouped: Record<string, { prescriptions: number; appointments: number; revenue: number }> = {};
    
    [...prescriptions, ...appointments].forEach((item: any) => {
      const date = new Date(item.createdAt || item.appointmentDate).toISOString().split('T')[0];
      if (!grouped[date]) {
        grouped[date] = { prescriptions: 0, appointments: 0, revenue: 0 };
      }
      if (item.medications) {
        grouped[date].prescriptions++;
        grouped[date].revenue += 50;
      } else {
        grouped[date].appointments++;
        grouped[date].revenue += 100;
      }
    });

    return Object.entries(grouped).map(([date, data]) => ({ date, ...data }));
  }

  // 5. AI-Driven Analytics
  async getComprehensiveAnalytics(startDate?: Date, endDate?: Date) {
    const query: any = {};
    if (startDate) query.createdAt = { $gte: startDate };
    if (endDate && query.createdAt) {
      query.createdAt.$lte = endDate;
    }

    const [patients, doctors, tests, cases, prescriptions, appointments] = await Promise.all([
      this.userModel.countDocuments({ role: 'patient' }),
      this.userModel.countDocuments({ role: 'doctor' }),
      this.eyeTestModel.countDocuments(query),
      this.caseModel.countDocuments(query),
      this.prescriptionModel.countDocuments(query),
      this.appointmentModel.countDocuments(query),
    ]);

    // Disease distribution
    const diseaseDistribution = await this.getDiseaseDistribution();
    
    // Patient growth trends
    const patientGrowth = await this.getPatientGrowth();
    
    // Regional analytics (if location data exists)
    const regionalData = await this.getRegionalAnalytics();

    return {
      overview: {
        totalPatients: patients,
        activeDoctors: doctors,
        totalTests: tests,
        totalCases: cases,
        totalPrescriptions: prescriptions,
        totalAppointments: appointments,
      },
      diseaseDistribution,
      patientGrowth,
      regionalData,
      predictions: {
        expectedPatientsNextMonth: Math.floor(patients * 1.1), // 10% growth
        peakHours: ['09:00', '10:00', '14:00', '15:00'],
        expectedRevenue: prescriptions * 50 + appointments * 100,
      },
    };
  }

  private async getDiseaseDistribution() {
    const tests = await this.eyeTestModel.find().lean();
    const distribution: Record<string, number> = {
      normal: 0,
      cataract: 0,
      glaucoma: 0,
      diabetic_retinopathy: 0,
      refractive_errors: 0,
    };

    tests.forEach((test: any) => {
      if (test.aiAnalysis) {
        if (test.aiAnalysis.cataract?.detected) distribution.cataract++;
        if (test.aiAnalysis.glaucoma?.detected) distribution.glaucoma++;
        if (test.aiAnalysis.diabeticRetinopathy?.detected) distribution.diabetic_retinopathy++;
        if (!test.aiAnalysis.cataract?.detected && 
            !test.aiAnalysis.glaucoma?.detected && 
            !test.aiAnalysis.diabeticRetinopathy?.detected) {
          distribution.normal++;
        }
      }
      if (test.refractionRight || test.refractionLeft) {
        distribution.refractive_errors++;
      }
    });

    return Object.entries(distribution).map(([disease, count]) => ({ disease, count }));
  }

  private async getPatientGrowth() {
    const patients = await this.userModel.find({ role: 'patient' })
      .select('createdAt')
      .sort({ createdAt: 1 })
      .lean();

    const monthlyGrowth: Record<string, number> = {};
    patients.forEach((patient: any) => {
      const month = new Date(patient.createdAt).toISOString().slice(0, 7); // YYYY-MM
      monthlyGrowth[month] = (monthlyGrowth[month] || 0) + 1;
    });

    return Object.entries(monthlyGrowth).map(([month, count]) => ({ month, count }));
  }

  private async getRegionalAnalytics() {
    // In production, this would query location data
    return [
      { region: 'Baghdad', patients: 45, cases: 23 },
      { region: 'Basra', patients: 32, cases: 18 },
      { region: 'Erbil', patients: 28, cases: 15 },
    ];
  }

  // 6. Security & Compliance
  async getAuditLogs(userId?: string, action?: string, startDate?: Date, endDate?: Date) {
    // In production, this would query an audit log collection
    return {
      logs: [],
      summary: {
        totalActions: 0,
        byType: {},
        suspiciousActivity: [],
      },
    };
  }

  async getSecurityStatus() {
    return {
      encryptionEnabled: true,
      twoFactorEnabled: false, // Can be configured
      sslEnabled: true,
      lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
      backupFrequency: 'daily',
    };
  }

  // System Settings
  async getSettings() {
    let settings = await this.settingsModel.findOne({ settingsKey: 'global' });
    if (!settings) {
      // Create default settings
      settings = new this.settingsModel({
        settingsKey: 'global',
        currency: 'USD',
        language: 'en',
        theme: 'light',
      });
      await settings.save();
    }
    return settings;
  }

  async updateSettings(settingsData: any) {
    const settings = await this.settingsModel.findOneAndUpdate(
      { settingsKey: 'global' },
      {
        currency: settingsData.currency,
        language: settingsData.language,
        theme: settingsData.theme,
        otherSettings: settingsData.otherSettings,
      },
      { upsert: true, new: true },
    );
    return settings;
  }

  // Device Management
  async calibrateDevice(deviceId: string) {
    // Update device calibration status
    const device = this.devices.find(d => d.deviceId === deviceId);
    if (device) {
      device.calibrationStatus = 'calibrating';
      // Simulate calibration process
      setTimeout(() => {
        device.calibrationStatus = 'calibrated';
      }, 5000);
      return { message: 'Calibration started', deviceId };
    }
    throw new Error('Device not found');
  }
}

