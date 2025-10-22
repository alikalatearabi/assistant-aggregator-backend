import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();

    let errorResponse: any = exception.getResponse();

    console.log('Exception caught:', {
      status,
      errorResponse,
      exceptionMessage: exception.message,
      exceptionName: exception.name
    });

    // If it's already our custom format, just return it
    if (typeof errorResponse === 'object' && (errorResponse.status || errorResponse.statusCode) && errorResponse.code && errorResponse.message) {
      response.status(status).json(errorResponse);
      return;
    }

    // Transform NestJS validation errors and other HTTP exceptions to custom format
    if ((status === 400 || status === 401) && typeof errorResponse === 'object' && (errorResponse.message || errorResponse.statusCode)) {
      // Handle array of validation messages
      let message = errorResponse.message;
      if (Array.isArray(message)) {
        message = message.join(', ');
      }

      // Map common validation messages to error codes
      let code = 'invalid_param';
      if (status === 401 || message.includes('Invalid API key') || message.includes('Unauthorized')) {
        code = 'unauthorized';
      }

      errorResponse = {
        status: status,
        code: code,
        message: message,
      };
    } else if (typeof errorResponse === 'string') {
      // Handle string error messages
      errorResponse = {
        status: status,
        code: status === 401 ? 'unauthorized' : 'invalid_param',
        message: errorResponse,
      };
    } else if (typeof errorResponse === 'object' && !errorResponse.status) {
      // Handle other object responses that don't have our custom format
      errorResponse = {
        status: status,
        code: status === 401 ? 'unauthorized' : 'invalid_param',
        message: errorResponse.message || 'An error occurred',
      };
    }

    response.status(status).json(errorResponse);
  }
}