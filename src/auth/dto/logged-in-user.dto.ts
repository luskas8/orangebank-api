import { ApiProperty } from '@nestjs/swagger';

export class LoggedInUser {
  @ApiProperty({
    description: 'User unique identifier',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'User password',
    example: 'password123',
    minLength: 6,
  })
  password: string | null;

  @ApiProperty({
    description: 'User full name',
    example: 'John Doe',
    required: true,
  })
  name: string;

  @ApiProperty({
    description: 'User CPF (Cadastro de Pessoas Físicas)',
    example: '123.456.789-09',
    required: true,
  })
  cpf: string;

  @ApiProperty({
    description: 'User birth date',
    example: '1990-01-01',
    required: true,
  })
  birthDate: string;

  @ApiProperty({
    description: 'User creation date',
    example: '2023-01-01T00:00:00Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'User last update date',
    example: '2023-01-01T00:00:00Z',
  })
  updatedAt: string;

  constructor(obj: LoggedInUser) {
    this.id = obj.id;
    this.email = obj.email;
    this.password = obj.password;
    this.name = obj.name;
    this.cpf = obj.cpf;
    this.birthDate = obj.birthDate;
    this.createdAt = obj.createdAt;
    this.updatedAt = obj.updatedAt;
  }
}
