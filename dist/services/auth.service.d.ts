import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
import { RateLimitService } from '../shared/rate-limit/rate-limit.service';
export declare class AuthService {
    private userModel;
    private jwtService;
    private rateLimitService;
    constructor(userModel: Model<UserDocument>, jwtService: JwtService, rateLimitService: RateLimitService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    validateUser(email: string, password: string): Promise<any>;
    findById(id: string): Promise<User | null>;
    findByApiKey(apiKey: string): Promise<User | null>;
    createApiKeyForUser(userId: string): Promise<string>;
}
