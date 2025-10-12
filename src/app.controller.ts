import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
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
  @ApiOperation({ 
    summary: 'Get active users', 
    description: 'Retrieves a list of all active users - Admin/Manager/Supervisor only' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of active users retrieved successfully', 
    type: [User] 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  async findActiveUsers(): Promise<User[]> {
    return this.appService.findActiveUsers();
  }

  @Get('role/:role')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Get users by role', 
    description: 'Retrieves all users with the specified role - Admin/Manager/Supervisor only' 
  })
  @ApiParam({ 
    name: 'role', 
    enum: UserRole, 
    description: 'User role to filter by',
    example: UserRole.USER,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users with specified role', 
    type: [User] 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  async findUsersByRole(@Param('role') role: UserRole): Promise<User[]> {
    return this.appService.findUsersByRole(role);
  }

  @Get('organization-level/:level')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.SUPERVISOR)
  @ApiOperation({ 
    summary: 'Get users by organization level', 
    description: 'Retrieves all users with the specified organization level - Admin/Manager/Supervisor only' 
  })
  @ApiParam({ 
    name: 'level', 
    enum: OrganizationLevel, 
    description: 'Organization level to filter by',
    example: OrganizationLevel.SENIOR,
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users with specified organization level', 
    type: [User] 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  async findUsersByOrganizationLevel(@Param('level') level: OrganizationLevel): Promise<User[]> {
    return this.appService.findUsersByOrganizationLevel(level);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user by ID', 
    description: 'Retrieves a specific user by their MongoDB ObjectId (own profile or admin/manager access)' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User found successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Can only access own profile unless admin/manager' 
  })
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
  @ApiOperation({ 
    summary: 'Get user by email', 
    description: 'Retrieves a specific user by their email address - Admin/Manager only' 
  })
  @ApiParam({ 
    name: 'email', 
    description: 'User email address',
    example: 'john.doe@company.com',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User found successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin/Manager access required' 
  })
  async findUserByEmail(@Param('email') email: string): Promise<User> {
    return this.appService.findUserByEmail(email);
  }

  @Get('nationalcode/:nationalcode')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get user by national code', 
    description: 'Retrieves a specific user by their national code - Admin/Manager only' 
  })
  @ApiParam({ 
    name: 'nationalcode', 
    description: 'User national code',
    example: '1234567890',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User found successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin/Manager access required' 
  })
  async findUserByNationalCode(@Param('nationalcode') nationalcode: string): Promise<User> {
    return this.appService.findUserByNationalCode(nationalcode);
  }

  @Get('personalcode/:personalcode')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Get user by personal code', 
    description: 'Retrieves a specific user by their personal code (employee ID) - Admin/Manager only' 
  })
  @ApiParam({ 
    name: 'personalcode', 
    description: 'User personal code (employee ID)',
    example: 'EMP001',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User found successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Admin/Manager access required' 
  })
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
  @ApiOperation({ 
    summary: 'Deactivate user', 
    description: 'Sets the user status to inactive - Admin/Manager only' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User deactivated successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
  async deactivateUser(@Param('id') id: string): Promise<User> {
    return this.appService.deactivateUser(id);
  }

  @Patch(':id/activate')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ 
    summary: 'Activate user', 
    description: 'Sets the user status to active - Admin/Manager only' 
  })
  @ApiParam({ 
    name: 'id', 
    description: 'User MongoDB ObjectId',
    example: '507f1f77bcf86cd799439011',
  })
  @ApiResponse({ 
    status: 200, 
    description: 'User activated successfully', 
    type: User 
  })
  @ApiResponse({ 
    status: 404, 
    description: 'User not found' 
  })
  @ApiResponse({ 
    status: 403, 
    description: 'Forbidden - Insufficient permissions' 
  })
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
