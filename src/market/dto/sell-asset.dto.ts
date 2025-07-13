import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class SellAssetDto {
  @ApiProperty({
    description: 'The asset symbol to sell',
    example: 'AAPL',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  assetSymbol: string;

  @ApiProperty({
    description: 'The quantity of the asset to sell',
    example: 5,
    required: true,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;
}
