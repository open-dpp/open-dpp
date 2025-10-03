import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';
import { NotFoundInDatabaseException } from './service.exceptions';
import { NotFoundError, ValueError } from './domain.errors';
import { Response, Request } from 'express';

@Catch(NotFoundInDatabaseException)
export class NotFoundInDatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundInDatabaseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}

@Catch(NotFoundError)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}

@Catch(ValueError)
export class ValueErrorFilter implements ExceptionFilter {
  catch(exception: ValueError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    });
  }
}
