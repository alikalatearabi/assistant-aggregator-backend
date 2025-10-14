import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { getModelToken } from '@nestjs/mongoose';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { User, UserRole, OrganizationLevel } from '../schemas/user.schema';
import { RegisterDto } from '../dto/register.dto';
import { LoginDto } from '../dto/login.dto';
import * as bcrypt from 'bcryptjs';

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

describe('AuthService', () => {
  let service: AuthService;
  let mockUserModel: any;
  let mockJwtService: any;

  const mockUser = {
    _id: 'user123',
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    nationalcode: '1234567890',
    personalcode: 'EMP001',
    organizationLevel: OrganizationLevel.SENIOR,
    password: 'hashedPassword',
    role: UserRole.USER,
    isActive: true,
    save: jest.fn(),
    toObject: jest.fn(),
  };

  beforeEach(async () => {
    // Mock user model
    mockUserModel = {
      findOne: jest.fn(),
      findById: jest.fn(),
    };

    // Mock constructor function
    const MockUserConstructor = jest.fn().mockImplementation((data) => ({
      ...data,
      _id: 'user123',
      isActive: true, // Set default isActive value
      save: jest.fn().mockResolvedValue({
        ...data,
        _id: 'user123',
        isActive: true,
      }),
    }));

    // Add static methods to the constructor
    Object.assign(MockUserConstructor, mockUserModel);

    // Mock JWT service
    mockJwtService = {
      sign: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: MockUserConstructor,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);

    // Reset all mocks
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const registerDto: RegisterDto = {
      firstname: 'John',
      lastname: 'Doe',
      email: 'john.doe@example.com',
      nationalcode: '1234567890',
      personalcode: 'EMP001',
      organizationLevel: OrganizationLevel.SENIOR,
      password: 'password123',
      role: UserRole.USER,
    };

    it('should successfully register a new user', async () => {
      // Mock no existing user found
      mockUserModel.findOne.mockResolvedValue(null);
      
      // Mock bcrypt hash
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      
      // Mock JWT sign
      const mockToken = 'mockJwtToken';
      mockJwtService.sign.mockReturnValue(mockToken);

      const result = await service.register(registerDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({
        $or: [
          { email: registerDto.email },
          { nationalcode: registerDto.nationalcode },
          { personalcode: registerDto.personalcode },
        ],
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 12);
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: 'user123',
        email: registerDto.email,
        role: registerDto.role,
        nationalcode: registerDto.nationalcode,
        personalcode: registerDto.personalcode,
      });

      expect(result).toEqual({
        access_token: mockToken,
        user: {
          id: 'user123',
          firstname: registerDto.firstname,
          lastname: registerDto.lastname,
          email: registerDto.email,
          nationalcode: registerDto.nationalcode,
          personalcode: registerDto.personalcode,
          organizationLevel: registerDto.organizationLevel,
          role: registerDto.role,
          isActive: true,
        },
      });
    });

    it('should throw ConflictException when email already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({
        email: registerDto.email,
        nationalcode: 'different',
        personalcode: 'different',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Email already exists'),
      );
    });

    it('should throw ConflictException when national code already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({
        email: 'different@email.com',
        nationalcode: registerDto.nationalcode,
        personalcode: 'different',
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('National code already exists'),
      );
    });

    it('should throw ConflictException when personal code already exists', async () => {
      mockUserModel.findOne.mockResolvedValue({
        email: 'different@email.com',
        nationalcode: 'different',
        personalcode: registerDto.personalcode,
      });

      await expect(service.register(registerDto)).rejects.toThrow(
        new ConflictException('Personal code already exists'),
      );
    });

    it('should use default USER role when role is not provided', async () => {
      const registerDtoWithoutRole = { ...registerDto };
      delete registerDtoWithoutRole.role;

      mockUserModel.findOne.mockResolvedValue(null);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
      mockJwtService.sign.mockReturnValue('mockToken');

      await service.register(registerDtoWithoutRole);

      expect(mockJwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({
          role: UserRole.USER,
        }),
      );
    });
  });

  describe('login', () => {
    const loginDto: LoginDto = {
      email: 'john.doe@example.com',
      password: 'password123',
    };

    it('should successfully login with valid credentials', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      mockJwtService.sign.mockReturnValue('mockJwtToken');

      const result = await service.login(loginDto);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUserWithPassword.password,
      );
      expect(mockJwtService.sign).toHaveBeenCalledWith({
        sub: mockUser._id,
        email: mockUser.email,
        role: mockUser.role,
        nationalcode: mockUser.nationalcode,
        personalcode: mockUser.personalcode,
      });

      expect(result).toEqual({
        access_token: 'mockJwtToken',
        user: {
          id: mockUser._id,
          firstname: mockUser.firstname,
          lastname: mockUser.lastname,
          email: mockUser.email,
          nationalcode: mockUser.nationalcode,
          personalcode: mockUser.personalcode,
          organizationLevel: mockUser.organizationLevel,
          role: mockUser.role,
          isActive: mockUser.isActive,
        },
      });
    });

    it('should throw UnauthorizedException when user does not exist', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });

    it('should throw UnauthorizedException when user is inactive', async () => {
      const inactiveUser = {
        ...mockUser,
        isActive: false,
        password: 'hashedPassword',
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(inactiveUser),
      });

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Account is deactivated'),
      );
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(service.login(loginDto)).rejects.toThrow(
        new UnauthorizedException('Invalid credentials'),
      );
    });
  });

  describe('validateUser', () => {
    const email = 'john.doe@example.com';
    const password = 'password123';

    it('should return user without password when validation succeeds', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
        toObject: jest.fn().mockReturnValue({
          ...mockUser,
          password: 'hashedPassword',
        }),
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await service.validateUser(email, password);

      expect(mockUserModel.findOne).toHaveBeenCalledWith({ email });
      expect(bcrypt.compare).toHaveBeenCalledWith(password, 'hashedPassword');
      expect(result).toEqual({
        _id: mockUser._id,
        firstname: mockUser.firstname,
        lastname: mockUser.lastname,
        email: mockUser.email,
        nationalcode: mockUser.nationalcode,
        personalcode: mockUser.personalcode,
        organizationLevel: mockUser.organizationLevel,
        role: mockUser.role,
        isActive: mockUser.isActive,
        save: expect.any(Function),
        toObject: expect.any(Function),
      });
      expect(result).not.toHaveProperty('password');
    });

    it('should return null when user does not exist', async () => {
      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(null),
      });

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });

    it('should return null when password is invalid', async () => {
      const mockUserWithPassword = {
        ...mockUser,
        password: 'hashedPassword',
      };

      mockUserModel.findOne.mockReturnValue({
        select: jest.fn().mockResolvedValue(mockUserWithPassword),
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser(email, password);

      expect(result).toBeNull();
    });
  });

  describe('findById', () => {
    const userId = 'user123';

    it('should return user when found', async () => {
      mockUserModel.findById.mockResolvedValue(mockUser);

      const result = await service.findById(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockUser);
    });

    it('should return null when user not found', async () => {
      mockUserModel.findById.mockResolvedValue(null);

      const result = await service.findById(userId);

      expect(mockUserModel.findById).toHaveBeenCalledWith(userId);
      expect(result).toBeNull();
    });
  });
});