import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsNumber, IsPositive, IsString } from 'class-validator';

export class BuyAssetDto {
  @ApiProperty({
    description: 'The asset symbol to buy',
    example: 'AAPL',
    required: true,
  })
  @IsString()
  @IsNotEmpty()
  assetSymbol: string;

  @ApiProperty({
    description: 'The quantity of the asset to buy',
    example: 10,
    required: true,
  })
  @IsNumber()
  @IsPositive()
  quantity: number;
}
