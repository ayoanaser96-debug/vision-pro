import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DoctorsController } from './doctors.controller';
import { DoctorsService } from './doctors.service';
import { EyeTestsModule } from '../eye-tests/eye-tests.module';
import { PrescriptionsModule } from '../prescriptions/prescriptions.module';
import { AppointmentsModule } from '../appointments/appointments.module';
import { PatientsModule } from '../patients/patients.module';
import { UsersModule } from '../users/users.module';
import { User, UserSchema } from '../users/schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UsersModule,
    PatientsModule,
    EyeTestsModule,
    PrescriptionsModule,
    AppointmentsModule,
  ],
  controllers: [DoctorsController],
  providers: [DoctorsService],
  exports: [DoctorsService],
})
export class DoctorsModule {}

