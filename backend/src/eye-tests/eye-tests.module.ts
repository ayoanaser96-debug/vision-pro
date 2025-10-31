import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { EyeTestsController } from './eye-tests.controller';
import { EyeTestsService } from './eye-tests.service';
import { EyeTest, EyeTestSchema } from './schemas/eye-test.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: EyeTest.name, schema: EyeTestSchema },
    ]),
  ],
  controllers: [EyeTestsController],
  providers: [EyeTestsService],
  exports: [EyeTestsService],
})
export class EyeTestsModule {}


