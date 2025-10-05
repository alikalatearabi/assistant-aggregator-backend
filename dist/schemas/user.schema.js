"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = exports.User = exports.OrganizationLevel = exports.UserRole = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const swagger_1 = require("@nestjs/swagger");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "admin";
    UserRole["USER"] = "user";
    UserRole["MANAGER"] = "manager";
    UserRole["SUPERVISOR"] = "supervisor";
})(UserRole || (exports.UserRole = UserRole = {}));
var OrganizationLevel;
(function (OrganizationLevel) {
    OrganizationLevel["JUNIOR"] = "junior";
    OrganizationLevel["SENIOR"] = "senior";
    OrganizationLevel["LEAD"] = "lead";
    OrganizationLevel["MANAGER"] = "manager";
    OrganizationLevel["DIRECTOR"] = "director";
    OrganizationLevel["EXECUTIVE"] = "executive";
})(OrganizationLevel || (exports.OrganizationLevel = OrganizationLevel = {}));
let User = class User {
    firstname;
    lastname;
    nationalcode;
    personalcode;
    email;
    organizationLevel;
    password;
    isActive;
    role;
    createdAt;
    updatedAt;
};
exports.User = User;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User first name',
        example: 'John',
    }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "firstname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User last name',
        example: 'Doe',
    }),
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "lastname", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User national code (unique identifier)',
        example: '1234567890',
        uniqueItems: true,
    }),
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "nationalcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User personal code (employee ID)',
        example: 'EMP001',
        uniqueItems: true,
    }),
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "personalcode", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User email address',
        example: 'john.doe@company.com',
        uniqueItems: true,
    }),
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User organization level',
        enum: OrganizationLevel,
        example: OrganizationLevel.SENIOR,
    }),
    (0, mongoose_1.Prop)({
        type: String,
        enum: OrganizationLevel,
        required: true
    }),
    __metadata("design:type", String)
], User.prototype, "organizationLevel", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User password (excluded from responses)',
        example: 'securePassword123',
        writeOnly: true,
    }),
    (0, mongoose_1.Prop)({ required: true, select: false }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User active status',
        example: true,
        default: true,
    }),
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User role in the system',
        enum: UserRole,
        example: UserRole.USER,
        default: UserRole.USER,
    }),
    (0, mongoose_1.Prop)({
        type: String,
        enum: UserRole,
        default: UserRole.USER
    }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User creation timestamp',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'User last update timestamp',
        example: '2023-12-01T10:00:00.000Z',
    }),
    (0, mongoose_1.Prop)({ type: Date, default: Date.now }),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({
        timestamps: true,
    })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
//# sourceMappingURL=user.schema.js.map