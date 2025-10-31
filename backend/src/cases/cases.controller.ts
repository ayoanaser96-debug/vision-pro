import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('cases')
@UseGuards(JwtAuthGuard)
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  async create(@Request() req, @Body() createDto: any) {
    return this.casesService.create(createDto);
  }

  @Get('my-cases')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async getMyCases(@Request() req) {
    return this.casesService.findByDoctor(req.user.id);
  }

  @Get(':id')
  async getCase(@Param('id') id: string) {
    return this.casesService.findById(id);
  }

  @Put(':id/status')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async updateStatus(@Param('id') id: string, @Request() req, @Body() body: { status: string }) {
    return this.casesService.updateStatus(id, body.status as any, req.user.id);
  }

  @Put(':id/delegate')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async delegate(@Param('id') id: string, @Request() req, @Body() body: { toDoctorId: string }) {
    return this.casesService.delegate(id, req.user.id, body.toDoctorId);
  }

  @Put(':id/assign')
  @UseGuards(RolesGuard)
  @Roles('doctor', 'admin')
  async assignDoctor(@Param('id') id: string, @Body() body: { doctorId: string }) {
    return this.casesService.assignDoctor(id, body.doctorId);
  }

  @Post(':id/timeline')
  async addTimelineEntry(@Param('id') id: string, @Request() req, @Body() entry: any) {
    return this.casesService.addTimelineEntry(id, {
      ...entry,
      userId: req.user.id,
    });
  }
}


