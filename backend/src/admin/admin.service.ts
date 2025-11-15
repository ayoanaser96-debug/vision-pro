import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import { EyeTestsService } from '../eye-tests/eye-tests.service';
import { AppointmentsService } from '../appointments/appointments.service';

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private eyeTestsService: EyeTestsService,
    private appointmentsService: AppointmentsService,
  ) {}

  async getAllUsers(role?: string) {
    const where = role ? { role: role as UserRole } : {};
    return this.prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        specialty: true,
        profileImage: true,
        dateOfBirth: true,
        address: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async getUserById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        specialty: true,
        profileImage: true,
        dateOfBirth: true,
        address: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async updateUser(id: string, updateDto: any) {
    return this.prisma.user.update({
      where: { id },
      data: updateDto,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        role: true,
        status: true,
        specialty: true,
        profileImage: true,
        dateOfBirth: true,
        address: true,
        emailVerified: true,
        phoneVerified: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
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
      this.prisma.user.count({ where: { role: UserRole.PATIENT } }),
      this.prisma.user.count({ where: { role: UserRole.DOCTOR } }),
      this.prisma.user.count({ where: { role: UserRole.ANALYST } }),
      this.appointmentsService.findAll().then(apts => apts.length),
      this.eyeTestsService.findPendingForAnalysis().then(tests => tests.length),
      this.eyeTestsService.findAnalyzedForDoctor().then(tests => tests.length),
    ]);

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
