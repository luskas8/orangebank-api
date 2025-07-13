import { JwtAuthGuard } from '@auth/guards/jwt-auth.guard';
import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Logger,
  NotFoundException,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UnauthorizedException,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Account, Transaction } from '@prisma/client';
import { GetUser } from '@src/auth/decorators/get-user.decorator';
import { LoggedInUser } from '@src/auth/dto/logged-in-user.dto';
import { ErrorResponseDto } from '@src/common/dto/error-response.dto';
import { AccountService } from './account.service';
import { CreateAccountDto } from './dto/create-account.dto';
import { AccountResponseDto, TransactionResponseDto } from './dto/response.dto';
import { DepositDto, TransactionDto, WithdrawDto } from './dto/transaction.dto';
import { TransactionService } from './transaction.service';

@UseGuards(JwtAuthGuard)
@ApiTags('Accounts')
@Controller('account')
@ApiBearerAuth('JWT-auth')
export class AccountController {
  private readonly logger = new Logger(AccountController.name);

  constructor(
    private readonly accountService: AccountService,
    private readonly transactionService: TransactionService,
  ) {}

  @Post('create')
  @ApiOperation({
    summary: 'Create a new account',
    description:
      'Creates a new bank account (current or investment) for the authenticated user. Each user can have one current account and one investment account.',
  })
  @ApiResponse({
    status: 201,
    description: 'Account created successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Account creation failed - Invalid request data',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/create',
        method: 'POST',
        error: 'ACCOUNT_CREATION_FAILED',
        message:
          'Account creation failed. Please check your input data and try again.',
        details: {
          type: 'ACCOUNT_CREATION_FAILED',
          cause: 'Required fields missing or invalid data types',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/create',
        method: 'POST',
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {
          type: 'UNAUTHORIZED',
          cause: 'Invalid or missing JWT token',
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'Conflict - Account of this type already exists',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 409,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/create',
        method: 'POST',
        error: 'ACCOUNT_ALREADY_EXISTS',
        message: 'Account of this type already exists for this user.',
        details: {
          type: 'ACCOUNT_ALREADY_EXISTS',
          cause: 'User already has an account of the specified type',
        },
      },
    },
  })
  async create(
    @Body(ValidationPipe) createAccountDto: CreateAccountDto,
  ): Promise<Account> {
    const account = await this.accountService.create(createAccountDto);
    if (!account) {
      this.logger.warn(
        `Failed to create account for user ${createAccountDto.userId}`,
      );
      throw new BadRequestException(
        'Account creation failed. Please check your input data and try again.',
      );
    }

    return account;
  }

  @Get('get')
  @ApiOperation({
    summary: 'Get all accounts for the authenticated user',
    description:
      'Retrieves all bank accounts (current and investment) associated with the authenticated user. Returns an empty array if no accounts exist.',
  })
  @ApiResponse({
    status: 200,
    description: 'Accounts retrieved successfully',
    type: [AccountResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'No accounts found for this user',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/get',
        method: 'GET',
        error: 'ACCOUNTS_NOT_FOUND',
        message:
          'No accounts found for this user. Please create an account first.',
        details: {
          type: 'ACCOUNTS_NOT_FOUND',
          cause: 'User has no associated bank accounts',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/get',
        method: 'GET',
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {
          type: 'UNAUTHORIZED',
          cause: 'Invalid or missing JWT token',
        },
      },
    },
  })
  async findByUser(@GetUser() user: LoggedInUser): Promise<Account[]> {
    const accounts = await this.accountService.findByUser(user.id);
    if (!accounts) {
      this.logger.warn(`No accounts found for user ${user.id}`);
      throw new NotFoundException(
        'No accounts found for this user. Please create an account first.',
      );
    }

    return accounts;
  }

  @Get('get/:id')
  @ApiOperation({
    summary: 'Get account by ID',
    description:
      'Retrieves a specific account by its unique identifier. Users can only access their own accounts.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique account identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Account retrieved successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/get/123e4567-e89b-12d3-a456-426614174000',
        method: 'GET',
        error: 'ACCOUNT_NOT_FOUND',
        message:
          'Account with ID 123e4567-e89b-12d3-a456-426614174000 not found. Please verify the account ID.',
        details: {
          type: 'ACCOUNT_NOT_FOUND',
          cause: 'Invalid account ID provided',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/get/123e4567-e89b-12d3-a456-426614174000',
        method: 'GET',
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {
          type: 'UNAUTHORIZED',
          cause: 'Invalid or missing JWT token',
        },
      },
    },
  })
  async findOne(@Param('id') id: string): Promise<Account> {
    const account = await this.accountService.findOne(id);
    if (!account) {
      this.logger.warn(`Account not found: ${id}`);
      throw new NotFoundException(
        `Account with ID ${id} not found. Please verify the account ID.`,
      );
    }

    return account;
  }

  @Patch('activate/:id')
  @ApiOperation({
    summary: 'Activate an account',
    description:
      'Activates a previously deactivated account. Only inactive accounts can be activated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique account identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Account activated successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to activate account',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/activate/123e4567-e89b-12d3-a456-426614174000',
        method: 'PATCH',
        error: 'ACTIVATION_FAILED',
        message:
          'Failed to activate account 123e4567-e89b-12d3-a456-426614174000. Account may not exist or is already active.',
        details: {
          type: 'ACTIVATION_FAILED',
          cause: 'Account not found or already active',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/activate/123e4567-e89b-12d3-a456-426614174000',
        method: 'PATCH',
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {
          type: 'UNAUTHORIZED',
          cause: 'Invalid or missing JWT token',
        },
      },
    },
  })
  async activate(@Param('id') id: string): Promise<Account> {
    const account = await this.accountService.update(id, true);
    if (!account) {
      this.logger.warn(`Failed to activate account: ${id}`);
      throw new BadRequestException(
        `Failed to activate account ${id}. Account may not exist or is already active.`,
      );
    }

    return account;
  }

  @Delete('deativate/:id')
  @ApiOperation({
    summary: 'Deactivate an account',
    description:
      'Deactivates an active account. Deactivated accounts cannot perform transactions until reactivated.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique account identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Account deactivated successfully',
    type: AccountResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to deactivate account',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/deativate/123e4567-e89b-12d3-a456-426614174000',
        method: 'DELETE',
        error: 'DEACTIVATION_FAILED',
        message:
          'Failed to deactivate account 123e4567-e89b-12d3-a456-426614174000. Account may not exist or is already inactive.',
        details: {
          type: 'DEACTIVATION_FAILED',
          cause: 'Account not found or already inactive',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/deativate/123e4567-e89b-12d3-a456-426614174000',
        method: 'DELETE',
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {
          type: 'UNAUTHORIZED',
          cause: 'Invalid or missing JWT token',
        },
      },
    },
  })
  async deactivate(@Param('id') id: string): Promise<Account> {
    const account = await this.accountService.update(id, false);
    if (!account) {
      this.logger.warn(`Failed to deactivate account: ${id}`);
      throw new BadRequestException(
        `Failed to deactivate account ${id}. Account may not exist or is already inactive.`,
      );
    }

    return account;
  }

  @Post('deposit')
  @ApiOperation({
    summary: 'Make a deposit to current account',
    description:
      "Deposits money into the user's current account. Automatically finds the user's current account and credits the specified amount.",
  })
  @ApiResponse({
    status: 201,
    description: 'Deposit completed successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Deposit failed - Invalid request or insufficient data',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/deposit',
        method: 'POST',
        error: 'DEPOSIT_FAILED',
        message: 'Deposit failed. Please check your input data and try again.',
        details: {
          type: 'DEPOSIT_FAILED',
          cause: 'Invalid amount or account restrictions',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No current account found for deposit',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/deposit',
        method: 'POST',
        error: 'CURRENT_ACCOUNT_NOT_FOUND',
        message:
          'No current account found. Deposits can only be made to current accounts.',
        details: {
          type: 'CURRENT_ACCOUNT_NOT_FOUND',
          cause: 'User has no current account',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/deposit',
        method: 'POST',
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {
          type: 'UNAUTHORIZED',
          cause: 'Invalid or missing JWT token',
        },
      },
    },
  })
  async deposit(
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) dto: DepositDto,
  ): Promise<Transaction> {
    const accounts = await this.accountService.findByUser(user.id);
    if (!accounts || accounts.length === 0) {
      this.logger.warn(`No accounts found for user ${user.id} during deposit`);
      throw new NotFoundException(
        'No accounts found for this user. Please create an account first.',
      );
    }
    const currentAccount = accounts.find(
      (account: Account) => account.type === 'current_account',
    );
    if (!currentAccount) {
      this.logger.warn(`No current account found for user ${user.id}`);
      throw new NotFoundException(
        'No current account found. Deposits can only be made to current accounts.',
      );
    }

    return await this.transactionService.deposit(currentAccount.id, dto.amount);
  }

  @Post('withdraw')
  @ApiOperation({
    summary: 'Make a withdrawal from current account',
    description:
      "Withdraws money from the user's current account. Automatically finds the user's current account and debits the specified amount if sufficient balance is available.",
  })
  @ApiResponse({
    status: 201,
    description: 'Withdrawal completed successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Withdrawal failed - Invalid request or insufficient funds',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/withdraw',
        method: 'POST',
        error: 'WITHDRAWAL_FAILED',
        message: 'Withdrawal failed. Insufficient funds or invalid amount.',
        details: {
          type: 'WITHDRAWAL_FAILED',
          cause: 'Insufficient balance or invalid amount',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'No current account found for withdrawal',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/withdraw',
        method: 'POST',
        error: 'CURRENT_ACCOUNT_NOT_FOUND',
        message:
          'No current account found. Withdrawals can only be made from current accounts.',
        details: {
          type: 'CURRENT_ACCOUNT_NOT_FOUND',
          cause: 'User has no current account',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/withdraw',
        method: 'POST',
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {
          type: 'UNAUTHORIZED',
          cause: 'Invalid or missing JWT token',
        },
      },
    },
  })
  async withdraw(
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) dto: WithdrawDto,
  ): Promise<Transaction> {
    const accounts = await this.accountService.findByUser(user.id);
    if (!accounts || accounts.length === 0) {
      this.logger.warn(`No accounts found for user ${user.id} during withdraw`);
      throw new NotFoundException(
        'No accounts found for this user. Please create an account first.',
      );
    }
    const currentAccount = accounts.find(
      (account: Account) => account.type === 'current_account',
    );
    if (!currentAccount) {
      this.logger.warn(`No current account found for user ${user.id}`);
      throw new NotFoundException(
        'No current account found. Withdrawals can only be made from current accounts.',
      );
    }

    return await this.transactionService.withdraw(
      currentAccount.id,
      dto.amount,
    );
  }

  @Post('transfer')
  @ApiOperation({
    summary: 'Transfer money between accounts',
    description:
      'Transfers money from one account to another. The source account must belong to the authenticated user.',
  })
  @ApiResponse({
    status: 201,
    description: 'Transfer completed successfully',
    type: TransactionResponseDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Transfer failed - Invalid request or business rules violation',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/transfer',
        method: 'POST',
        error: 'TRANSFER_FAILED',
        message:
          'Transfer failed. Insufficient funds or invalid account configuration.',
        details: {
          type: 'TRANSFER_FAILED',
          cause: 'Insufficient balance or invalid destination account',
        },
      },
    },
  })
  @ApiResponse({
    status: 404,
    description: 'Source account not found',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/transfer',
        method: 'POST',
        error: 'SOURCE_ACCOUNT_NOT_FOUND',
        message: 'Source account not found for this user.',
        details: {
          type: 'SOURCE_ACCOUNT_NOT_FOUND',
          cause: 'User does not own the specified source account type',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - Invalid or missing JWT token',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/transfer',
        method: 'POST',
        error: 'UNAUTHORIZED',
        message: 'Authentication required',
        details: {
          type: 'UNAUTHORIZED',
          cause: 'Invalid or missing JWT token',
        },
      },
    },
  })
  async transfer(
    @GetUser() user: LoggedInUser,
    @Body(ValidationPipe) dto: TransactionDto,
  ): Promise<Transaction> {
    const accounts = await this.accountService.findByUser(user.id);
    if (!accounts || accounts.length === 0) {
      this.logger.warn(`No accounts found for user ${user.id} during transfer`);
      throw new NotFoundException(
        'No accounts found for this user. Please create an account first.',
      );
    }
    const account = accounts.find(
      (account: Account) => account.type === dto.fromAccountType,
    );
    if (!account) {
      this.logger.warn(
        `Account type ${dto.fromAccountType} not found for user ${user.id}`,
      );
      throw new NotFoundException(
        `Account type '${dto.fromAccountType}' not found for this user.`,
      );
    }

    return await this.transactionService.transfer(
      account.id,
      dto.toAccountId,
      dto.amount,
      dto.description || '',
    );
  }

  @Get('transactions/:id')
  @ApiOperation({
    summary: 'Get transaction history for an account',
    description:
      'Retrieves paginated transaction history for a specific account. Users can only access transaction history for their own accounts.',
  })
  @ApiParam({
    name: 'id',
    description: 'Unique account identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of transactions to return (default: 5, max: 100)',
    example: 10,
  })
  @ApiQuery({
    name: 'offset',
    required: false,
    type: Number,
    description: 'Number of transactions to skip for pagination (default: 0)',
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Transaction history retrieved successfully',
    type: [TransactionResponseDto],
  })
  @ApiResponse({
    status: 404,
    description: 'Account not found or no transactions found',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 404,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/transactions/123e4567-e89b-12d3-a456-426614174000',
        method: 'GET',
        error: 'ACCOUNT_NOT_FOUND',
        message:
          'Account with ID 123e4567-e89b-12d3-a456-426614174000 not found. Please verify the account ID.',
        details: {
          type: 'ACCOUNT_NOT_FOUND',
          cause: 'Invalid account ID provided',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized access to account',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 401,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/transactions/123e4567-e89b-12d3-a456-426614174000',
        method: 'GET',
        error: 'UNAUTHORIZED',
        message: 'You do not have permission to access this account.',
        details: {
          type: 'UNAUTHORIZED',
          cause: 'Account belongs to different user',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Failed to retrieve transaction history',
    type: ErrorResponseDto,
    schema: {
      example: {
        statusCode: 400,
        timestamp: '2025-07-13T18:15:45.123Z',
        path: '/account/transactions/123e4567-e89b-12d3-a456-426614174000',
        method: 'GET',
        error: 'TRANSACTION_HISTORY_ERROR',
        message:
          'Failed to retrieve transaction history. Please try again later.',
        details: {
          type: 'TRANSACTION_HISTORY_ERROR',
          cause: 'Internal server error or database connection issue',
        },
      },
    },
  })
  async getTransactions(
    @GetUser() user: LoggedInUser,
    @Param('id') id: string,
    @Query('limit', new ParseIntPipe({ optional: true })) limit?: number,
    @Query('offset', new ParseIntPipe({ optional: true })) offset?: number,
  ): Promise<Transaction[]> {
    const account = await this.accountService.findOne(id);
    if (!account) {
      this.logger.warn(`Account not found for transactions: ${id}`);
      throw new NotFoundException(
        `Account with ID ${id} not found. Please verify the account ID.`,
      );
    }
    if (account.userId !== user.id) {
      this.logger.warn(
        `Unauthorized access attempt to account ${id} by user ${user.id}`,
      );
      throw new UnauthorizedException(
        'You do not have permission to access this account.',
      );
    }

    try {
      const transactions = await this.transactionService.getTransactionHistory(
        id,
        limit || 5,
        offset || 0,
      );

      if (!transactions || transactions.length === 0) {
        this.logger.log(`No transactions found for account ${id}`);
        throw new NotFoundException('No transactions found for this account.');
      }

      return transactions;
    } catch (error: unknown) {
      if (
        error instanceof NotFoundException ||
        error instanceof UnauthorizedException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to get transaction history for account ${id}`,
        error,
      );
      throw new BadRequestException(
        'Failed to retrieve transaction history. Please try again later.',
      );
    }
  }
}
