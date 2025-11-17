import { IsEmail, IsOptional, IsString, IsNotEmpty, IsEnum, IsDateString, ValidateIf, ValidationArguments, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator';
import { Transform } from 'class-transformer';
import { UserRole } from '@prisma/client';

@ValidatorConstraint({ name: 'isValidRole', async: false })
export class IsValidRoleConstraint implements ValidatorConstraintInterface {
  validate(value: any, args: ValidationArguments) {
    const validRoles = Object.values(UserRole);
    const upperValue = typeof value === 'string' ? value.toUpperCase() : value;
    // Allow ANALYST for backward compatibility, it will be transformed to OPTOMETRIST
    return validRoles.includes(upperValue as UserRole) || upperValue === 'ANALYST';
  }

  defaultMessage(args: ValidationArguments) {
    const validRoles = Object.values(UserRole);
    return `role must be one of the following values: ${validRoles.join(', ')}`;
  }
}

function IsValidRole() {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      validator: IsValidRoleConstraint,
    });
  };
}

export class RegisterDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  nationalId?: string;

  @IsString()
  @IsNotEmpty()
  password: string;

  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const upperValue = value.toUpperCase();
      // Map ANALYST to OPTOMETRIST for backward compatibility
      if (upperValue === 'ANALYST') {
        return 'OPTOMETRIST' as UserRole;
      }
      return upperValue as UserRole;
    }
    return value;
  })
  @IsValidRole()
  @IsNotEmpty()
  role: UserRole;

  @IsString()
  @IsOptional()
  specialty?: string;

  @IsDateString()
  @IsOptional()
  dateOfBirth?: string;

  @IsString()
  @IsOptional()
  address?: string;
}

