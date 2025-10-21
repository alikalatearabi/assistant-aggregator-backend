import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { User, UserDocument, UserRole } from '../schemas/user.schema';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponseDto> {
    const { email, nationalcode, personalcode, password, ...userData } = registerDto;

    // Check if user already exists
    const existingUser = await this.userModel.findOne({
      $or: [
        { email },
        { nationalcode },
        { personalcode }
      ]
    });

    if (existingUser) {
      if (existingUser.email === email) {
        throw new ConflictException('Email already exists');
      }
      if (existingUser.nationalcode === nationalcode) {
        throw new ConflictException('National code already exists');
      }
      if (existingUser.personalcode === personalcode) {
        throw new ConflictException('Personal code already exists');
      }
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = new this.userModel({
      ...userData,
      email,
      nationalcode,
      personalcode,
      password: hashedPassword,
      role: registerDto.role || UserRole.USER,
    });

    await user.save();

    // Generate JWT token
    const payload = { 
      sub: user._id, 
      email: user.email,
      role: user.role,
      nationalcode: user.nationalcode,
      personalcode: user.personalcode
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: (user._id as any).toString(),
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        nationalcode: user.nationalcode,
        personalcode: user.personalcode,
        organizationLevel: user.organizationLevel,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    const { email, password } = loginDto;

    // Find user by email and include password field
    const user = await this.userModel.findOne({ email }).select('+password');
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Generate JWT token
    const payload = { 
      sub: user._id, 
      email: user.email,
      role: user.role,
      nationalcode: user.nationalcode,
      personalcode: user.personalcode
    };
    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: (user._id as any).toString(),
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        nationalcode: user.nationalcode,
        personalcode: user.personalcode,
        organizationLevel: user.organizationLevel,
        role: user.role,
        isActive: user.isActive,
      },
    };
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userModel.findOne({ email }).select('+password');
    if (user && await bcrypt.compare(password, user.password)) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async findById(id: string): Promise<User | null> {
    return this.userModel.findById(id);
  }

  async findByApiKey(apiKey: string): Promise<User | null> {
    return this.userModel.findOne({ apiKey });
  }

  /**
   * Create and assign an API key for a user.
   * Returns the generated key.
   */
  async createApiKeyForUser(userId: string): Promise<string> {
    const crypto = await import('crypto');
    const apiKey = 'sk_' + crypto.randomBytes(24).toString('hex');

    await this.userModel.findByIdAndUpdate(userId, { apiKey });
    return apiKey;
  }
}
