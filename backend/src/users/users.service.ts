import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  async findById(id: string): Promise<UserDocument | null> {
    return this.userModel.findById(id);
  }

  async findByEmail(email: string): Promise<UserDocument | null> {
    return this.userModel.findOne({ email });
  }

  async findAll(role?: string): Promise<UserDocument[]> {
    const query = role ? { role } : {};
    return this.userModel.find(query);
  }

  async updateStatus(id: string, status: string): Promise<UserDocument> {
    return this.userModel.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );
  }
}


