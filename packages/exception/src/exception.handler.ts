import type {
  ArgumentsHost,
  ExceptionFilter,
} from '@nestjs/common'
import {
  Catch,
  HttpStatus,
} from '@nestjs/common'
import { NotFoundError, ValueError } from './domain.errors'
import { NotFoundInDatabaseException } from './service.exceptions'

@Catch(NotFoundInDatabaseException)
export class NotFoundInDatabaseExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundInDatabaseException, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response: any = ctx.getResponse()
    const request: any = ctx.getRequest()
    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    })
  }
}

@Catch(NotFoundError)
export class NotFoundExceptionFilter implements ExceptionFilter {
  catch(exception: NotFoundError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()
    response.status(HttpStatus.NOT_FOUND).json({
      statusCode: HttpStatus.NOT_FOUND,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    })
  }
}

@Catch(ValueError)
export class ValueErrorFilter implements ExceptionFilter {
  catch(exception: ValueError, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse()
    const request = ctx.getRequest()
    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: request.url,
      message: exception.message,
    })
  }
}
