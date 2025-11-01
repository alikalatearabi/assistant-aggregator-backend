import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-custom';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(Strategy, 'api-key') {
	constructor(
		@InjectModel(User.name) private userModel: Model<UserDocument>,
	) {
		super();
	}

	async validate(req: any): Promise<any> {
		// Accept API key in Authorization header as "Bearer <key>", "Api-Key <key>", or x-api-key header
		const authHeader = req.headers?.authorization || '';
		let apiKey: string | undefined;

		// if (authHeader) {
		// 	const parts = authHeader.split(' ');
		// 	if (parts.length === 2) {
		// 		const scheme = parts[0].toLowerCase();
		// 		if (scheme === 'bearer' || scheme === 'api-key') {
		// 			apiKey = parts[1];
		// 		}
		// 	}
		// }

		// if (!apiKey) {
		// 	apiKey = req.headers['x-api-key'];
		// }

		// if (!apiKey) {
		// 	throw new UnauthorizedException('API key is missing');
		// }

		const user = await this.userModel.findOne({ apiKey }).select('+password');

		if (!user || !user.isActive) {
			throw new UnauthorizedException('Invalid API key');
		}

		// Attach minimal user object
		return {
			id: (user._id as any).toString(),
			email: user.email,
			role: user.role,
		};
	}
}
