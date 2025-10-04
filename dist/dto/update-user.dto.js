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
exports.UpdateUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const user_schema_1 = require("../schemas/user.schema");
class UpdateUserDto {
    firstname;
    lastname;
    nationalcode;
    personalcode;
    email;
    organizationLevel;
    password;
    isActive;
    role;
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User first name',
        example: 'John',
        minLength: 1,
        maxLength: 50,
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "firstname", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User last name',
        example: 'Doe',
        minLength: 1,
        maxLength: 50,
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "lastname", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User national code (unique identifier)',
        example: '1234567890',
        minLength: 10,
        maxLength: 10,
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "nationalcode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User personal code (employee ID)',
        example: 'EMP001',
        minLength: 1,
        maxLength: 20,
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "personalcode", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User email address',
        example: 'john.doe@company.com',
        format: 'email',
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User organization level',
        enum: user_schema_1.OrganizationLevel,
        example: user_schema_1.OrganizationLevel.SENIOR,
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "organizationLevel", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User password',
        example: 'securePassword123',
        minLength: 8,
        maxLength: 100,
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User active status',
        example: true,
    }),
    __metadata("design:type", Boolean)
], UpdateUserDto.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiPropertyOptional)({
        description: 'User role in the system',
        enum: user_schema_1.UserRole,
        example: user_schema_1.UserRole.USER,
    }),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "role", void 0);
//# sourceMappingURL=update-user.dto.js.map