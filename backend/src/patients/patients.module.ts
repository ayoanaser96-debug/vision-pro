import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PatientsController } from './patients.controller';
import { PatientsService } from './patients.service';
import { PatientsEnhancedService } from './patients-enhanced.service';
import { Patient, PatientSchema } from './schemas/patient.schema';
import { MedicalHistory, MedicalHistorySchema } from './schemas/medical-history.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Appointment, AppointmentSchema } from '../appointments/schemas/appointment.schema';
import { EyeTest, EyeTestSchema } from '../eye-tests/schemas/eye-test.schema';
import { Prescription, PrescriptionSchema } from '../prescriptions/schemas/prescription.schema';
import { Case, CaseSchema } from '../cases/schemas/case.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Patient.name, schema: PatientSchema },
      { name: MedicalHistory.name, schema: MedicalHistorySchema },
      { name: User.name, schema: UserSchema },
      { name: Appointment.name, schema: AppointmentSchema },
      { name: EyeTest.name, schema: EyeTestSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: Case.name, schema: CaseSchema },
    ]),
  ],
  controllers: [PatientsController],
  providers: [PatientsService, PatientsEnhancedService],
  exports: [PatientsService, PatientsEnhancedService],
})
export class PatientsModule {}
