import { Module } from '@nestjs/common';
import { PharmacyController } from './pharmacy.controller';
import { PharmacyService } from './pharmacy.service';
import { PharmacyEnhancedService } from './pharmacy-enhanced.service';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    PrismaModule,
    PrescriptionsModule,
    NotificationsModule,
  ],
  controllers: [PharmacyController],
  providers: [PharmacyService, PharmacyEnhancedService],
  exports: [PharmacyEnhancedService],
})
export class PharmacyModule {}

