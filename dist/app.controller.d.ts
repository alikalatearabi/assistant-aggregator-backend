import { AppService } from './app.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ChangeRoleDto } from './dto/change-role.dto';
import { User, UserRole, OrganizationLevel } from './schemas/user.schema';
export declare class AppController {
    private readonly appService;
    constructor(appService: AppService);
    getHello(): string;
}
export declare class UserController {
    private readonly appService;
    constructor(appService: AppService);
    createUser(createUserDto: CreateUserDto): Promise<User>;
    findAllUsers(): Promise<User[]>;
    findActiveUsers(): Promise<User[]>;
    findUsersByRole(role: UserRole): Promise<User[]>;
    findUsersByOrganizationLevel(level: OrganizationLevel): Promise<User[]>;
    findUserById(id: string, currentUser: any): Promise<User>;
    findUserByEmail(email: string): Promise<User>;
    findUserByNationalCode(nationalcode: string): Promise<User>;
    findUserByPersonalCode(personalcode: string): Promise<User>;
    updateUser(id: string, updateUserDto: UpdateUserDto, currentUser: any): Promise<User>;
    deactivateUser(id: string): Promise<User>;
    activateUser(id: string): Promise<User>;
    changeUserRole(id: string, changeRoleDto: ChangeRoleDto): Promise<User>;
    deleteUser(id: string): Promise<User>;
}
