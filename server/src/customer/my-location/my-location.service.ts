import { BadRequestException, GoneException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes } from 'crypto';
import type { LocationSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MapsService } from '../../common/maps';
import { SettingsService } from '../../common/settings';
import { normalizeBdPhone } from '../../common/utils/phone';
import type { CartOwner } from '../../common/cart/cart-owner';
import { ShippingService } from '../shipping/shipping.service';

export interface ShareInput {
  lat: number;
  lng: number;
  accuracyM?: number;
  source?: LocationSource;
  phone?: string;
}

const DEFAULT_LINK_HOURS = 24;

@Injectable()
export class MyLocationService {
  constructor(
    private prisma: PrismaService,
    private maps: MapsService,
    private shipping: ShippingService,
    private settings: SettingsService,
    private config: ConfigService,
  ) {}

  /** The place name in both languages (two cached lookups; either can be null). */
  private async names(lat: number, lng: number) {
    const maps = await this.settings.get('maps');
    if (!maps.dynamicPlaceNames) {
      return { placeName: null, placeNameBn: null };
    }
    const [en, bn] = await Promise.all([this.maps.placeName({ lat, lng }, 'en'), this.maps.placeName({ lat, lng }, 'bn')]);
    return { placeName: en ?? bn ?? null, placeNameBn: bn ?? en ?? null };
  }

  private view(l: { id: string; lat: number; lng: number; accuracyM: number | null; placeName: string | null; placeNameBn: string | null; source: LocationSource; capturedAt: Date }) {
    return {
      id: l.id,
      lat: l.lat,
      lng: l.lng,
      accuracyM: l.accuracyM,
      placeName: l.placeName,
      placeNameBn: l.placeNameBn,
      source: l.source,
      capturedAt: l.capturedAt,
    };
  }

  private ownerWhere(owner: CartOwner) {
    return owner.userId ? { userId: owner.userId } : { deviceToken: owner.guestToken, userId: null };
  }

  /** The customer pressed "share my location": keep it (that press is the consent) and say what delivery would cost. */
  async share(owner: CartOwner, input: ShareInput, subtotal = 0) {
    const names = await this.names(input.lat, input.lng);
    const phone = input.phone ? normalizeBdPhone(input.phone) : null;
    const saved = await this.prisma.customerLocation.create({
      data: {
        userId: owner.userId ?? null,
        deviceToken: owner.userId ? null : owner.guestToken,
        phone,
        lat: input.lat,
        lng: input.lng,
        accuracyM: input.accuracyM ?? null,
        source: input.source ?? 'GPS',
        placeName: names.placeName,
        placeNameBn: names.placeNameBn,
      },
    });
    await this.trim(owner);
    return { location: this.view(saved), quote: await this.shipping.quote(subtotal, { lat: input.lat, lng: input.lng }) };
  }

  /** Only the 10 newest shared places are kept per customer or device. */
  private async trim(owner: CartOwner) {
    const rows = await this.prisma.customerLocation.findMany({
      where: this.ownerWhere(owner),
      orderBy: { capturedAt: 'desc' },
      skip: 10,
      select: { id: true },
    });
    if (rows.length) await this.prisma.customerLocation.deleteMany({ where: { id: { in: rows.map((r) => r.id) } } });
  }

  /** The newest place this customer (or this device) shared, if any. */
  async saved(owner: CartOwner, subtotal = 0) {
    const row = await this.prisma.customerLocation.findFirst({ where: this.ownerWhere(owner), orderBy: { capturedAt: 'desc' } });
    if (!row) return { location: null, quote: null };
    return { location: this.view(row), quote: await this.shipping.quote(subtotal, { lat: row.lat, lng: row.lng }) };
  }

  /** "Forget my location": removes every place this customer or device shared. */
  async forget(owner: CartOwner) {
    const { count } = await this.prisma.customerLocation.deleteMany({ where: this.ownerWhere(owner) });
    return { success: true, removed: count };
  }

  // ---------------------------------------------------------------- share links

  private newToken() {
    return randomBytes(18).toString('base64url');
  }

  async createRequest(staffId: string, input: { phone?: string; name?: string; orderId?: string; hours?: number }) {
    const hours = input.hours ?? Number(process.env.LOCATION_LINK_TTL_HOURS || DEFAULT_LINK_HOURS);
    const req = await this.prisma.locationRequest.create({
      data: {
        token: this.newToken(),
        phone: input.phone ? normalizeBdPhone(input.phone) : null,
        name: input.name?.trim() || null,
        orderId: input.orderId ?? null,
        expiresAt: new Date(Date.now() + hours * 3600 * 1000),
        createdByStaffId: staffId,
      },
    });
    return this.requestView(req);
  }

  private requestView(r: {
    id: string; token: string; phone: string | null; name: string | null; orderId: string | null; status: string; expiresAt: Date;
    lat: number | null; lng: number | null; accuracyM: number | null; placeName: string | null; placeNameBn: string | null;
    distanceKm: unknown; deliveryFee: unknown; sharedAt: Date | null; createdAt: Date;
  }) {
    const base = this.config.get<string>('frontend.url') ?? 'http://localhost:3000';
    const expired = r.status === 'PENDING' && r.expiresAt.getTime() < Date.now();
    return {
      id: r.id,
      token: r.token,
      url: `${base.replace(/\/+$/, '')}/l/${r.token}`,
      phone: r.phone,
      name: r.name,
      orderId: r.orderId,
      status: expired ? 'EXPIRED' : r.status,
      expiresAt: r.expiresAt,
      lat: r.lat,
      lng: r.lng,
      accuracyM: r.accuracyM,
      placeName: r.placeName,
      placeNameBn: r.placeNameBn,
      distanceKm: r.distanceKm === null || r.distanceKm === undefined ? null : Number(r.distanceKm),
      deliveryFee: r.deliveryFee === null || r.deliveryFee === undefined ? null : Number(r.deliveryFee),
      sharedAt: r.sharedAt,
      createdAt: r.createdAt,
    };
  }

  async listRequests(q: { status?: string; phone?: string; orderId?: string; limit?: number }) {
    const rows = await this.prisma.locationRequest.findMany({
      where: {
        ...(q.status ? { status: q.status as 'PENDING' | 'SHARED' | 'EXPIRED' } : {}),
        ...(q.phone ? { phone: normalizeBdPhone(q.phone) } : {}),
        ...(q.orderId ? { orderId: q.orderId } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take: Math.min(q.limit ?? 50, 200),
    });
    return rows.map((r) => this.requestView(r));
  }

  async getRequest(id: string) {
    const r = await this.prisma.locationRequest.findUnique({ where: { id } });
    if (!r) throw new NotFoundException('Location request not found');
    return this.requestView(r);
  }

  /** What the public page shows before the customer shares. */
  async publicInfo(token: string) {
    const r = await this.byToken(token);
    const [site, delivery] = await Promise.all([this.settings.get('site'), this.shipping.getOptions()]);
    return {
      status: r.status,
      name: r.name,
      expiresAt: r.expiresAt,
      shop: { name: site.storeName, hotline: site.hotline, whatsapp: site.whatsapp },
      delivery,
      // already shared: show what was received so a reopened link is not blank
      shared: r.status === 'SHARED' ? { placeName: r.placeName, placeNameBn: r.placeNameBn, distanceKm: r.distanceKm !== null ? Number(r.distanceKm) : null, deliveryFee: r.deliveryFee !== null ? Number(r.deliveryFee) : null } : null,
    };
  }

  private async byToken(token: string) {
    const r = await this.prisma.locationRequest.findUnique({ where: { token } });
    if (!r) throw new NotFoundException('This link is not valid');
    if (r.status === 'PENDING' && r.expiresAt.getTime() < Date.now()) {
      await this.prisma.locationRequest.update({ where: { id: r.id }, data: { status: 'EXPIRED' } });
      return { ...r, status: 'EXPIRED' as const };
    }
    return r;
  }

  /** The customer opens the link and shares: nothing else is needed, no account. */
  async submit(token: string, input: { lat: number; lng: number; accuracyM?: number }) {
    const r = await this.byToken(token);
    if (r.status === 'EXPIRED') throw new GoneException('This link has expired. Ask the shop for a new one.');
    if (r.status === 'SHARED') throw new BadRequestException('This link was already used. Thank you!');

    const [names, quote] = await Promise.all([this.names(input.lat, input.lng), this.shipping.quote(0, { lat: input.lat, lng: input.lng })]);
    await this.prisma.$transaction(async (tx) => {
      // claim it first so a double tap cannot share twice
      const claimed = await tx.locationRequest.updateMany({
        where: { id: r.id, status: 'PENDING' },
        data: {
          status: 'SHARED',
          lat: input.lat,
          lng: input.lng,
          accuracyM: input.accuracyM ?? null,
          placeName: names.placeName,
          placeNameBn: names.placeNameBn,
          distanceKm: quote.distanceKm,
          deliveryFee: quote.calculatedFee,
          sharedAt: new Date(),
        },
      });
      if (claimed.count === 0) throw new BadRequestException('This link was already used. Thank you!');
      // a customer with this phone number also gets it saved, so the next order is prefilled
      if (r.phone) {
        const user = await tx.user.findFirst({ where: { phone: r.phone }, select: { id: true } });
        await tx.customerLocation.create({
          data: {
            userId: user?.id ?? null,
            phone: r.phone,
            lat: input.lat,
            lng: input.lng,
            accuracyM: input.accuracyM ?? null,
            placeName: names.placeName,
            placeNameBn: names.placeNameBn,
            source: 'LINK',
          },
        });
      }
    });
    return { success: true, placeName: names.placeName, placeNameBn: names.placeNameBn, quote };
  }

  /** The newest place a customer shared, for the dashboard (their account, or their phone number). */
  async lastForCustomer(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { phone: true } });
    const row = await this.prisma.customerLocation.findFirst({
      where: { OR: [{ userId }, ...(user?.phone ? [{ phone: user.phone }] : [])] },
      orderBy: { capturedAt: 'desc' },
    });
    if (!row) return null;
    return { ...this.view(row), quote: await this.shipping.quote(0, { lat: row.lat, lng: row.lng }) };
  }
}
