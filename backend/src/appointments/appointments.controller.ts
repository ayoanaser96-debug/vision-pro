import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('appointments')
@UseGuards(JwtAuthGuard)
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  @Post()
  async create(@Request() req, @Body() createDto: any) {
    return this.appointmentsService.create({
      ...createDto,
      patientId: req.user.id,
    });
  }

  @Get('my-appointments')
  async getMyAppointments(@Request() req) {
    if (req.user.role === 'patient') {
      return this.appointmentsService.findByPatient(req.user.id);
    } else if (req.user.role === 'doctor') {
      return this.appointmentsService.findByDoctor(req.user.id);
    }
    return this.appointmentsService.findAll();
  }

  @Get('upcoming')
  async getUpcoming(@Request() req) {
    return this.appointmentsService.getUpcomingByPatient(req.user.id);
  }

  @Get(':id')
  async getAppointment(@Param('id') id: string) {
    return this.appointmentsService.findById(id);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async updateAppointment(@Param('id') id: string, @Body() updateDto: any) {
    return this.appointmentsService.update(id, updateDto);
  }

  @Put(':id/cancel')
  async cancelAppointment(@Param('id') id: string) {
    return this.appointmentsService.cancel(id);
  }
}


