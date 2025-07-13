import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { TransactionService } from './transaction.service';

@Module({
  controllers: [AccountController],
  providers: [AccountService, TransactionService],
  exports: [AccountService],
})
export class AccountModule {}
