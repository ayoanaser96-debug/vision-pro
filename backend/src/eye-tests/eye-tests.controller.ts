import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { EyeTestsService } from './eye-tests.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('eye-tests')
@UseGuards(JwtAuthGuard)
export class EyeTestsController {
  constructor(private readonly eyeTestsService: EyeTestsService) {}

  @Post()
  async create(@Request() req, @Body() createDto: any) {
    return this.eyeTestsService.create({
      ...createDto,
      patientId: req.user.id,
    });
  }

  @Get('my-tests')
  async getMyTests(@Request() req) {
    if (req.user.role?.toUpperCase() === 'PATIENT') {
      return this.eyeTestsService.findByPatient(req.user.id);
    }
    return [];
  }

  @Get('pending-analysis')
  @UseGuards(RolesGuard)
  @Roles('OPTOMETRIST', 'ADMIN')
  async getPendingTests() {
    return this.eyeTestsService.findPendingForAnalysis();
  }

  @Get('for-doctor')
  @UseGuards(RolesGuard)
  @Roles('DOCTOR', 'ADMIN')
  async getTestsForDoctor(@Request() req) {
    return this.eyeTestsService.findAnalyzedForDoctor(req.user.role?.toUpperCase() === 'DOCTOR' ? req.user.id : undefined);
  }

  @Get(':id')
  async getTest(@Param('id') id: string) {
    return this.eyeTestsService.findById(id);
  }

  @Post(':id/analyze')
  @UseGuards(RolesGuard)
  @Roles('OPTOMETRIST', 'ADMIN')
  async analyzeTest(@Param('id') id: string) {
    return this.eyeTestsService.runAIAnalysis(id);
  }

  @Put(':id/optometrist-notes')
  @UseGuards(RolesGuard)
  @Roles('OPTOMETRIST', 'ADMIN')
  async addOptometristNotes(@Param('id') id: string, @Request() req, @Body() body: { notes: string }) {
    return this.eyeTestsService.addOptometristNotes(id, body.notes, req.user.id);
  }

  @Put(':id/doctor-review')
  @UseGuards(RolesGuard)
  @Roles('DOCTOR', 'ADMIN')
  async doctorReview(@Param('id') id: string, @Request() req, @Body() review: any) {
    return this.eyeTestsService.doctorReview(id, {
      ...review,
      doctorId: req.user.id,
    });
  }
}


