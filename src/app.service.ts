import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole, OrganizationLevel } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class AppService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

  getHello(): string {
    return 'Hello World! MongoDB with Mongoose is configured with enhanced User entity.';
  }

  async createUser(createUserDto: CreateUserDto): Promise<User> {
    // Check for existing user with same email, nationalcode, or personalcode
    const existingUser = await this.userModel.findOne({
      $or: [
        { email: createUserDto.email },
        { nationalcode: createUserDto.nationalcode },
        { personalcode: createUserDto.personalcode }
      ]
    }).exec();

    if (existingUser) {
      throw new ConflictException('User with this email, national code, or personal code already exists');
    }

    const createdUser = new this.userModel(createUserDto);
    return createdUser.save();
  }

  async findAllUsers(): Promise<User[]> {
    return this.userModel.find().select('-password').exec();
  }

  async findUserById(id: string): Promise<User> {
    const user = await this.userModel.findById(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .select('-password')
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async deleteUser(id: string): Promise<User> {
    const user = await this.userModel.findByIdAndDelete(id).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByEmail(email: string): Promise<User> {
    const user = await this.userModel.findOne({ email }).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByNationalCode(nationalcode: string): Promise<User> {
    const user = await this.userModel.findOne({ nationalcode }).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUserByPersonalCode(personalcode: string): Promise<User> {
    const user = await this.userModel.findOne({ personalcode }).select('-password').exec();
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async findUsersByRole(role: UserRole): Promise<User[]> {
    return this.userModel.find({ role }).select('-password').exec();
  }

  async findUsersByOrganizationLevel(organizationLevel: OrganizationLevel): Promise<User[]> {
    return this.userModel.find({ organizationLevel }).select('-password').exec();
  }

  async findActiveUsers(): Promise<User[]> {
    return this.userModel.find({ isActive: true }).select('-password').exec();
  }

  async deactivateUser(id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .select('-password')
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async activateUser(id: string): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .select('-password')
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }

  async changeUserRole(id: string, role: UserRole): Promise<User> {
    const user = await this.userModel
      .findByIdAndUpdate(id, { role }, { new: true })
      .select('-password')
      .exec();
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return user;
  }
}
