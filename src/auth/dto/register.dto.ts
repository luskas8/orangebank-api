import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
} from 'class-validator';

export class RegisterDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'User CPF (Cadastro de Pessoas Físicas)',
    example: '123.456.789-09',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(11)
  cpf: string;

  @ApiProperty({
    description: 'User birth date',
    example: '1990-01-01',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @IsDateString()
  birthDate: string;
}
