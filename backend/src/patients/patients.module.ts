import { Module, forwardRef } from '@nestjs/common';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientsEnhancedService } from './patients-enhanced.service';
import { PatientJourneyService } from './patient-journey.service';
import { NotificationsModule } from '../notifications/notifications.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => NotificationsModule),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsEnhancedService, PatientJourneyService],
  exports: [PatientsService, PatientsEnhancedService, PatientJourneyService],
})
export class PatientsModule {}
