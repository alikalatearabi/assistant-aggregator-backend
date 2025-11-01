import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { ApiProperty } from '@nestjs/swagger';

export type UserDocument = User & Document;

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
}

export enum OrganizationLevel {
  JUNIOR = 'junior',
  SENIOR = 'senior',
  LEAD = 'lead',
  MANAGER = 'manager',
  DIRECTOR = 'director',
  EXECUTIVE = 'executive',
}

@Schema({
  timestamps: true,
})
export class User {
  @ApiProperty({
    description: 'User first name',
    example: 'John',
  })
  @Prop({ required: true })
  firstname: string;

  @ApiProperty({
    description: 'User last name',
    example: 'Doe',
  })
  @Prop({ required: true })
  lastname: string;

  @ApiProperty({
    description: 'User national code (unique identifier)',
    example: '1234567890',
    uniqueItems: true,
  })
  @Prop({ required: true, unique: true })
  nationalcode: string;

  @ApiProperty({
    description: 'User personal code (employee ID)',
    example: 'EMP001',
    uniqueItems: true,
  })
  @Prop({ required: true, unique: true })
  personalcode: string;

  @ApiProperty({
    description: 'User email address',
    example: 'john.doe@company.com',
    uniqueItems: true,
  })
  @Prop({ required: true, unique: true })
  email: string;

  @ApiProperty({
    description: 'User organization level',
    enum: OrganizationLevel,
    example: OrganizationLevel.SENIOR,
  })
  @Prop({ 
    type: String, 
    enum: OrganizationLevel, 
    required: true 
  })
  organizationLevel: OrganizationLevel;

  @ApiProperty({
    description: 'User password (excluded from responses)',
    example: 'securePassword123',
    writeOnly: true,
  })
  @Prop({ required: true, select: false })
  password: string;

  @ApiProperty({
    description: 'User active status',
    example: true,
    default: true,
  })
  @Prop({ default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'API key for programmatic access (optional)',
    example: 'sk_live_abcdefghijklmnop',
    writeOnly: true,
  })
  @Prop({ required: false, unique: true, sparse: true })
  apiKey?: string;

  @ApiProperty({
    description: 'User role in the system',
    enum: UserRole,
    example: UserRole.USER,
    default: UserRole.USER,
  })
  @Prop({ 
    type: String, 
    enum: UserRole, 
    default: UserRole.USER 
  })
  role: UserRole;

  @ApiProperty({
    description: 'User creation timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  createdAt: Date;

  @ApiProperty({
    description: 'User last update timestamp',
    example: '2023-12-01T10:00:00.000Z',
  })
  @Prop({ type: Date, default: Date.now })
  updatedAt: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);

