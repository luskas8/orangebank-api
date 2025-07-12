import { PrismaService } from '@database/prisma/prisma.service';
import { Injectable, Logger } from '@nestjs/common';
import { Account } from '@prisma/client';
import { CreateAccountDto } from './dto/create-account.dto';

@Injectable()
export class AccountService {
  private readonly logger = new Logger(AccountService.name);

  constructor(private readonly prismaService: PrismaService) {}

  async create(createAccountDto: CreateAccountDto): Promise<Account | null> {
    try {
      const account = await this.prismaService.account.create({
        data: createAccountDto,
      });

      return account;
    } catch (error) {
      this.logger.warn(`Failed to create account: ${error}`);
      return null;
    }
  }

  async findOne(id: string): Promise<Account | null> {
    const account = await this.prismaService.account.findUnique({
      where: { id },
    });
    if (!account) {
      return null;
    }

    return account;
  }

  async findByUser(userId: number): Promise<Account[] | null> {
    const accounts = await this.prismaService.account.findMany({
      where: { userId },
    });
    if (!accounts || accounts.length === 0) {
      return null;
    }

    return accounts;
  }

  async update(id: string, accountActive: boolean): Promise<Account | null> {
    if (!(await this.findOne(id))) {
      return null;
    }

    try {
      const account = this.prismaService.account.update({
        where: { id },
        data: { active: accountActive },
      });
      return account;
    } catch (error) {
      this.logger.warn(`Failed to activate account: ${error}`);
      return null;
    }
  }
}
