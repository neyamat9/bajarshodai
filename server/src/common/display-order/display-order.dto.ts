import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsEnum,
  IsOptional,
  IsUUID,
} from 'class-validator';
import { BannerPosition } from '@prisma/client';

export class ReorderDto {
  @ApiProperty({
    type: [String],
    description:
      'ALL ids of the list in the wanted order (first = shown first)',
  })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID('all', { each: true })
  ids: string[];
}

export class ReorderCategoriesDto extends ReorderDto {
  @ApiPropertyOptional({
    description:
      'The parent category whose children are being ordered (leave out for the top level)',
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
}

export class ReorderBannersDto extends ReorderDto {
  @ApiProperty({
    enum: BannerPosition,
    description: 'Banners are ordered within one position',
  })
  @IsEnum(BannerPosition)
  position: BannerPosition;
}
