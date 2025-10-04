import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { AppService } from './app.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { User, UserRole, OrganizationLevel } from './schemas/user.schema';

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
export class UserController {
  constructor(private readonly appService: AppService) {}

  @Post()
  @ApiOperation({ 
    summary: 'Create a new user', 
    description: 'Creates a new user with the provided information' 
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
  async createUser(@Body() createUserDto: CreateUserDto): Promise<User> {
    return this.appService.createUser(createUserDto);
  }

  @Get()
  @ApiOperation({ 
    summary: 'Get all users', 
    description: 'Retrieves a list of all users (passwords excluded)' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of users retrieved successfully', 
    type: [User] 
  })
  async findAllUsers(): Promise<User[]> {
    return this.appService.findAllUsers();
  }

  @Get('active')
  @ApiOperation({ 
    summary: 'Get active users', 
    description: 'Retrieves a list of all active users' 
  })
  @ApiResponse({ 
    status: 200, 
    description: 'List of active users retrieved successfully', 
    type: [User] 
  })
  async findActiveUsers(): Promise<User[]> {
    return this.appService.findActiveUsers();
  }

  @Get('role/:role')
  @ApiOperation({ 
    summary: 'Get users by role', 
    description: 'Retrieves all users with the specified role' 
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
  async findUsersByRole(@Param('role') role: UserRole): Promise<User[]> {
    return this.appService.findUsersByRole(role);
  }

  @Get('organization-level/:level')
  @ApiOperation({ 
    summary: 'Get users by organization level', 
    description: 'Retrieves all users with the specified organization level' 
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
  async findUsersByOrganizationLevel(@Param('level') level: OrganizationLevel): Promise<User[]> {
    return this.appService.findUsersByOrganizationLevel(level);
  }

  @Get(':id')
  @ApiOperation({ 
    summary: 'Get user by ID', 
    description: 'Retrieves a specific user by their MongoDB ObjectId' 
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
  async findUserById(@Param('id') id: string): Promise<User> {
    return this.appService.findUserById(id);
  }

  @Get('email/:email')
  @ApiOperation({ 
    summary: 'Get user by email', 
    description: 'Retrieves a specific user by their email address' 
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
  async findUserByEmail(@Param('email') email: string): Promise<User> {
    return this.appService.findUserByEmail(email);
  }

  @Get('nationalcode/:nationalcode')
  @ApiOperation({ 
    summary: 'Get user by national code', 
    description: 'Retrieves a specific user by their national code' 
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
  async findUserByNationalCode(@Param('nationalcode') nationalcode: string): Promise<User> {
    return this.appService.findUserByNationalCode(nationalcode);
  }

  @Get('personalcode/:personalcode')
  @ApiOperation({ 
    summary: 'Get user by personal code', 
    description: 'Retrieves a specific user by their personal code (employee ID)' 
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
  async findUserByPersonalCode(@Param('personalcode') personalcode: string): Promise<User> {
    return this.appService.findUserByPersonalCode(personalcode);
  }

  @Patch(':id')
  @ApiOperation({ 
    summary: 'Update user', 
    description: 'Updates user information with the provided data' 
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
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<User> {
    return this.appService.updateUser(id, updateUserDto);
  }

  @Patch(':id/deactivate')
  @ApiOperation({ 
    summary: 'Deactivate user', 
    description: 'Sets the user status to inactive' 
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
  async deactivateUser(@Param('id') id: string): Promise<User> {
    return this.appService.deactivateUser(id);
  }

  @Patch(':id/activate')
  @ApiOperation({ 
    summary: 'Activate user', 
    description: 'Sets the user status to active' 
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
  async activateUser(@Param('id') id: string): Promise<User> {
    return this.appService.activateUser(id);
  }

  @Patch(':id/role')
  @ApiOperation({ 
    summary: 'Change user role', 
    description: 'Updates the user role to the specified value' 
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
  async changeUserRole(
    @Param('id') id: string,
    @Body() changeRoleDto: ChangeRoleDto,
  ): Promise<User> {
    return this.appService.changeUserRole(id, changeRoleDto.role);
  }

  @Delete(':id')
  @ApiOperation({ 
    summary: 'Delete user', 
    description: 'Permanently removes a user from the system' 
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
  async deleteUser(@Param('id') id: string): Promise<User> {
    return this.appService.deleteUser(id);
  }
}
