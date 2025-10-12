import { AuthService } from '../services/auth.service';
import { LoginDto } from '../dto/login.dto';
import { RegisterDto } from '../dto/register.dto';
import { AuthResponseDto } from '../dto/auth-response.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    register(registerDto: RegisterDto): Promise<AuthResponseDto>;
    login(loginDto: LoginDto): Promise<AuthResponseDto>;
    getProfile(user: any): Promise<{
        id: any;
        firstname: any;
        lastname: any;
        email: any;
        nationalcode: any;
        personalcode: any;
        organizationLevel: any;
        role: any;
        isActive: any;
        createdAt: any;
        updatedAt: any;
    }>;
}
