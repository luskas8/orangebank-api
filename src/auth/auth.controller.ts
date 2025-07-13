import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { ErrorResponseDto } from '@src/common/dto/error-response.dto';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @ApiOperation({
    summary: 'User login',
    description:
      'Authenticate user with email and password. Returns JWT token for subsequent API calls.',
  })
  @ApiResponse({
    status: 200,
    description: 'Login successful - Returns JWT token and user information',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        userId: 1,
        expiresIn: '24h',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/auth/login',
        method: 'POST',
        error: 'VALIDATION_ERROR',
        message: 'Invalid email format or password too short',
        details: {
          type: 'VALIDATION_ERROR',
          cause: 'Input validation failed',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid credentials',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/auth/login',
        method: 'POST',
        error: 'INVALID_CREDENTIALS',
        message: 'Invalid email or password. Please check your credentials.',
        details: {
          type: 'INVALID_CREDENTIALS',
          cause: 'Email or password does not match',
        },
      },
    },
  })
  async login(@Body() loginDto: LoginDto) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  @ApiOperation({
    summary: 'User registration',
    description:
      'Register a new user account. Creates user profile and automatically creates a current account.',
  })
  @ApiResponse({
    status: 201,
    description:
      'User created successfully - Returns JWT token and user information',
    schema: {
      example: {
        access_token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
        userId: 1,
        expiresIn: '24h',
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid input data',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/auth/register',
        method: 'POST',
        error: 'VALIDATION_ERROR',
        message: 'Invalid input data. Please check all required fields.',
        details: {
          type: 'VALIDATION_ERROR',
          cause: 'Required fields missing or invalid format',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - User already exists',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 409,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/auth/register',
        method: 'POST',
        error: 'USER_ALREADY_EXISTS',
        message:
          'User with this email or CPF already exists. Please use different credentials.',
        details: {
          type: 'USER_ALREADY_EXISTS',
          cause: 'Email or CPF already registered',
        },
      },
    },
  })
  async register(@Body() registerDto: RegisterDto) {
    return this.authService.register(registerDto);
  }
}
