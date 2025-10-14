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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = exports.AppController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_service_1 = require("./app.service");
const create_user_dto_1 = require("./dto/create-user.dto");
const update_user_dto_1 = require("./dto/update-user.dto");
const change_role_dto_1 = require("./dto/change-role.dto");
const user_schema_1 = require("./schemas/user.schema");
const jwt_auth_guard_1 = require("./auth/jwt-auth.guard");
const roles_guard_1 = require("./auth/roles.guard");
const roles_decorator_1 = require("./auth/roles.decorator");
const get_user_decorator_1 = require("./auth/get-user.decorator");
let AppController = class AppController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    getHello() {
        return this.appService.getHello();
    }
};
exports.AppController = AppController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({
        summary: 'Health check',
        description: 'Returns a simple hello message to verify the API is running'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'API is running successfully',
        type: String,
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", String)
], AppController.prototype, "getHello", null);
exports.AppController = AppController = __decorate([
    (0, swagger_1.ApiTags)('Application'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], AppController);
let UserController = class UserController {
    appService;
    constructor(appService) {
        this.appService = appService;
    }
    async createUser(createUserDto) {
        return this.appService.createUser(createUserDto);
    }
    async findAllUsers() {
        return this.appService.findAllUsers();
    }
    async findActiveUsers() {
        return this.appService.findActiveUsers();
    }
    async findUsersByRole(role) {
        return this.appService.findUsersByRole(role);
    }
    async findUsersByOrganizationLevel(level) {
        return this.appService.findUsersByOrganizationLevel(level);
    }
    async findUserById(id, currentUser) {
        if (currentUser.id !== id &&
            !([user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER].includes(currentUser.role))) {
            throw new common_1.ForbiddenException('You can only access your own profile');
        }
        return this.appService.findUserById(id);
    }
    async findUserByEmail(email) {
        return this.appService.findUserByEmail(email);
    }
    async findUserByNationalCode(nationalcode) {
        return this.appService.findUserByNationalCode(nationalcode);
    }
    async findUserByPersonalCode(personalcode) {
        return this.appService.findUserByPersonalCode(personalcode);
    }
    async updateUser(id, updateUserDto, currentUser) {
        if (currentUser.id !== id &&
            !([user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER].includes(currentUser.role))) {
            throw new common_1.ForbiddenException('You can only update your own profile');
        }
        return this.appService.updateUser(id, updateUserDto);
    }
    async deactivateUser(id) {
        return this.appService.deactivateUser(id);
    }
    async activateUser(id) {
        return this.appService.activateUser(id);
    }
    async changeUserRole(id, changeRoleDto) {
        return this.appService.changeUserRole(id, changeRoleDto.role);
    }
    async deleteUser(id) {
        return this.appService.deleteUser(id);
    }
};
exports.UserController = UserController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER),
    (0, swagger_1.ApiOperation)({
        summary: 'Create a new user',
        description: 'Creates a new user with the provided information (Admin/Manager only)'
    }),
    (0, swagger_1.ApiResponse)({
        status: 201,
        description: 'User created successfully',
        type: user_schema_1.User
    }),
    (0, swagger_1.ApiResponse)({
        status: 409,
        description: 'Conflict - User with email, national code, or personal code already exists'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid input data'
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - Insufficient permissions'
    }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [create_user_dto_1.CreateUserDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "createUser", null);
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER, user_schema_1.UserRole.SUPERVISOR),
    (0, swagger_1.ApiOperation)({
        summary: 'Get all users',
        description: 'Retrieves a list of all users (passwords excluded) - Admin/Manager/Supervisor only'
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'List of users retrieved successfully',
        type: [user_schema_1.User]
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - Insufficient permissions'
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findAllUsers", null);
__decorate([
    (0, common_1.Get)('active'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER, user_schema_1.UserRole.SUPERVISOR),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findActiveUsers", null);
__decorate([
    (0, common_1.Get)('role/:role'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER, user_schema_1.UserRole.SUPERVISOR),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('role')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findUsersByRole", null);
__decorate([
    (0, common_1.Get)('organization-level/:level'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER, user_schema_1.UserRole.SUPERVISOR),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('level')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findUsersByOrganizationLevel", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findUserById", null);
__decorate([
    (0, common_1.Get)('email/:email'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findUserByEmail", null);
__decorate([
    (0, common_1.Get)('nationalcode/:nationalcode'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('nationalcode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findUserByNationalCode", null);
__decorate([
    (0, common_1.Get)('personalcode/:personalcode'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('personalcode')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "findUserByPersonalCode", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, swagger_1.ApiOperation)({
        summary: 'Update user',
        description: 'Updates user information (own profile or admin/manager access)'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'User MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User updated successfully',
        type: user_schema_1.User
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'User not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid input data'
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - Can only update own profile unless admin/manager'
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, get_user_decorator_1.GetUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, update_user_dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Patch)(':id/deactivate'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deactivateUser", null);
__decorate([
    (0, common_1.Patch)(':id/activate'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN, user_schema_1.UserRole.MANAGER),
    (0, swagger_1.ApiExcludeEndpoint)(),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "activateUser", null);
__decorate([
    (0, common_1.Patch)(':id/role'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Change user role',
        description: 'Updates the user role to the specified value - Admin only'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'User MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiBody)({ type: change_role_dto_1.ChangeRoleDto }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User role changed successfully',
        type: user_schema_1.User
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'User not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 400,
        description: 'Bad Request - Invalid role'
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - Admin access required'
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, change_role_dto_1.ChangeRoleDto]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "changeUserRole", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.UseGuards)(roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(user_schema_1.UserRole.ADMIN),
    (0, swagger_1.ApiOperation)({
        summary: 'Delete user',
        description: 'Permanently removes a user from the system - Admin only'
    }),
    (0, swagger_1.ApiParam)({
        name: 'id',
        description: 'User MongoDB ObjectId',
        example: '507f1f77bcf86cd799439011',
    }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'User deleted successfully',
        type: user_schema_1.User
    }),
    (0, swagger_1.ApiResponse)({
        status: 404,
        description: 'User not found'
    }),
    (0, swagger_1.ApiResponse)({
        status: 403,
        description: 'Forbidden - Admin access required'
    }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], UserController.prototype, "deleteUser", null);
exports.UserController = UserController = __decorate([
    (0, swagger_1.ApiTags)('users'),
    (0, common_1.Controller)('users'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [app_service_1.AppService])
], UserController);
//# sourceMappingURL=app.controller.js.map