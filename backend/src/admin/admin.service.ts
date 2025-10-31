import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from '../users/schemas/user.schema';
import { EyeTestsService } from '../eye-tests/eye-tests.service';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private eyeTestsService: EyeTestsService,
    private appointmentsService: AppointmentsService,
  ) {}

  async getAllUsers(role?: string) {
    const query = role ? { role } : {};
    return this.userModel.find(query).select('-password');
  }

  async getUserById(id: string) {
    return this.userModel.findById(id).select('-password');
  }

  async updateUser(id: string, updateDto: any) {
    return this.userModel.findByIdAndUpdate(id, updateDto, { new: true }).select('-password');
  }

  async deleteUser(id: string) {
    return this.userModel.findByIdAndDelete(id);
  }

  async getAnalytics() {
    const [
      totalPatients,
      totalDoctors,
      totalAnalysts,
      totalAppointments,
      pendingTests,
      completedTests,
    ] = await Promise.all([
      this.userModel.countDocuments({ role: UserRole.PATIENT }),
      this.userModel.countDocuments({ role: UserRole.DOCTOR }),
      this.userModel.countDocuments({ role: UserRole.ANALYST }),
      this.appointmentsService.findAll().then(apts => apts.length),
      this.eyeTestsService.findPendingForAnalysis().then(tests => tests.length),
      this.eyeTestsService.findAnalyzedForDoctor().then(tests => tests.length),
    ]);

    // Get appointments by day (last 7 days)
    const appointments = await this.appointmentsService.findAll();
    const appointmentsByDay = this.groupByDay(appointments);

    return {
      users: {
        patients: totalPatients,
        doctors: totalDoctors,
        analysts: totalAnalysts,
      },
      tests: {
        pending: pendingTests,
        completed: completedTests,
      },
      appointments: {
        total: totalAppointments,
        byDay: appointmentsByDay,
      },
    };
  }

  private groupByDay(appointments: any[]) {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();

    return last7Days.map(date => ({
      date,
      count: appointments.filter(apt => 
        apt.appointmentDate?.toISOString().split('T')[0] === date
      ).length,
    }));
  }
}


