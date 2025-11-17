import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { PatientsModule } from './patients/patients.module';
import { AppointmentsModule } from './appointments/appointments.module';
import { EyeTestsModule } from './eye-tests/eye-tests.module';
import { OptometristsModule } from './analysts/analysts.module';
import { DoctorsModule } from './doctors/doctors.module';
import { AdminModule } from './admin/admin.module';
import { PrescriptionsModule } from './prescriptions/prescriptions.module';
import { PharmacyModule } from './pharmacy/pharmacy.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { CasesModule } from './cases/cases.module';
import { AuditModule } from './audit/audit.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { BillingModule } from './billing/billing.module';
import { FaceRecognitionModule } from './face-recognition/face-recognition.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    UsersModule,
    PatientsModule,
    AppointmentsModule,
    EyeTestsModule,
    OptometristsModule,
    DoctorsModule,
    AdminModule,
    PrescriptionsModule,
    PharmacyModule,
    ChatModule,
    NotificationsModule,
    CasesModule,
    AuditModule,
    AnalyticsModule,
    BillingModule,
    FaceRecognitionModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

