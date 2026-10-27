import { ApiProperty } from '@nestjs/swagger';
import { ArrayMaxSize, IsArray, IsUUID } from 'class-validator';

export class UpdateFeaturedProductsDto {
  @ApiProperty({
    description: 'Ordered list of product UUIDs to feature in আজকের তাজা বাজার (max 18)',
    example: ['d9e6027a-a634-4537-b67e-079d8544e45d'],
    type: [String],
  })
  @IsArray()
  @ArrayMaxSize(18, { message: 'Maximum 18 products can be featured in আজকের তাজা বাজার' })
  @IsUUID('4', { each: true, message: 'Each product ID must be a valid UUID' })
  productIds: string[];
}
