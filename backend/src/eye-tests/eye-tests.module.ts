import { Module, forwardRef } from '@nestjs/common';
import { EyeTestsController } from './eye-tests.controller';
import { EyeTestsService } from './eye-tests.service';
import { PatientsModule } from '../patients/patients.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [
    PrismaModule,
    forwardRef(() => PatientsModule),
  ],
  controllers: [EyeTestsController],
  providers: [EyeTestsService],
  exports: [EyeTestsService],
})
export class EyeTestsModule {}


