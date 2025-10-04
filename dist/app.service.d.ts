import { Model } from 'mongoose';
import { User, UserDocument, UserRole, OrganizationLevel } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class AppService {
    private userModel;
    constructor(userModel: Model<UserDocument>);
    getHello(): string;
    createUser(createUserDto: CreateUserDto): Promise<User>;
    findAllUsers(): Promise<User[]>;
    findUserById(id: string): Promise<User>;
    updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User>;
    deleteUser(id: string): Promise<User>;
    findUserByEmail(email: string): Promise<User>;
    findUserByNationalCode(nationalcode: string): Promise<User>;
    findUserByPersonalCode(personalcode: string): Promise<User>;
    findUsersByRole(role: UserRole): Promise<User[]>;
    findUsersByOrganizationLevel(organizationLevel: OrganizationLevel): Promise<User[]>;
    findActiveUsers(): Promise<User[]>;
    deactivateUser(id: string): Promise<User>;
    activateUser(id: string): Promise<User>;
    changeUserRole(id: string, role: UserRole): Promise<User>;
}
