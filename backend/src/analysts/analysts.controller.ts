import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AnalystsService } from './analysts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('analysts')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('analyst', 'admin')
export class AnalystsController {
  constructor(private readonly analystsService: AnalystsService) {}

  @Get('pending-tests')
  async getPendingTests() {
    return this.analystsService.getPendingTests();
  }

  @Post('tests/:id/analyze')
  async analyzeTest(@Param('id') id: string) {
    return this.analystsService.analyzeTest(id);
  }

  @Put('tests/:id/notes')
  async addNotes(@Param('id') id: string, @Request() req, @Body() body: { notes: string }) {
    return this.analystsService.addNotes(id, body.notes, req.user.id);
  }
}


