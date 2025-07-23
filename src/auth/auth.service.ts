import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtModuleOptions, JwtService, JwtSignOptions } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';

import { PrismaService } from '@database/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { AccountService } from '@src/account/account.service';
import { CreateAccountDto } from '@src/account/dto/create-account.dto';
import { LoggedInUser } from './dto/logged-in-user.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

export interface JwtPayload extends JwtModuleOptions {
  sub: string;
  email: string;
}

@Injectable()
export class AuthService {
  private readonly expiresIn = process.env.JWT_EXPIRES_IN || '24h';
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly accountService: AccountService,
  ) {}

  private signToken(user: LoggedInUser) {
    const payload = {
      sub: user.id.toString(),
      email: user.email,
      algorithm: 'HS256',
      issuer: 'orangebank-api',
      audience: 'orangebank-users',
    } as JwtSignOptions;

    return {
      access_token: this.jwtService.sign(payload),
      userId: user.id,
      expiresIn: this.expiresIn,
    };
  }

  async validateUser(email: string, password: string): Promise<LoggedInUser> {
    const user = await this.prismaService.user.findUnique({
      where: { email },
    });
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      cpf: user.cpf,
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
      birthDate: user.birthDate.toDateString(),
    } as LoggedInUser;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);

    return this.signToken(user);
  }

  async register(dto: RegisterDto) {
    const { email, password, birthDate } = dto;

    const users = await this.prismaService.user.findMany({
      where: {
        OR: [{ cpf: dto.cpf }, { email: email }],
      },
    });
    if (users.length > 0) {
      throw new ConflictException('User with this email or CPF already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const formattedBirthDate = new Date(birthDate);

    const user = await this.prismaService.user.create({
      data: {
        ...dto,
        password: hashedPassword,
        birthDate: formattedBirthDate,
      } as Prisma.UserCreateInput,
    });

    await this.accountService.create({
      type: 'current_account',
      balance: 0,
      userId: user.id,
    } as CreateAccountDto);

    await this.accountService.create({
      type: 'investment_account',
      balance: 0,
      userId: user.id,
    } as CreateAccountDto);

    return this.signToken(user as unknown as LoggedInUser);
  }

  async findById(id: number): Promise<LoggedInUser> {
    const user = await this.prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        cpf: true,
        birthDate: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      cpf: user.cpf,
      birthDate: user.birthDate.toDateString(),
      createdAt: user.createdAt.toISOString(),
      updatedAt: user.updatedAt.toISOString(),
    } as LoggedInUser;
  }

  async getProfile(userId: number): Promise<LoggedInUser> {
    const user = await this.findById(userId);

    const accounts = await this.prismaService.account.findMany({
      where: { userId },
    });

    accounts.forEach((account) => {
      user[account.type.split('_')[0]] = account.id;
    });
    return {
      ...user,
      password: null,
    } as LoggedInUser;
  }
}
