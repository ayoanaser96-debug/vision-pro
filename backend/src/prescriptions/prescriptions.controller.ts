import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('prescriptions')
@UseGuards(JwtAuthGuard)
export class PrescriptionsController {
  constructor(private readonly prescriptionsService: PrescriptionsService) {}

  @Get('my-prescriptions')
  async getMyPrescriptions(@Request() req) {
    if (req.user.role === 'patient') {
      return this.prescriptionsService.findByPatient(req.user.id);
    } else if (req.user.role === 'doctor') {
      return this.prescriptionsService.findByDoctor(req.user.id);
    }
    return [];
  }

  @Get(':id')
  async getPrescription(@Param('id') id: string) {
    return this.prescriptionsService.findById(id);
  }

  @Put(':id/assign-pharmacy')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async assignToPharmacy(@Param('id') id: string, @Body() body: { pharmacyId: string }) {
    return this.prescriptionsService.assignToPharmacy(id, body.pharmacyId);
  }

  @Put(':id/fill')
  @UseGuards(RolesGuard)
  @Roles('pharmacy', 'admin')
  async fillPrescription(@Param('id') id: string, @Body() body: { notes?: string }) {
    return this.prescriptionsService.fillPrescription(id, body.notes);
  }

  @Post('ai-suggestions')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async getAISuggestions(@Body() body: { diagnosis: string; patientHistory?: any }) {
    return this.prescriptionsService.getAISuggestions(
      body.diagnosis,
      body.patientHistory,
    );
  }

  @Get('templates')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async getTemplates(@Query('specialty') specialty?: string) {
    return this.prescriptionsService.getTemplates(specialty);
  }

  @Post('templates')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async createTemplate(@Request() req, @Body() templateData: any) {
    return this.prescriptionsService.createTemplate({
      ...templateData,
      createdBy: req.user.id,
    });
  }

  @Get('templates/:id')
  async getTemplate(@Param('id') id: string) {
    return this.prescriptionsService.getTemplateById(id);
  }

  @Post(':id/sign')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async signPrescription(@Param('id') id: string, @Request() req, @Body() body: { signature: string }) {
    return this.prescriptionsService.signPrescription(id, body.signature, req.user.id);
  }
}

