import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrescriptionStatus, type User } from '@prisma/client';
import { randomUUID } from 'crypto';
import { promises as fs } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePrescriptionDto } from './prescriptions.dto';

const MAX_PRESCRIPTION_BYTES = 10 * 1024 * 1024; // 10MB
const ALLOWED_IMAGE_FORMATS = new Set(['jpeg', 'png', 'webp', 'gif', 'avif']);

@Injectable()
export class PrescriptionsService {
  private readonly logger = new Logger(PrescriptionsService.name);
  private readonly rootDir: string;

  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.rootDir = path.resolve(config.get<string>('uploads.dir') ?? 'uploads');
  }

  /**
   * Save uploaded prescription file and create Prescription record
   */
  async create(
    user: User | null | undefined,
    dto: CreatePrescriptionDto,
    file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('Prescription photo or document is required');
    }

    if (file.size > MAX_PRESCRIPTION_BYTES) {
      throw new BadRequestException('File size must not exceed 10MB');
    }

    const prescriptionsDir = path.join(this.rootDir, 'prescriptions');
    await fs.mkdir(prescriptionsDir, { recursive: true });

    const uuid = randomUUID();
    let relativeUrl = '';
    const isPdf =
      file.mimetype === 'application/pdf' ||
      file.originalname.toLowerCase().endsWith('.pdf');

    if (isPdf) {
      const fileName = `${uuid}.pdf`;
      const filePath = path.join(prescriptionsDir, fileName);
      await fs.writeFile(filePath, file.buffer);
      relativeUrl = `/uploads/prescriptions/${fileName}`;
    } else {
      // Validate and process image
      try {
        const metadata = await sharp(file.buffer).metadata();
        if (!metadata.format || !ALLOWED_IMAGE_FORMATS.has(metadata.format)) {
          throw new BadRequestException(
            `Unsupported format "${metadata.format}". Please upload JPG, PNG, WebP or PDF.`,
          );
        }

        const fileName = `${uuid}.webp`;
        const filePath = path.join(prescriptionsDir, fileName);

        // Convert to WebP, clamp width to 2000px if larger
        await sharp(file.buffer)
          .rotate()
          .resize({ width: 2000, withoutEnlargement: true })
          .webp({ quality: 85 })
          .toFile(filePath);

        relativeUrl = `/uploads/prescriptions/${fileName}`;
      } catch (err: unknown) {
        if (err instanceof BadRequestException) throw err;
        this.logger.error('Failed to process prescription image', err);
        throw new BadRequestException('Invalid image file');
      }
    }

    const prescription = await this.prisma.prescription.create({
      data: {
        userId: user?.id ?? null,
        phone: dto.phone.trim(),
        imageUrl: relativeUrl,
        notes: dto.notes?.trim() || null,
        status: PrescriptionStatus.PENDING,
      },
    });

    // Notify admins
    try {
      await this.prisma.adminNotification.create({
        data: {
          type: 'NEW_PRESCRIPTION',
          title: 'নতুন প্রেসক্রিপশন জমা হয়েছে',
          body: `ফোন: ${dto.phone.trim()}${
            dto.notes ? ` | নোট: ${dto.notes.trim().slice(0, 80)}` : ''
          }`,
          entityType: 'PRESCRIPTION',
          entityId: prescription.id,
          data: {
            prescriptionId: prescription.id,
            phone: dto.phone.trim(),
            userId: user?.id ?? null,
            imageUrl: relativeUrl,
          },
        },
      });
    } catch (notifErr) {
      this.logger.warn('Failed to create admin notification for prescription', notifErr);
    }

    return prescription;
  }

  /**
   * Get all prescriptions uploaded by a customer
   */
  async findByCustomer(userId: string) {
    return this.prisma.prescription.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Customer deletes their own prescription
   */
  async removeByCustomer(userId: string, id: string) {
    const rx = await this.prisma.prescription.findUnique({
      where: { id },
    });

    if (!rx) {
      throw new NotFoundException('Prescription not found');
    }

    if (rx.userId !== userId) {
      throw new ForbiddenException('You cannot delete this prescription');
    }

    // Try deleting file from disk
    if (rx.imageUrl?.startsWith('/uploads/')) {
      const subPath = rx.imageUrl.replace(/^\/uploads\//, '');
      const fullPath = path.join(this.rootDir, subPath);
      await fs.unlink(fullPath).catch(() => {});
    }

    await this.prisma.prescription.delete({
      where: { id },
    });

    return { success: true };
  }

  /**
   * Admin list with pagination and status filter
   */
  async listForAdmin(query: {
    page?: number;
    limit?: number;
    status?: PrescriptionStatus;
    search?: string;
  }) {
    const page = Math.max(1, Number(query.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query.limit) || 20));
    const skip = (page - 1) * limit;

    const where: any = {};
    if (query.status) {
      where.status = query.status;
    }
    if (query.search?.trim()) {
      const s = query.search.trim();
      where.OR = [
        { phone: { contains: s, mode: 'insensitive' } },
        { notes: { contains: s, mode: 'insensitive' } },
        { user: { name: { contains: s, mode: 'insensitive' } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.prescription.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true, phone: true, email: true, avatarUrl: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.prescription.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Admin update prescription status
   */
  async updateStatus(
    id: string,
    status: PrescriptionStatus,
    adminNotes?: string,
  ) {
    const rx = await this.prisma.prescription.findUnique({ where: { id } });
    if (!rx) throw new NotFoundException('Prescription not found');

    return this.prisma.prescription.update({
      where: { id },
      data: {
        status,
        ...(adminNotes !== undefined ? { adminNotes } : {}),
      },
      include: {
        user: {
          select: { id: true, name: true, phone: true, email: true },
        },
      },
    });
  }

  /**
   * Admin delete
   */
  async removeByAdmin(id: string) {
    const rx = await this.prisma.prescription.findUnique({ where: { id } });
    if (!rx) throw new NotFoundException('Prescription not found');

    if (rx.imageUrl?.startsWith('/uploads/')) {
      const subPath = rx.imageUrl.replace(/^\/uploads\//, '');
      const fullPath = path.join(this.rootDir, subPath);
      await fs.unlink(fullPath).catch(() => {});
    }

    await this.prisma.prescription.delete({ where: { id } });
    return { success: true };
  }
}

