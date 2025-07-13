import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AssetOperationException } from './asset-operation.exception';
import { TransactionException } from './transaction.exception';

interface ErrorResponse {
  statusCode: number;
  timestamp: string;
  path: string;
  method: string;
  error: string;
  message: string | string[];
  details?: Record<string, unknown>;
}

interface RequestWithUser extends Request {
  user?: { id: string };
}

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<RequestWithUser>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';
    let details: Record<string, unknown> | undefined = undefined;

    // Handle HTTP exceptions
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
        error = exception.name;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null
      ) {
        const responseObj = exceptionResponse as Record<string, unknown>;
        message =
          (responseObj.message as string | string[]) || exception.message;
        error = (responseObj.error as string) || exception.name;
        details = responseObj.details as Record<string, unknown>;
      }
    }
    // Handle custom Transaction exceptions
    else if (exception instanceof TransactionException) {
      status = this.getStatusForTransactionException(exception.name);
      message = exception.message;
      error = exception.name;
      details = {
        type: exception.name,
        cause: exception.cause,
      };
    }
    // Handle custom Asset Operation exceptions
    else if (exception instanceof AssetOperationException) {
      status = this.getStatusForAssetException(exception.name);
      message = exception.message;
      error = exception.name;
      details = {
        type: exception.name,
        cause: exception.cause,
      };
    }
    // Handle generic errors
    else if (exception instanceof Error) {
      message = exception.message;
      error = exception.name;
      this.logger.error(
        `Unhandled error: ${exception.message}`,
        exception.stack,
      );
    }
    // Handle unknown exceptions
    else {
      this.logger.error('Unknown exception type', exception);
    }

    const errorResponse: ErrorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      error,
      message,
      ...(details && { details }),
    };

    // Log error details
    this.logger.error(
      `${request.method} ${request.url} - ${status} - ${JSON.stringify({
        error,
        message,
        userId: request.user?.id,
        ip: request.ip,
      })}`,
    );

    response.status(status).json(errorResponse);
  }

  private getStatusForTransactionException(type: string): number {
    switch (type) {
      case 'INVALID_AMOUNT':
      case 'INVALID_ACCOUNT_TYPE':
      case 'INSUFFICIENT_BALANCE':
      case 'INSUFFICIENT_FUNDS':
      case 'SAME_ACCOUNT_TRANSFER':
      case 'PENDING_TRANSACTION':
        return HttpStatus.BAD_REQUEST;
      case 'ACCOUNT_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }

  private getStatusForAssetException(type: string): number {
    switch (type) {
      case 'INVALID_ACCOUNT_TYPE':
      case 'INSUFFICIENT_FUNDS':
      case 'INSUFFICIENT_ASSET_QUANTITY':
      case 'INVALID_QUANTITY':
      case 'PENDING_TRANSACTION':
        return HttpStatus.BAD_REQUEST;
      case 'ASSET_NOT_FOUND':
      case 'INVESTMENT_ACCOUNT_NOT_FOUND':
        return HttpStatus.NOT_FOUND;
      default:
        return HttpStatus.BAD_REQUEST;
    }
  }
}
