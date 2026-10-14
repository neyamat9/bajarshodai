import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

const trim = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class BoardQueryDto {
  @ApiPropertyOptional({
    example: '2026-10-15',
    description: 'The day the Delivered column shows (default today)',
  })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  date?: string;
  @ApiPropertyOptional({ description: 'Only this rider' })
  @IsOptional()
  @IsUUID()
  assigneeId?: string;
}

export class AssignDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(50)
  @IsUUID('all', { each: true })
  orderIds: string[];
  @ApiProperty({ description: 'A person who can deliver' })
  @IsUUID()
  assigneeId: string;
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class NoteDto {
  @ApiPropertyOptional()
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(300)
  note?: string;
}

export class DeliveredDto extends NoteDto {
  @ApiPropertyOptional({
    description:
      'Cash taken from the customer. Default: what is due on the order.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cashCollected?: number;
}

export const FAIL_REASONS = [
  'CUSTOMER_NOT_REACHABLE',
  'CUSTOMER_REFUSED',
  'WRONG_ADDRESS',
  'NOBODY_HOME',
  'PAYMENT_PROBLEM',
  'OTHER',
] as const;

export class FailedDto extends NoteDto {
  @ApiProperty({ enum: FAIL_REASONS })
  @IsIn(FAIL_REASONS)
  reason: (typeof FAIL_REASONS)[number];
}

export class HandoverDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID('all', { each: true })
  deliveryIds: string[];
}

export class RangeDto {
  @ApiPropertyOptional({ example: '2026-10-01' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  from?: string;
  @ApiPropertyOptional({ example: '2026-10-31' })
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  to?: string;
}

export class MyScopeDto {
  @ApiPropertyOptional({ enum: ['active', 'done'], default: 'active' })
  @IsOptional()
  @IsIn(['active', 'done'])
  scope?: 'active' | 'done';
}
