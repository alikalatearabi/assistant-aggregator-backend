import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsEmail, IsEnum, IsOptional, IsBoolean, MinLength, MaxLength } from 'class-validator';
import { UserRole, OrganizationLevel } from '../schemas/user.schema';

export class CreateUserDto {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly firstname: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
    minLength: 1,
    maxLength: 50,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(50)
  readonly lastname: string;

  @ApiProperty({
    description: 'User national code (unique identifier)',
    example: '1234567890',
    minLength: 10,
    maxLength: 10,
  })
  @IsString()
  @MinLength(10)
  @MaxLength(10)
  readonly nationalcode: string;

  @ApiProperty({
    description: 'User personal code (employee ID)',
    example: 'EMP001',
    minLength: 1,
    maxLength: 20,
  })
  @IsString()
  @MinLength(1)
  @MaxLength(20)
  readonly personalcode: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@company.com',
    format: 'email',
  })
  @IsEmail()
  readonly email: string;

  @ApiProperty({
    description: 'User organization level',
    enum: OrganizationLevel,
    example: OrganizationLevel.SENIOR,
  })
  @IsEnum(OrganizationLevel)
  readonly organizationLevel: OrganizationLevel;

  @ApiProperty({
    description: 'User password',
    example: 'securePassword123',
    minLength: 8,
    maxLength: 100,
  })
  @IsString()
  @MinLength(8)
  @MaxLength(100)
  readonly password: string;

  @ApiPropertyOptional({
    description: 'User active status',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;

  @ApiPropertyOptional({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.USER,
    default: UserRole.USER,
  })
  @IsOptional()
  @IsEnum(UserRole)
  readonly role?: UserRole;
}

