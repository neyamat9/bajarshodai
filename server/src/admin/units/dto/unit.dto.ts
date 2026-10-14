import {
  ApiProperty,
  ApiPropertyOptional,
  OmitType,
  PartialType,
} from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

export class CreateUnitDto {
  @ApiProperty({
    example: 'kg',
    description:
      'Short code in English letters, numbers and dashes. Cannot be changed later.',
  })
  @Transform(trim)
  @IsString()
  @Matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
    message: 'Use lowercase English letters, numbers and dashes only',
  })
  @MaxLength(30)
  code: string;

  @ApiProperty({ example: 'Kilogram' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: 'কেজি' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  nameBn: string;

  @ApiProperty({ example: 'kg', description: 'Shown on product cards' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  shortLabel: string;

  @ApiProperty({ example: 'কেজি' })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  shortLabelBn: string;

  @ApiPropertyOptional({
    default: false,
    description:
      'Can be sold in parts (0.5 kg). Off = whole numbers only (1, 2, 3).',
  })
  @IsOptional()
  @IsBoolean()
  allowDecimal?: boolean;

  @ApiPropertyOptional({
    default: 1,
    example: 0.5,
    description: 'How much the + and − buttons add',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  defaultStep?: number;

  @ApiPropertyOptional({
    default: 1,
    example: 0.5,
    description: 'Smallest quantity of an order line',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  defaultMinQty?: number;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

// The code identifies the unit everywhere, so it stays as it was created.
export class UpdateUnitDto extends PartialType(
  OmitType(CreateUnitDto, ['code'] as const),
) {}
