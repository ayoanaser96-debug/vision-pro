import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminEnhancedService } from './admin-enhanced.service';
import { EyeTestsModule } from '../eye-tests/eye-tests.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    EyeTestsModule,
    AppointmentsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminEnhancedService],
  exports: [AdminEnhancedService],
})
export class AdminModule {}

