import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { PatientsService } from './patients.service';
import { PatientsEnhancedService } from './patients-enhanced.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('patients')
@UseGuards(JwtAuthGuard)
export class PatientsController {
  constructor(
    private readonly patientsService: PatientsService,
    private readonly patientsEnhancedService: PatientsEnhancedService,
  ) {}

  @Get('profile')
  async getProfile(@Request() req) {
    return this.patientsService.getPatientProfile(req.user.id);
  }

  @Put('profile')
  async updateProfile(@Request() req, @Body() updateDto: any) {
    return this.patientsService.updatePatientProfile(req.user.id, updateDto);
  }

  @Get('medical-history')
  async getMedicalHistory(@Request() req) {
    return this.patientsService.getMedicalHistory(req.user.id);
  }

  // Enhanced features
  @Get('unified-journey')
  async getUnifiedMedicalJourney(@Request() req) {
    return this.patientsEnhancedService.getUnifiedMedicalJourney(req.user.id);
  }

  @Get('suggested-appointments')
  async getSuggestedAppointments(
    @Request() req,
    @Query('urgency') urgency?: string,
    @Query('condition') condition?: string,
  ) {
    return this.patientsEnhancedService.getSuggestedAppointments(req.user.id, urgency, condition);
  }

  @Get('appointments/:id/wait-time')
  async getWaitTimePrediction(@Param('id') id: string) {
    return this.patientsEnhancedService.getWaitTimePrediction(id);
  }

  @Get('health-timeline')
  async getHealthTimeline(@Request() req) {
    return this.patientsEnhancedService.getHealthTimeline(req.user.id);
  }

  @Get('comparative-analysis')
  async getComparativeAnalysis(@Request() req, @Query('testId') testId?: string) {
    return this.patientsEnhancedService.getComparativeAnalysis(req.user.id, testId);
  }

  @Get('ai-insights')
  async getAIInsights(@Request() req) {
    return this.patientsEnhancedService.getAIInsights(req.user.id);
  }

  @Get('prescription-tracking')
  async getPrescriptionTracking(@Request() req) {
    return this.patientsEnhancedService.getPrescriptionTracking(req.user.id);
  }

  @Get('billing-history')
  async getBillingHistory(@Request() req) {
    return this.patientsEnhancedService.getBillingHistory(req.user.id);
  }

  @Get('health-dashboard')
  async getHealthDashboard(@Request() req) {
    return this.patientsEnhancedService.getHealthDashboard(req.user.id);
  }
}
