import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CacheService } from '../../common/cache';
import { CreateUnitDto, UpdateUnitDto } from './dto/unit.dto';

@Injectable()
export class UnitsService {
  constructor(
    private prisma: PrismaService,
    private cache: CacheService,
  ) {}

  private changed() {
    // product cards and the settings carry the unit text
    this.cache.delByPrefix('units');
    this.cache.delByPrefix('products');
    this.cache.delByPrefix('home');
    this.cache.delByPrefix('settings');
  }

  /** Whole-number units cannot have a step or minimum with decimals. */
  private check(allowDecimal: boolean, step: number, min: number) {
    if (!allowDecimal && (!Number.isInteger(step) || !Number.isInteger(min))) {
      throw new BadRequestException(
        'A unit that is sold in whole numbers needs a whole-number step and minimum',
      );
    }
  }

  async findAll() {
    const rows = await this.prisma.unit.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return rows.map(({ _count, ...u }) => ({
      ...u,
      defaultStep: Number(u.defaultStep),
      defaultMinQty: Number(u.defaultMinQty),
      productCount: _count.products,
    }));
  }

  async create(dto: CreateUnitDto) {
    if (await this.prisma.unit.findUnique({ where: { code: dto.code } })) {
      throw new ConflictException('A unit with this code already exists');
    }
    const allowDecimal = dto.allowDecimal ?? false;
    const step = dto.defaultStep ?? 1;
    const min = dto.defaultMinQty ?? 1;
    this.check(allowDecimal, step, min);
    const last = await this.prisma.unit.aggregate({
      _max: { displayOrder: true },
    });
    const created = await this.prisma.unit.create({
      data: {
        ...dto,
        allowDecimal,
        defaultStep: step,
        defaultMinQty: min,
        displayOrder: (last._max.displayOrder ?? -1) + 1,
      },
    });
    this.changed();
    return created;
  }

  async update(id: string, dto: UpdateUnitDto) {
    const current = await this.prisma.unit.findUnique({ where: { id } });
    if (!current) throw new NotFoundException('Unit not found');
    const allowDecimal = dto.allowDecimal ?? current.allowDecimal;
    const step = dto.defaultStep ?? Number(current.defaultStep);
    const min = dto.defaultMinQty ?? Number(current.defaultMinQty);
    this.check(allowDecimal, step, min);

    // Turning decimals off while a product is sold by halves would leave the cart unable to follow it.
    if (current.allowDecimal && !allowDecimal) {
      const rows = await this.prisma.product.findMany({
        where: {
          unitId: id,
          OR: [{ sellStep: { not: null } }, { minQty: { not: null } }],
        },
        select: { name: true, sellStep: true, minQty: true },
      });
      const bad = rows.filter(
        (p) =>
          (p.sellStep !== null && !Number.isInteger(Number(p.sellStep))) ||
          (p.minQty !== null && !Number.isInteger(Number(p.minQty))),
      );
      if (bad.length) {
        throw new ConflictException(
          `${bad.length} product(s) are sold in parts (for example "${bad[0].name}"). Change them first.`,
        );
      }
    }

    const updated = await this.prisma.unit.update({ where: { id }, data: dto });
    this.changed();
    return updated;
  }

  async remove(id: string) {
    const unit = await this.prisma.unit.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (unit._count.products > 0) {
      throw new ConflictException(
        `${unit._count.products} product(s) use this unit. Switch the unit off instead of deleting it.`,
      );
    }
    await this.prisma.unit.delete({ where: { id } });
    this.changed();
    return { success: true };
  }
}
