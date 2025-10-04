import { UserRole, OrganizationLevel } from '../schemas/user.schema';
export declare class UpdateUserDto {
    readonly firstname?: string;
    readonly lastname?: string;
    readonly nationalcode?: string;
    readonly personalcode?: string;
    readonly email?: string;
    readonly organizationLevel?: OrganizationLevel;
    readonly password?: string;
    readonly isActive?: boolean;
    readonly role?: UserRole;
}
