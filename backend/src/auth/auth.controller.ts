import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Get,
  ValidationPipe,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  async register(@Body(ValidationPipe) registerDto: RegisterDto) {
    try {
      console.log('Registration request received:', { ...registerDto, password: '***' });
      const createdUser = await this.authService.register(registerDto);
      // Return token + user so frontend can be logged in immediately after registration
      return this.authService.login(createdUser);
    } catch (error: any) {
      // Log the error for debugging
      console.error('Registration error:', error);
      console.error('Error stack:', error.stack);
      
      // Return proper HTTP error response
      if (error instanceof HttpException) {
        throw error;
      }
      
      // Handle Prisma errors
      if (error.code === 'P2002') {
        throw new HttpException(
          'A user with this email, phone, or national ID already exists',
          HttpStatus.CONFLICT,
        );
      }
      
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('login')
  async login(@Body(ValidationPipe) loginDto: LoginDto) {
    try {
      console.log('Login request received:', { identifier: loginDto.identifier, password: '***' });
      const user = await this.authService.validateUser(loginDto.identifier, loginDto.password);
      return this.authService.login(user);
    } catch (error: any) {
      console.error('Login error:', error);
      console.error('Error stack:', error.stack);
      
      // Return proper HTTP error response
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.UNAUTHORIZED,
      );
    }
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
