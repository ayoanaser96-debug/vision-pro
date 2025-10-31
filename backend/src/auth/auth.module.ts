import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { BiometricController } from './biometric.controller';
import { FaceRecognitionService } from './face-recognition.service';
import { DocumentScannerService } from './document-scanner.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User, UserSchema } from '../users/schemas/user.schema';
import { UserFace, UserFaceSchema } from './schemas/user-face.schema';
import { UserDocument, UserDocumentSchema } from './schemas/user-document.schema';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    UsersModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: {
          expiresIn: configService.get<string>('JWT_EXPIRES_IN') || '7d',
        },
      }),
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserFace.name, schema: UserFaceSchema },
      { name: UserDocument.name, schema: UserDocumentSchema },
    ]),
  ],
  controllers: [AuthController, BiometricController],
  providers: [AuthService, FaceRecognitionService, DocumentScannerService, JwtStrategy, LocalStrategy],
  exports: [AuthService, FaceRecognitionService, DocumentScannerService],
})
export class AuthModule {}


