import { IsString, IsNotEmpty } from 'class-validator';

export class LoginDto {
  @IsString()
  @IsNotEmpty()
  identifier: string; // email, phone, or national ID

  @IsString()
  @IsNotEmpty()
  password: string;
}


