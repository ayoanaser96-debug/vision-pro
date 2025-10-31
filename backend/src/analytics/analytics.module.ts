import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { User, UserSchema } from '../users/schemas/user.schema';
import { EyeTest, EyeTestSchema } from '../eye-tests/schemas/eye-test.schema';
import { Prescription, PrescriptionSchema } from '../prescriptions/schemas/prescription.schema';
import { Case, CaseSchema } from '../cases/schemas/case.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: EyeTest.name, schema: EyeTestSchema },
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: Case.name, schema: CaseSchema },
    ]),
  ],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}


