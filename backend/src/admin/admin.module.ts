import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { AdminEnhancedService } from './admin-enhanced.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { EyeTest, EyeTestSchema } from '../eye-tests/schemas/eye-test.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { Prescription, PrescriptionSchema } from '../prescriptions/schemas/prescription.schema';
import { Case, CaseSchema } from '../cases/schemas/case.schema';
import { SystemSettings, SystemSettingsSchema } from './schemas/system-settings.schema';
import { EyeTestsModule } from '../eye-tests/eye-tests.module';
import { AppointmentsModule } from '../appointments/appointments.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: EyeTest.name, schema: EyeTestSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: Case.name, schema: CaseSchema },
      { name: SystemSettings.name, schema: SystemSettingsSchema },
    ]),
    EyeTestsModule,
    AppointmentsModule,
  ],
  controllers: [AdminController],
  providers: [AdminService, AdminEnhancedService],
  exports: [AdminEnhancedService],
})
export class AdminModule {}

