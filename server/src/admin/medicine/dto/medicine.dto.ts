import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsOptional, IsString, IsInt, Min, IsIn } from 'class-validator';

export class MedicineListQueryDto {
  @ApiPropertyOptional({ example: 'napa' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ example: 'Tablet' })
  @IsOptional()
  @IsString()
  dosageForm?: string;

  @ApiPropertyOptional({ example: 'Paracetamol' })
  @IsOptional()
  @IsString()
  generic?: string;

  @ApiPropertyOptional({ example: 'Square Pharmaceuticals Ltd.' })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({ enum: ['OTC', 'PRESCRIPTION'] })
  @IsOptional()
  @IsIn(['OTC', 'PRESCRIPTION'])
  type?: 'OTC' | 'PRESCRIPTION';

  @ApiPropertyOptional({ enum: ['ALL', 'SYNCED', 'DRIFT_DETECTED', 'FAILED'] })
  @IsOptional()
  @IsString()
  syncStatus?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  limit?: number = 20;
}

export class MedicineLookupDto {
  @ApiProperty({ example: 'napa' })
  @IsString()
  q: string;
}

export class MedicineDetailDto {
  @ApiProperty({ example: 'https://medex.com.bd/brands/10592/napa-extra-500-mg-tablet' })
  @IsString()
  url: string;
}

export class ApplyDriftDto {
  @ApiPropertyOptional({ description: 'Optional custom selling price override. Defaults to MedEx MRP.' })
  @IsOptional()
  @Type(() => Number)
  sellingPrice?: number;
}

export class SetGlobalMedicineDiscountDto {
  @ApiProperty({ example: 7, description: 'Global discount percentage for all medicines (0 to 100)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  discountPercent: number;
}

export class UpdateMedicinePricingDto {
  @ApiProperty({ enum: ['GLOBAL', 'PERCENT', 'FIXED', 'NONE'], example: 'PERCENT' })
  @IsIn(['GLOBAL', 'PERCENT', 'FIXED', 'NONE'])
  discountMode: 'GLOBAL' | 'PERCENT' | 'FIXED' | 'NONE';

  @ApiPropertyOptional({ example: 10, description: 'Percentage if PERCENT mode, or fixed selling price if FIXED mode' })
  @IsOptional()
  @Type(() => Number)
  discountValue?: number;
}
