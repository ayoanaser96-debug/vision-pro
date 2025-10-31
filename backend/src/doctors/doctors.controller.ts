import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { DoctorsService } from './doctors.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('doctors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('doctor', 'admin')
export class DoctorsController {
  constructor(private readonly doctorsService: DoctorsService) {}

  @Get('assigned-patients')
  async getAssignedPatients(@Request() req) {
    return this.doctorsService.getAssignedPatients(req.user.id);
  }

  @Get('cases')
  async getCasesForReview(@Request() req) {
    return this.doctorsService.getCasesForReview(req.user.id);
  }

  @Get('appointments')
  async getAppointments(@Request() req) {
    return this.doctorsService.getMyAppointments(req.user.id);
  }

  @Put('tests/:id/review')
  async reviewTest(@Param('id') id: string, @Request() req, @Body() review: any) {
    return this.doctorsService.reviewTest(id, review, req.user.id);
  }

  @Post('prescriptions')
  async createPrescription(@Request() req, @Body() data: any) {
    return this.doctorsService.createPrescription(data, req.user.id);
  }
}


