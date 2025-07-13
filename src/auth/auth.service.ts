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
  constructor(
    private readonly prismaService: PrismaService,
    private readonly jwtService: JwtService,
    private readonly accountService: AccountService,
  ) {}

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
    const expiresIn = process.env.JWT_EXPIRES_IN;

    const payload = {
      sub: user.id.toString(),
      email: user.email,
      algorithm: 'HS256',
      issuer: 'orangebank-api',
      audience: 'orangebank-users',
    } as JwtSignOptions;

    return {
      access_token: this.jwtService.sign(payload),
      expiresIn: expiresIn,
    };
  }

  async register(dto: RegisterDto) {
    const { email, password, birthDate } = dto;

    const existingUser = await this.prismaService.user.findUnique({
      where: { email: email },
    });
    if (existingUser) {
      throw new ConflictException('User with this email already exists');
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
}
