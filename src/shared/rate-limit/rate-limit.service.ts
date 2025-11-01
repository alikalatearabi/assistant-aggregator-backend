import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../users/schemas/user.schema';

export enum RateLimitType {
  LOGIN = 'login',
  MESSAGE = 'message',
}

export interface RateLimitConfig {
  maxCount: number;
  windowMs: number; // window in milliseconds
}

@Injectable()
export class RateLimitService {
  private readonly rateLimitConfigs: Record<RateLimitType, RateLimitConfig>;

  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private configService: ConfigService,
  ) {
    // Load rate limit configuration from environment variables
    const loginMaxCount = this.configService.get<number>('RATE_LIMIT_LOGIN_MAX', 10);
    const loginWindowHours = this.configService.get<number>('RATE_LIMIT_LOGIN_WINDOW_HOURS', 1);
    const messageMaxCount = this.configService.get<number>('RATE_LIMIT_MESSAGE_MAX', 50);
    const messageWindowHours = this.configService.get<number>('RATE_LIMIT_MESSAGE_WINDOW_HOURS', 1);

    this.rateLimitConfigs = {
      [RateLimitType.LOGIN]: {
        maxCount: loginMaxCount,
        windowMs: loginWindowHours * 60 * 60 * 1000,
      },
      [RateLimitType.MESSAGE]: {
        maxCount: messageMaxCount,
        windowMs: messageWindowHours * 60 * 60 * 1000,
      },
    };
  }

  /**
   * Check if user has exceeded rate limit for a given action
   * @param userId - User ID
   * @param type - Type of rate limit to check
   * @throws HttpException if rate limit exceeded
   */
  async checkRateLimit(userId: string, type: RateLimitType): Promise<void> {
    const config = this.rateLimitConfigs[type];
    const now = new Date();

    // Get user with rate limit data
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Get current rate limit data based on type
    const rateLimitData = type === RateLimitType.LOGIN 
      ? user.loginRateLimit 
      : user.messageRateLimit;

    // Initialize if undefined
    const currentCount = rateLimitData?.count || 0;
    const resetAt = rateLimitData?.resetAt || new Date();

    // Check if window has expired - reset if so
    const timeSinceReset = now.getTime() - new Date(resetAt).getTime();
    if (timeSinceReset >= config.windowMs) {
      // Reset the counter
      await this.resetRateLimit(userId, type);
      return; // Allow the action
    }

    // Check if limit is exceeded
    if (currentCount >= config.maxCount) {
      const remainingTime = Math.ceil((config.windowMs - timeSinceReset) / 1000 / 60); // in minutes
      throw new HttpException(
        `Rate limit exceeded. Please try again in ${remainingTime} minute(s).`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  /**
   * Increment the rate limit counter for a user action
   * @param userId - User ID
   * @param type - Type of rate limit to increment
   */
  async incrementRateLimit(userId: string, type: RateLimitType): Promise<void> {
    const now = new Date();
    
    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    // Get current rate limit data
    const rateLimitData = type === RateLimitType.LOGIN 
      ? user.loginRateLimit 
      : user.messageRateLimit;

    const currentCount = rateLimitData?.count || 0;
    const resetAt = rateLimitData?.resetAt || new Date();

    // Check if window has expired - reset if so
    const timeSinceReset = now.getTime() - new Date(resetAt).getTime();
    const config = this.rateLimitConfigs[type];
    
    if (timeSinceReset >= config.windowMs) {
      // Reset the counter and set to 1
      await this.resetRateLimit(userId, type);
      await this.userModel.findByIdAndUpdate(userId, {
        [type === RateLimitType.LOGIN ? 'loginRateLimit.count' : 'messageRateLimit.count']: 1,
      });
    } else {
      // Increment the counter
      await this.userModel.findByIdAndUpdate(userId, {
        [type === RateLimitType.LOGIN ? 'loginRateLimit.count' : 'messageRateLimit.count']: currentCount + 1,
      });
    }
  }

  /**
   * Reset the rate limit counter for a user
   * @param userId - User ID
   * @param type - Type of rate limit to reset
   */
  private async resetRateLimit(userId: string, type: RateLimitType): Promise<void> {
    const now = new Date();
    const rateLimitField = type === RateLimitType.LOGIN ? 'loginRateLimit' : 'messageRateLimit';
    
    await this.userModel.findByIdAndUpdate(userId, {
      [rateLimitField]: {
        count: 0,
        resetAt: now,
      },
    });
  }

  /**
   * Get remaining rate limit for a user
   * @param userId - User ID
   * @param type - Type of rate limit to check
   * @returns Remaining count and time until reset
   */
  async getRemainingLimit(userId: string, type: RateLimitType): Promise<{
    remaining: number;
    resetIn: number; // seconds
  }> {
    const config = this.rateLimitConfigs[type];
    const now = new Date();

    const user = await this.userModel.findById(userId);
    if (!user) {
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);
    }

    const rateLimitData = type === RateLimitType.LOGIN 
      ? user.loginRateLimit 
      : user.messageRateLimit;

    const currentCount = rateLimitData?.count || 0;
    const resetAt = rateLimitData?.resetAt || new Date();

    const timeSinceReset = now.getTime() - new Date(resetAt).getTime();
    
    if (timeSinceReset >= config.windowMs) {
      return {
        remaining: config.maxCount,
        resetIn: 0,
      };
    }

    const remaining = Math.max(0, config.maxCount - currentCount);
    const resetIn = Math.ceil((config.windowMs - timeSinceReset) / 1000);

    return {
      remaining,
      resetIn,
    };
  }
}

