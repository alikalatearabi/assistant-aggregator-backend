import { UserRole, OrganizationLevel } from '../schemas/user.schema';
export declare class RegisterDto {
    firstname: string;
    lastname: string;
    nationalcode: string;
    personalcode: string;
    email: string;
    organizationLevel: OrganizationLevel;
    password: string;
    role?: UserRole;
}
