import { IsEmail, IsNotEmpty, IsString, MinLength, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { UserRole, OrganizationLevel } from '../schemas/user.schema';

export class RegisterDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @IsString()
  @IsNotEmpty()
  firstname: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @IsString()
  @IsNotEmpty()
  lastname: string;

  @ApiProperty({
    description: 'User national code (unique identifier)',
    example: '1234567890',
  })
  @IsString()
  @IsNotEmpty()
  nationalcode: string;

  @ApiProperty({
    description: 'User personal code (employee ID)',
    example: 'EMP001',
  })
  @IsString()
  @IsNotEmpty()
  personalcode: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@company.com',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: 'User organization level',
    enum: OrganizationLevel,
    example: OrganizationLevel.SENIOR,
  })
  @IsEnum(OrganizationLevel)
  @IsNotEmpty()
  organizationLevel: OrganizationLevel;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.USER,
    required: false,
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}
