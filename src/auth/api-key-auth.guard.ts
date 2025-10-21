import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class ApiKeyAuthGuard extends AuthGuard('api-key') {
	// allow request to proceed if strategy validated user
	handleRequest(err: any, user: any, info: any, context: ExecutionContext) {
		if (err) {
			throw err;
		}
		return user;
	}
}
