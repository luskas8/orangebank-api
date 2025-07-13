import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsPositive } from 'class-validator';

export class UpdatePriceDto {
  @ApiProperty({
    description: 'The new current price of the asset',
    example: 155.75,
    minimum: 0,
  })
  @IsNumber({}, { message: 'Current price must be a number' })
  @IsPositive({ message: 'Current price must be positive' })
  currentPrice: number;
}
