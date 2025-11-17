import { Module } from '@nestjs/common';
import { OptometristsController } from './analysts.controller';
import { OptometristsService } from './analysts.service';
import { EyeTestsModule } from '../eye-tests/eye-tests.module';

@Module({
  imports: [EyeTestsModule],
  controllers: [OptometristsController],
  providers: [OptometristsService],
})
export class OptometristsModule {}


