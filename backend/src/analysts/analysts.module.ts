import { Module } from '@nestjs/common';
import { AnalystsController } from './analysts.controller';
import { AnalystsService } from './analysts.service';
import { EyeTestsModule } from '../eye-tests/eye-tests.module';

@Module({
  imports: [EyeTestsModule],
  controllers: [AnalystsController],
  providers: [AnalystsService],
})
export class AnalystsModule {}


