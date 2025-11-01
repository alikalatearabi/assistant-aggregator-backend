import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ForbiddenException,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam,
  ApiBody,
  ApiBearerAuth,
  ApiExcludeEndpoint,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { User, UserRole, OrganizationLevel } from './schemas/user.schema';
import { JwtAuthGuard } from './auth/jwt-auth.guard';
import { RolesGuard } from './auth/roles.guard';
import { Roles } from './auth/roles.decorator';
import { GetUser } from './auth/get-user.decorator';

@ApiTags('Application')
@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  @ApiOperation({ 
    summary: 'Health check', 
    description: 'Returns a simple hello message to verify the API is running' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'API is running successfully',
    type: String,
  })
  getHello(): string {
    return this.appService.getHello();
  }
}

@ApiTags('users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UserController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Create a new user', 
    description: 'Creates a new user with the provided information (Admin/Manager only)' 
  })
  @ApiResponse({ 
    status: 201, 
    description: 'User created successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 409, 
    description: 'Conflict - User with email, national code, or personal code already exists' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.appService.createUser(createUserDto);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Get all users', 
    description: 'Retrieves a list of all users (passwords excluded) - Admin/Manager/Supervisor only' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users retrieved successfully', 
    type: [User] 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  async findAllUsers(): Promise<User[]> {
    return this.appService.findAllUsers();
  }

  @Get('active')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiExcludeEndpoint()
  async findActiveUsers(): Promise<User[]> {
    return this.appService.findActiveUsers();
  }

  @Get('role/:role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiExcludeEndpoint()
  async findUsersByRole(@Param('role') role: UserRole): Promise<User[]> {
    return this.appService.findUsersByRole(role);
  }

  @Get('organization-level/:level')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiExcludeEndpoint()
  async findUsersByOrganizationLevel(@Param('level') level: OrganizationLevel): Promise<User[]> {
    return this.appService.findUsersByOrganizationLevel(level);
  }

  @Get(':id')
  @ApiExcludeEndpoint()
  async findUserById(@Param('id') id: string, @GetUser() currentUser: any): Promise<User> {
    // Allow users to access their own profile, or admin/manager to access any profile
    if (currentUser.id !== id && 
        !([UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role))) {
      throw new ForbiddenException('You can only access your own profile');
    }
    return this.appService.findUserById(id);
  }

  @Get('email/:email')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiExcludeEndpoint()
  async findUserByEmail(@Param('email') email: string): Promise<User> {
    return this.appService.findUserByEmail(email);
  }

  @Get('nationalcode/:nationalcode')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiExcludeEndpoint()
  async findUserByNationalCode(@Param('nationalcode') nationalcode: string): Promise<User> {
    return this.appService.findUserByNationalCode(nationalcode);
  }

  @Get('personalcode/:personalcode')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiExcludeEndpoint()
  async findUserByPersonalCode(@Param('personalcode') personalcode: string): Promise<User> {
    return this.appService.findUserByPersonalCode(personalcode);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update user', 
    description: 'Updates user information (own profile or admin/manager access)' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User updated successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid input data' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Can only update own profile unless admin/manager' 
  })
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @GetUser() currentUser: any,
  ): Promise<User> {
    // Allow users to update their own profile, or admin/manager to update any profile
    if (currentUser.id !== id && 
        !([UserRole.ADMIN, UserRole.MANAGER].includes(currentUser.role))) {
      throw new ForbiddenException('You can only update your own profile');
    }
    return this.appService.updateUser(id, updateUserDto);
  }

  @Patch(':id/deactivate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiExcludeEndpoint()
  async deactivateUser(@Param('id') id: string): Promise<User> {
    return this.appService.deactivateUser(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiExcludeEndpoint()
  async activateUser(@Param('id') id: string): Promise<User> {
    return this.appService.activateUser(id);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Change user role', 
    description: 'Updates the user role to the specified value - Admin only' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiBody({ type: ChangeRoleDto })
  @ApiResponse({ 
    status: 200, 
    description: 'User role changed successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 400, 
    description: 'Bad Request - Invalid role' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  async changeUserRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ): Promise<User> {
    return this.appService.changeUserRole(id, changeRoleDto.role);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ 
    summary: 'Delete user', 
    description: 'Permanently removes a user from the system - Admin only' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User deleted successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin access required' 
  })
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.appService.deleteUser(id);
  }
}
