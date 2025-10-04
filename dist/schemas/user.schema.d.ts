import { Document } from 'mongoose';
export type UserDocument = User & Document;
export declare enum UserRole {
    ADMIN = "admin",
    USER = "user",
    MANAGER = "manager",
    SUPERVISOR = "supervisor"
}
export declare enum OrganizationLevel {
    JUNIOR = "junior",
    SENIOR = "senior",
    LEAD = "lead",
    MANAGER = "manager",
    DIRECTOR = "director",
    EXECUTIVE = "executive"
}
export declare class User {
    firstname: string;
    lastname: string;
    nationalcode: string;
    personalcode: string;
    email: string;
    organizationLevel: OrganizationLevel;
    password: string;
    isActive: boolean;
    role: UserRole;
    createdAt: Date;
    updatedAt: Date;
}
export declare const UserSchema: import("mongoose").Schema<User, import("mongoose").Model<User, any, any, any, Document<unknown, any, User, any, {}> & User & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, User, Document<unknown, {}, import("mongoose").FlatRecord<User>, {}, import("mongoose").ResolveSchemaOptions<import("mongoose").DefaultSchemaOptions>> & import("mongoose").FlatRecord<User> & {
    _id: import("mongoose").Types.ObjectId;
} & {
    __v: number;
}>;
