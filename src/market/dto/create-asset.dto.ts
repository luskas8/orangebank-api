import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class CreateAssetDto {
  @ApiProperty({
    description: 'The asset symbol/ticker',
    example: 'AAPL',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  symbol: string;

  @ApiProperty({
    description: 'The asset name',
    example: 'Apple Inc.',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'The sector the asset belongs to',
    example: 'Technology',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  sector: string;

  @ApiProperty({
    description: 'The current price of the asset',
    example: 150.25,
    required: true,
  })
  @IsNumber()
  @IsPositive()
  @IsNotEmpty()
  currentPrice: number;

  @ApiProperty({
    description: 'The daily variation percentage of the asset',
    example: 2.5,
    required: true,
  })
  @IsNumber()
  @IsNotEmpty()
  dailyVariation: number;
}
