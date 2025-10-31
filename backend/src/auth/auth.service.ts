import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../users/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(identifier: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({
      $or: [
        { email: identifier },
        { phone: identifier },
        { nationalId: identifier },
      ],
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const { password: _, ...result } = user.toObject();
    return result;
  }

  async login(user: any) {
    const payload = {
      email: user.email,
      sub: user._id,
      role: user.role,
    };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user._id,
        email: user.email,
        phone: user.phone,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        specialty: user.specialty,
      },
    };
  }

  async register(registerDto: {
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
  }) {
    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: registerDto.email },
        { phone: registerDto.phone },
        { nationalId: registerDto.nationalId },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(registerDto.password, 10);

    const user = new this.userModel({
      ...registerDto,
      password: hashedPassword,
    });

    await user.save();

    const { password: _, ...result } = user.toObject();
    return result;
  }

  async verifyToken(token: string) {
    try {
      return this.jwtService.verify(token);
    } catch {
      throw new UnauthorizedException('Invalid token');
    }
  }
}


