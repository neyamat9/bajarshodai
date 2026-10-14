import {
  IsString,
  IsOptional,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsUUID,
  Matches,
  Min,
} from 'class-validator';
import { CategoryStatus } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    example: 'Electronics',
    description: 'The unique name of the category',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    example: 'ফল ও সবজি',
    description: 'Bangla name (shown by default in the shop)',
  })
  @IsString()
  @IsOptional()
  nameBn?: string;

  @ApiProperty({
    example: 'fresh-vegetables',
    description: 'English letters, numbers and dashes only (same in both languages)',
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Use lowercase English letters, numbers and dashes only',
  })
  slug: string;

  @ApiPropertyOptional({
    description: 'The category this one sits under (leave out for a top level one)',
    nullable: true,
  })
  @IsOptional()
  @IsUUID()
  parentCategoryId?: string | null;

  @ApiPropertyOptional({ description: 'Position among its siblings' })
  @IsOptional()
  @IsInt()
  @Min(0)
  displayOrder?: number;

  @ApiPropertyOptional({
    example: 'https://example.com/category-image.png',
    description: 'Category representative image URL',
  })
  @IsString()
  @IsOptional()
  image?: string;

  @ApiPropertyOptional({
    example: 'All kinds of electronic items',
    description: 'A short description of the category',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  descriptionBn?: string;

  @ApiPropertyOptional({
    default: false,
    description: 'Whether this category should be displayed on the homepage',
  })
  @IsBoolean()
  @IsOptional()
  isHomepage?: boolean;

  @ApiPropertyOptional({
    enum: CategoryStatus,
    default: CategoryStatus.ACTIVE,
    description: 'Current status of the category',
  })
  @IsEnum(CategoryStatus)
  @IsOptional()
  status?: CategoryStatus;
  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  icon?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsString()
  @IsOptional()
  metaDescription?: string;
}
