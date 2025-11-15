import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, UserStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
        { email: identifier },
        { phone: identifier },
        { nationalId: identifier },
      ],
      },
    });

    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user;
    return result;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user.id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        specialty: user.specialty,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      // Validate that at least one identifier is provided
      if (!registerDto.email && !registerDto.phone && !registerDto.nationalId) {
        throw new ConflictException('At least one identifier (email, phone, or nationalId) is required');
      }

      // Email is required in the schema, so ensure it's provided
      if (!registerDto.email) {
        throw new ConflictException('Email is required');
      }

      // Build OR conditions only for provided fields
      const orConditions: any[] = [];
      if (registerDto.email) {
        orConditions.push({ email: registerDto.email });
      }
      if (registerDto.phone) {
        orConditions.push({ phone: registerDto.phone });
      }
      if (registerDto.nationalId) {
        orConditions.push({ nationalId: registerDto.nationalId });
      }

    // Check if user already exists
      if (orConditions.length > 0) {
        const existingUser = await this.prisma.user.findFirst({
          where: {
            OR: orConditions,
          },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
        }
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

      // Parse dateOfBirth if it's a string
      let parsedDateOfBirth: Date | null = null;
      if (registerDto.dateOfBirth) {
        if (typeof registerDto.dateOfBirth === 'string') {
          parsedDateOfBirth = new Date(registerDto.dateOfBirth);
        } else {
          parsedDateOfBirth = registerDto.dateOfBirth;
        }
      }

      const user = await this.prisma.user.create({
        data: {
          email: registerDto.email,
          phone: registerDto.phone || null,
          nationalId: registerDto.nationalId || null,
      password: hashedPassword,
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          role: registerDto.role,
          status: UserStatus.ACTIVE,
          specialty: registerDto.specialty || null,
          dateOfBirth: parsedDateOfBirth,
          address: registerDto.address || null,
        },
      });

      const { password: _, ...result } = user;
    return result;
    } catch (error: any) {
      console.error('Registration service error:', error);
      // Re-throw NestJS exceptions as-is
      if (error instanceof ConflictException) {
        throw error;
      }
      // Wrap other errors
      throw new ConflictException(error.message || 'Registration failed');
    }
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}


