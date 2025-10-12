import { UserRole, OrganizationLevel } from '../schemas/user.schema';
export declare class AuthResponseDto {
    access_token: string;
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
