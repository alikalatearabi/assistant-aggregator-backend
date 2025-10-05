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
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
const user_schema_1 = require("./schemas/user.schema");
let AppService = class AppService {
    userModel;
    constructor(userModel) {
        this.userModel = userModel;
    }
    getHello() {
        return 'Hello World! MongoDB with Mongoose is configured with enhanced User entity.';
    }
    async createUser(createUserDto) {
        const existingUser = await this.userModel.findOne({
            $or: [
                { email: createUserDto.email },
                { nationalcode: createUserDto.nationalcode },
                { personalcode: createUserDto.personalcode }
            ]
        }).exec();
        if (existingUser) {
            throw new common_1.ConflictException('User with this email, national code, or personal code already exists');
        }
        const createdUser = new this.userModel(createUserDto);
        const savedUser = await createdUser.save();
        const userWithoutPassword = await this.userModel.findById(savedUser._id).select('-password').exec();
        if (!userWithoutPassword) {
            throw new common_1.NotFoundException('Failed to retrieve created user');
        }
        return userWithoutPassword;
    }
    async findAllUsers() {
        return this.userModel.find().select('-password').exec();
    }
    async findUserById(id) {
        const user = await this.userModel.findById(id).select('-password').exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async updateUser(id, updateUserDto) {
        const user = await this.userModel
            .findByIdAndUpdate(id, updateUserDto, { new: true })
            .select('-password')
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async deleteUser(id) {
        const user = await this.userModel.findByIdAndDelete(id).select('-password').exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findUserByEmail(email) {
        const user = await this.userModel.findOne({ email }).select('-password').exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findUserByNationalCode(nationalcode) {
        const user = await this.userModel.findOne({ nationalcode }).select('-password').exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findUserByPersonalCode(personalcode) {
        const user = await this.userModel.findOne({ personalcode }).select('-password').exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async findUsersByRole(role) {
        return this.userModel.find({ role }).select('-password').exec();
    }
    async findUsersByOrganizationLevel(organizationLevel) {
        return this.userModel.find({ organizationLevel }).select('-password').exec();
    }
    async findActiveUsers() {
        return this.userModel.find({ isActive: true }).select('-password').exec();
    }
    async deactivateUser(id) {
        const user = await this.userModel
            .findByIdAndUpdate(id, { isActive: false }, { new: true })
            .select('-password')
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async activateUser(id) {
        const user = await this.userModel
            .findByIdAndUpdate(id, { isActive: true }, { new: true })
            .select('-password')
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
    async changeUserRole(id, role) {
        const user = await this.userModel
            .findByIdAndUpdate(id, { role }, { new: true })
            .select('-password')
            .exec();
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        return user;
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, mongoose_1.InjectModel)(user_schema_1.User.name)),
    __metadata("design:paramtypes", [mongoose_2.Model])
], AppService);
//# sourceMappingURL=app.service.js.map