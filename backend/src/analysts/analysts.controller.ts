import { Controller, Get, Post, Put, Body, Param, UseGuards, Request } from '@nestjs/common';
import { OptometristsService } from './analysts.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('optometrists')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('OPTOMETRIST', 'ADMIN')
export class OptometristsController {
  constructor(private readonly optometristsService: OptometristsService) {}

  @Get('pending-tests')
  async getPendingTests() {
    return this.optometristsService.getPendingTests();
  }

  @Post('tests/:id/analyze')
  async analyzeTest(@Param('id') id: string) {
    return this.optometristsService.analyzeTest(id);
  }

  @Put('tests/:id/notes')
  async addNotes(@Param('id') id: string, @Request() req, @Body() body: { notes: string }) {
    return this.optometristsService.addNotes(id, body.notes, req.user.id);
  }
}


