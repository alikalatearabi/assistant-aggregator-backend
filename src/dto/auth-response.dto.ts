import { ApiProperty } from '@nestjs/swagger';
import { UserRole, OrganizationLevel } from '../schemas/user.schema';

export class AuthResponseDto {
  @ApiProperty({
    description: 'JWT access token',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
  })
  access_token: string;

  @ApiProperty({
    description: 'User information',
  })
  user: {
    id: string;
    firstname: string;
    lastname: string;
    email: string;
    nationalcode: string;
    personalcode: string;
    organizationLevel: OrganizationLevel;
    role: UserRole;
    isActive: boolean;
  };
}
