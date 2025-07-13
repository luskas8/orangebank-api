import { ApiProperty } from '@nestjs/swagger';

export class ErrorDetailsDto {
  @ApiProperty({
    description: 'Error type identifier',
    example: 'ACCOUNT_NOT_FOUND',
  })
  type: string;

  @ApiProperty({
    description: 'Additional information about the cause of the error',
    example: 'Invalid account ID provided',
  })
  cause: string;
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Timestamp when the error occurred',
    example: '2025-07-13T18:15:45.123Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'API path where the error occurred',
    example: '/account/transactions/123',
  })
  path: string;

  @ApiProperty({
    description: 'HTTP method used',
    example: 'GET',
  })
  method: string;

  @ApiProperty({
    description: 'Error identifier',
    example: 'ACCOUNT_NOT_FOUND',
  })
  error: string;

  @ApiProperty({
    description: 'Human-readable error message',
    example: 'Account with ID 123 not found. Please verify the account ID.',
  })
  message: string;

  @ApiProperty({
    description: 'Additional error details',
    type: ErrorDetailsDto,
  })
  details: ErrorDetailsDto;
}
