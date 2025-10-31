import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  ValidationPipe,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(
    @Body(ValidationPipe)
    registerDto: {
      email?: string;
      phone?: string;
      nationalId?: string;
      password: string;
      firstName: string;
      lastName: string;
      role: string;
      specialty?: string;
      dateOfBirth?: Date;
      address?: string;
    },
  ) {
    return this.authService.register(registerDto);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) {
    return this.authService.login(req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    return req.user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('refresh')
  async refreshToken(@Request() req) {
    return this.authService.login(req.user);
  }
}


