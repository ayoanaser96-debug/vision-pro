import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsService } from './prescriptions.service';
import { Prescription, PrescriptionSchema } from './schemas/prescription.schema';
import { PrescriptionTemplate, PrescriptionTemplateSchema } from './schemas/prescription-template.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Prescription.name, schema: PrescriptionSchema },
      { name: PrescriptionTemplate.name, schema: PrescriptionTemplateSchema },
    ]),
  ],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService],
  exports: [PrescriptionsService],
})
export class PrescriptionsModule {}

