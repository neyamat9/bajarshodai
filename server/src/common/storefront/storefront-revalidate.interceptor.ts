import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { StorefrontSyncService } from './storefront-sync.service';

const WRITES = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/** Which cached storefront data an admin change makes stale (the same names the storefront tags its fetches with). */
function tagsFor(path: string): string[] {
  // Customer checkout / orders should NEVER invalidate the static product cache.
  // Live stock and prices are already verified in real-time on cart & product mount.
  if (/\/customer\/(orders|checkout)/i.test(path)) return [];

  // Note: POST /customer/reviews and POST /customer/questions do NOT contain a product slug in
  // their URLs, so they fall through to the default [] below — meaning a new review does not
  // immediately wipe a product's cache. The existing 5-minute ISR cycle picks it up.
  const m = /\/admin\/([a-z-]+)/i.exec(path);
  if (!m) return [];
  switch (m[1].toLowerCase()) {
    case 'products':
    case 'product':
    case 'flash-deals':
      return ['products', 'home'];
    case 'inventory':
    case 'orders':
    case 'returns':
      return []; // Do not purge public marketing catalog on routine status/stock changes
    case 'categories':
    case 'category':
    case 'sub-categories':
    case 'sub-category':
      return ['categories'];
    case 'brands':
    case 'brand':
      return ['brands'];
    case 'banners':
      return ['banners', 'home'];
    case 'settings':
      return ['settings', 'shipping'];
    default:
      return [];
  }
}

/**
 * After an admin successfully changes a product, order, category, brand, banner or setting, tell the storefront to refresh its
 * shared page cache for that data right away (instead of waiting for the 5-minute timer), and bump the content version that
 * open browsers poll. Fire-and-forget: a storefront that is down or not configured never affects the admin's save.
 */
@Injectable()
export class StorefrontRevalidateInterceptor implements NestInterceptor {
  constructor(private readonly sync: StorefrontSyncService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const req = context.switchToHttp().getRequest<Request>();
    if (!WRITES.has(req.method)) return next.handle();
    const staticTags = tagsFor(req.originalUrl ?? req.url);

    return next.handle().pipe(
      tap({
        next: (body: unknown) => {
          const tags = [...staticTags];
          if (body && typeof body === 'object') {
            const b = body as { slug?: string; product?: { slug?: string } };
            const slug = b.slug ?? b.product?.slug;
            const url = (req.originalUrl ?? req.url).toLowerCase();
            if (slug) {
              if (url.includes('/admin/categor')) {
                tags.push(`category-${slug}`);
              } else if (url.includes('/admin/brand')) {
                tags.push(`brand-${slug}`);
              } else if (
                url.includes('/admin/product') ||
                url.includes('/customer/reviews') ||
                url.includes('/customer/questions')
              ) {
                tags.push(`product-${slug}`);
              }
            }
          }
          if (tags.length) this.sync.notify(tags);
        },
      }),
    );
  }
}
