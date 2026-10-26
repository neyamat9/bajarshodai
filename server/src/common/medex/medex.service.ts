import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { MedExMedicineDetail, MedExSearchResult } from './medex.types';

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const THROTTLE_MS = 800;
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

@Injectable()
export class MedExService {
  private readonly logger = new Logger(MedExService.name);
  private lastRequestTime = 0;
  private readonly cache = new Map<string, CacheEntry<unknown>>();

  /**
   * Search MedEx for a brand name, generic name, or medicine keyword.
   */
  async search(query: string): Promise<MedExSearchResult[]> {
    const q = query.trim();
    if (!q || q.length < 2) return [];

    const cacheKey = `search:${q.toLowerCase()}`;
    const cached = this.getCache<MedExSearchResult[]>(cacheKey);
    if (cached) return cached;

    try {
      await this.throttle();
      const url = `https://medex.com.bd/search?search=${encodeURIComponent(q)}`;
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        this.logger.warn(`MedEx search responded with status ${res.status} for "${q}"`);
        return [];
      }

      const html = await res.text();
      const $ = cheerio.load(html);
      const results: MedExSearchResult[] = [];

      $('a[href*="/brands/"]').each((_, el) => {
        const href = $(el).attr('href');
        const rawText = $(el).text().trim();
        if (!href || !rawText) return;

        // URL format: https://medex.com.bd/brands/10592/napa-extra-500-mg-tablet
        const idMatch = href.match(/\/brands\/(\d+)/);
        const medexId = idMatch ? parseInt(idMatch[1], 10) : 0;
        if (!medexId || results.some((r) => r.medexId === medexId)) return;

        // Parse format e.g. "Napa Extra 500 mg+65 mg (Tablet)"
        let name = rawText;
        let strength = '';
        let dosageForm = '';

        const formMatch = name.match(/\(([^)]+)\)$/);
        if (formMatch) {
          dosageForm = formMatch[1].trim();
          name = name.replace(/\([^)]+\)$/, '').trim();
        }

        const strengthMatch = name.match(/(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|gm|%|iu|u)(?:\s*\+\s*\d+(?:\.\d+)?\s*(?:mg|ml|mcg|gm|%|iu|u))*)/i);
        if (strengthMatch) {
          strength = strengthMatch[1].trim();
        }

        results.push({
          medexId,
          name,
          dosageForm,
          strength,
          url: href.startsWith('http') ? href : `https://medex.com.bd${href}`,
        });
      });

      this.setCache(cacheKey, results);
      return results;
    } catch (err) {
      this.logger.error(`Failed to search MedEx for "${q}": ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  /**
   * Fetch full pharmaceutical and live pricing details for a medicine from MedEx.
   */
  async getBrandDetail(urlOrId: string | number): Promise<MedExMedicineDetail | null> {
    let url = typeof urlOrId === 'number' || /^\d+$/.test(String(urlOrId))
      ? `https://medex.com.bd/brands/${urlOrId}`
      : String(urlOrId);

    if (!url.startsWith('http')) {
      url = `https://medex.com.bd${url.startsWith('/') ? '' : '/'}${url}`;
    }

    const cacheKey = `detail:${url}`;
    const cached = this.getCache<MedExMedicineDetail>(cacheKey);
    if (cached) return cached;

    try {
      await this.throttle();
      const res = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        signal: AbortSignal.timeout(12000),
      });

      if (!res.ok) {
        this.logger.warn(`MedEx brand detail responded with status ${res.status} for ${url}`);
        return null;
      }

      const html = await res.text();
      const $ = cheerio.load(html);

      // MedEx ID from final URL or href
      const idMatch = (res.url || url).match(/\/brands\/(\d+)/);
      const medexId = idMatch ? parseInt(idMatch[1], 10) : 0;

      // Brand Title, Strength, Dosage Form
      const rawHeader = $('h1.page-heading-1-l, h1').first().text().trim();
      const lines = rawHeader.split('\n').map((l) => l.trim()).filter(Boolean);
      const name = lines[0] || '';
      const dosageForm = lines[1] || '';

      const genericLink = $('a[href*="/generics/"]').first();
      const genericName = genericLink.text().trim();
      const genericHref = genericLink.attr('href') || '';
      const genericSlugMatch = genericHref.match(/\/generics\/\d+\/([a-z0-9-]+)/);
      const genericSlug = genericSlugMatch ? genericSlugMatch[1] : genericName.toLowerCase().replace(/[^a-z0-9]+/g, '-');

      const companyLink = $('a[href*="/companies/"]').first();
      const companyName = companyLink.text().trim();

      // Extract Strength from title or subtitle
      const strengthEl = $('h1 small, .brand-strength').first();
      let strength = strengthEl.text().trim();
      if (!strength) {
        const sm = name.match(/(\d+(?:\.\d+)?\s*(?:mg|ml|mcg|gm|%|iu|u)(?:\s*\+\s*\d+(?:\.\d+)?\s*(?:mg|ml|mcg|gm|%|iu|u))*)/i);
        if (sm) strength = sm[1].trim();
      }

      // Package pricing parse
      // Format example: "Unit Price: ৳ 2.50 (11 x 12: ৳ 330.00) Strip Price: ৳ 30.00"
      let unitPrice: number | null = null;
      let stripPrice: number | null = null;
      let boxPrice: number | null = null;
      let packSizeInfo: string | null = null;

      const pageText = $('body').text();
      const unitMatch = pageText.match(/Unit Price:\s*৳\s*([0-9.,]+)/i);
      if (unitMatch) {
        unitPrice = parseFloat(unitMatch[1].replace(/,/g, ''));
      }

      const stripMatch = pageText.match(/Strip Price:\s*৳\s*([0-9.,]+)/i);
      if (stripMatch) {
        stripPrice = parseFloat(stripMatch[1].replace(/,/g, ''));
      }

      const boxMatch = pageText.match(/\(([^:)]+):\s*৳\s*([0-9.,]+)\)/i);
      if (boxMatch) {
        packSizeInfo = boxMatch[1].trim();
        boxPrice = parseFloat(boxMatch[2].replace(/,/g, ''));
      }

      // Fallback: if no unit price was parsed via regex, look for any price tag
      if (unitPrice === null) {
        const anyPrice = pageText.match(/৳\s*([0-9.,]+)/);
        if (anyPrice) unitPrice = parseFloat(anyPrice[1].replace(/,/g, ''));
      }

      const detail: MedExMedicineDetail = {
        medexId,
        medexUrl: res.url || url,
        name,
        dosageForm,
        strength,
        genericName,
        genericSlug,
        companyName,
        unitPrice: isNaN(unitPrice as number) ? null : unitPrice,
        stripPrice: isNaN(stripPrice as number) ? null : stripPrice,
        boxPrice: isNaN(boxPrice as number) ? null : boxPrice,
        packSizeInfo,
      };

      this.setCache(cacheKey, detail);
      return detail;
    } catch (err) {
      this.logger.error(`Failed to fetch MedEx details for "${url}": ${err instanceof Error ? err.message : String(err)}`);
      return null;
    }
  }

  private async throttle(): Promise<void> {
    const now = Date.now();
    const elapsed = now - this.lastRequestTime;
    if (elapsed < THROTTLE_MS) {
      await new Promise((r) => setTimeout(r, THROTTLE_MS - elapsed));
    }
    this.lastRequestTime = Date.now();
  }

  private getCache<T>(key: string): T | null {
    const entry = this.cache.get(key) as CacheEntry<T> | undefined;
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  private setCache<T>(key: string, data: T): void {
    if (this.cache.size > 2000) {
      this.cache.clear();
    }
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + CACHE_TTL_MS,
    });
  }
}
