import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsArray,
  ValidateNested,
  IsUUID,
  ArrayMaxSize,
  IsNotEmpty,
  MaxLength,
  Min,
  IsInt,
  IsIn,
  IsDate,
  Matches,
  ValidateIf,
  IsPositive,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ProductStatus } from '@prisma/client';

const trim = ({ value }: { value: unknown }): unknown =>
  typeof value === 'string' ? value.trim() : value;

// Filterable attributes shown as storefront filters, e.g.
// { name: "Origin", value: "Local" }, { name: "Type", value: "Organic" }.
export class ProductAttributeDto {
  @ApiProperty({ example: 'Origin' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @ApiProperty({ example: 'Local' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  value: string;
}

// One purchasable option of a product (pack size / weight...).
export class ProductVariantInputDto {
  @ApiPropertyOptional({
    example: 'Black / 256GB',
    description: 'Shown to customers. Built from the attributes when omitted.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiProperty({
    example: 'A55-BLK-256',
    description: 'Unique across all products',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  @Matches(/^[A-Za-z0-9._-]+$/, {
    message:
      'sku may only contain letters, numbers, dots, dashes and underscores',
  })
  sku: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  barcode?: string;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Price of this variant. Leave out to use the product price.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  price?: number | null;

  @ApiPropertyOptional({ description: 'Starting stock (default 0)' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(500)
  imageUrl?: string | null;

  @ApiPropertyOptional({ example: 'Color' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attribute1Name?: string;

  @ApiPropertyOptional({ example: 'Black' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  attribute1Value?: string;

  @ApiPropertyOptional({ example: 'Pack' })
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attribute2Name?: string;

  @ApiPropertyOptional({ example: '500 g' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  attribute2Value?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(50)
  attribute3Name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  attribute3Value?: string;
}

export class MedicineMetaInputDto {
  @ApiProperty({ example: 'Paracetamol + Caffeine' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  genericName: string;

  @ApiPropertyOptional({ example: 'paracetamol-caffeine' })
  @IsOptional()
  @IsString()
  @MaxLength(200)
  genericSlug?: string;

  @ApiProperty({ example: 'Tablet' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  dosageForm: string;

  @ApiProperty({ example: '500 mg + 65 mg' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  strength: string;

  @ApiProperty({ example: 'Beximco Pharmaceuticals Ltd.' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  manufacturer: string;

  @ApiPropertyOptional({ enum: ['OTC', 'PRESCRIPTION'], default: 'OTC' })
  @IsOptional()
  @IsIn(['OTC', 'PRESCRIPTION'])
  type?: 'OTC' | 'PRESCRIPTION';

  @ApiPropertyOptional({ example: 'https://medex.com.bd/brands/10592/napa-extra-500-mg-tablet' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  medexUrl?: string;

  @ApiPropertyOptional({ example: 10592 })
  @IsOptional()
  @IsInt()
  medexId?: number;

  @ApiPropertyOptional({ example: 2.50 })
  @IsOptional()
  @IsNumber()
  mrpUnit?: number;

  @ApiPropertyOptional({ example: 25.00 })
  @IsOptional()
  @IsNumber()
  mrpStrip?: number;

  @ApiPropertyOptional({ example: 250.00 })
  @IsOptional()
  @IsNumber()
  mrpBox?: number;

  @ApiPropertyOptional({ example: '10 x 10 tablets' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  packSizeInfo?: string;
}

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class CreateProductDto {
  @ApiProperty({
    example: 'Samsung Galaxy A55 5G',
    description: 'The name of the product',
  })
  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name: string;

  @ApiPropertyOptional({
    example: 'samsung-galaxy-a55-5g',
    description:
      'URL slug (lowercase letters, numbers, dashes). Made from the name when omitted.',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  @Matches(SLUG_RE, {
    message:
      'slug may only contain lowercase letters, numbers and single dashes',
  })
  slug?: string;

  @ApiPropertyOptional({
    example: 'PROD-001',
    description: 'Internal product code (unique)',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(60)
  productCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(60)
  barcode?: string;

  @ApiPropertyOptional({
    example: 'রুই মাছ',
    description: 'Bangla name (shown by default in the shop)',
  })
  @IsOptional()
  @Transform(trim)
  @IsString()
  @MaxLength(200)
  nameBn?: string;

  @ApiPropertyOptional({ description: 'Full description (HTML or text)' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  descriptionBn?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  shortDescriptionBn?: string;

  @ApiPropertyOptional({
    description: 'How it is sold: a unit from Catalog → Units (kg, piece, packet…)',
  })
  @IsOptional()
  @IsUUID()
  unitId?: string;

  @ApiPropertyOptional({ example: '500 g', description: 'Size of one pack, shown on the card' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  packSize?: string;

  @ApiPropertyOptional({
    nullable: true,
    example: 0.5,
    description: 'Step of the quantity buttons. Overrides the unit step (null = use the unit step).',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  sellStep?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    example: 0.5,
    description: 'Smallest quantity a customer can order. Overrides the unit minimum.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @IsPositive()
  minQty?: number | null;

  @ApiPropertyOptional({
    description: 'The final weight may differ a little from the ordered quantity (packer weighs it)',
  })
  @IsOptional()
  @IsBoolean()
  isWeighed?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  shortDescription?: string;

  @ApiPropertyOptional({ enum: ProductStatus, default: 'ACTIVE' })
  @IsOptional()
  @IsIn(Object.values(ProductStatus))
  status?: ProductStatus;

  @ApiProperty({ example: 1500, description: 'What you paid (private)' })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  buyingPrice: number;

  @ApiProperty({
    example: 2000,
    description: 'MRP / original price (shown struck through)',
  })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  regularPrice: number;

  @ApiProperty({ example: 1800, description: 'Normal selling price' })
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  sellingPrice: number;

  @ApiPropertyOptional({
    nullable: true,
    example: 1700,
    description:
      'Promotional price. Applied automatically between discountStart and discountEnd; null removes the discount.',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  discountPrice?: number | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Starts immediately when omitted',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Date)
  @IsDate()
  discountStart?: Date | null;

  @ApiPropertyOptional({
    nullable: true,
    description: 'Runs until removed when omitted',
  })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @Type(() => Date)
  @IsDate()
  discountEnd?: Date | null;

  @ApiPropertyOptional({ nullable: true, example: 'Eid Sale' })
  @IsOptional()
  @ValidateIf((_, v) => v !== null)
  @IsString()
  @MaxLength(60)
  discountLabel?: string | null;

  @ApiPropertyOptional({
    default: true,
    description:
      'false for daily fresh bazaar items (fish, vegetables, meat) where stock is not counted',
  })
  @IsOptional()
  @IsBoolean()
  trackStock?: boolean;

  @ApiPropertyOptional({
    description:
      'Quantity in stock (products without variants). With variants, set the stock of each variant.',
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0)
  stock?: number;

  @ApiPropertyOptional({
    default: 5,
    description: 'Shown as "low stock" at or below this',
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  lowStockThreshold?: number;

  @ApiPropertyOptional({
    default: false,
    description: 'Delivery is free for this product',
  })
  @IsOptional()
  @IsBoolean()
  freeShipping?: boolean;

  @ApiPropertyOptional({ description: 'kg' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  weight?: number;

  @ApiPropertyOptional({ description: 'cm' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  length?: number;

  @ApiPropertyOptional({ description: 'cm' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  width?: number;

  @ApiPropertyOptional({ description: 'cm' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  height?: number;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isFeatured?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isNew?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isHot?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isBestSeller?: boolean;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isLimitedStock?: boolean;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(70)
  metaTitle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(200)
  metaDescription?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(300)
  metaKeywords?: string;

  @ApiPropertyOptional({ example: 'BRAND_UUID', description: 'Valid Brand ID' })
  @IsUUID()
  @IsOptional()
  brandId?: string;

  @ApiProperty({
    example: 'CATEGORY_UUID',
    description: 'The deepest category the product belongs to (any level of the tree)',
  })
  @IsUUID()
  categoryId: string;

  @ApiPropertyOptional({
    type: [ProductAttributeDto],
    description:
      'Filterable attributes (Origin, Type, Brand...). On update, the list replaces all existing attributes.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @ValidateNested({ each: true })
  @Type(() => ProductAttributeDto)
  attributes?: ProductAttributeDto[];

  @ApiPropertyOptional({
    type: [String],
    example: ['5G', 'gaming'],
    description: 'Search tags. On update, the list replaces all existing tags.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @IsString({ each: true })
  @MaxLength(40, { each: true })
  tags?: string[];

  @ApiPropertyOptional({
    type: [ProductVariantInputDto],
    description:
      'Create the product with its variants. On an existing product use the /variants endpoints.',
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => ProductVariantInputDto)
  variants?: ProductVariantInputDto[];

  @ApiPropertyOptional({
    type: () => MedicineMetaInputDto,
    description: 'Factual pharmaceutical details for medicine products',
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => MedicineMetaInputDto)
  medicineMeta?: MedicineMetaInputDto;
}
