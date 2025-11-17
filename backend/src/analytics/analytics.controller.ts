import { Controller, Get, Query, Param, UseGuards, Request } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analytics')
@UseGuards(JwtAuthGuard)
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('doctor-performance')
  @UseGuards(RolesGuard)
  @Roles('DOCTOR', 'ADMIN')
  async getDoctorPerformance(
    @Request() req,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getDoctorPerformance(
      req.user.id,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('doctor-performance/:doctorId')
  @UseGuards(RolesGuard)
  @Roles('ADMIN')
  async getDoctorPerformanceById(
    @Param('doctorId') doctorId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getDoctorPerformance(
      doctorId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('clinic-insights')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'DOCTOR')
  async getClinicInsights(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.analyticsService.getClinicInsights(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('test-trends')
  async getTestTrends(
    @Query('patientId') patientId?: string,
    @Query('days') days?: string,
  ) {
    return this.analyticsService.getTestTrends(
      patientId,
      days ? parseInt(days) : 30,
    );
  }
}


