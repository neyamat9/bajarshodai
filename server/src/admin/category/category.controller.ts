import { Put } from '@nestjs/common';
import {
  DisplayOrderService,
  ReorderCategoriesDto,
} from '../../common/display-order';
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { CategoryService } from './category.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard, PermissionsGuard } from '../../common/guards';
import { ResponseMessage, RequirePermissions } from '../../common/decorators';

@ApiTags('Admin Categories')
@ApiBearerAuth('JWT')
@RequirePermissions('products.view', 'products.manage')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('admin/category')
export class CategoryController {
  constructor(
    private readonly categoryService: CategoryService,
    private readonly displayOrder: DisplayOrderService,
  ) {}

  @Put('reorder')
  @ApiOperation({
    summary:
      'Save the display order of the categories under one parent (drag & drop). Send all their ids in the wanted order.',
  })
  reorder(@Body() dto: ReorderCategoriesDto) {
    return this.displayOrder.reorder('category', dto.ids, {
      categoryId: dto.categoryId,
    });
  }

  // Create a new category
  @Post()
  @ResponseMessage('Category created successfully')
  @ApiOperation({ summary: 'Create a new category' })
  @ApiResponse({
    status: 201,
    description: 'The category has been successfully created.',
  })
  @ApiResponse({
    status: 409,
    description: 'Category with this slug already exists.',
  })
  create(@Body() createCategoryDto: CreateCategoryDto) {
    return this.categoryService.create(createCategoryDto);
  }

  // Retrieve all categories (including sub-categories)
  @Get()
  @ResponseMessage('Categories retrieved successfully')
  @ApiOperation({ summary: 'Get all categories' })
  @ApiResponse({
    status: 200,
    description: 'Return all categories with their sub-categories.',
  })
  findAll() {
    return this.categoryService.findAll();
  }

  // Get a single category by ID (including sub-categories)
  @Get(':id')
  @ApiOperation({ summary: 'Get a category by ID' })
  @ApiParam({ name: 'id', description: 'Unique identifier of the category' })
  @ApiResponse({ status: 200, description: 'Return the category object.' })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  findOne(@Param('id') id: string) {
    return this.categoryService.findOne(id);
  }

  // Update a category by ID
  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing category' })
  @ApiParam({ name: 'id', description: 'Unique identifier of the category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully updated.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoryService.update(id, updateCategoryDto);
  }

  // Delete a category by ID
  @Delete(':id')
  @ApiOperation({ summary: 'Delete a category' })
  @ApiParam({ name: 'id', description: 'Unique identifier of the category' })
  @ApiResponse({
    status: 200,
    description: 'The category has been successfully deleted.',
  })
  @ApiResponse({ status: 404, description: 'Category not found.' })
  remove(@Param('id') id: string) {
    return this.categoryService.remove(id);
  }
}
