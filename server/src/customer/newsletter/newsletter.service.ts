import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { SettingsService } from '../../common/settings';
import { MailService, escapeHtml, renderEmailLayout } from '../../common/mail';
import { tr } from '../../common/i18n';

const SUBSCRIBED_MESSAGE = 'Thanks for subscribing!';

@Injectable()
export class NewsletterService {
  private readonly logger = new Logger(NewsletterService.name);

  constructor(
    private prisma: PrismaService,
    private settings: SettingsService,
    private mail: MailService,
    private config: ConfigService,
  ) {}

  // Idempotent: subscribing twice gives the same answer, so the endpoint
  // does not reveal whether an email is already on the list.
  async subscribe(email: string, source?: string, userId?: string) {
    const existing = await this.prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    let subscriber = existing;
    let isNew = false;
    if (!existing) {
      try {
        subscriber = await this.prisma.newsletterSubscriber.create({
          data: { email, source, userId, unsubscribeToken: newToken() },
        });
        isNew = true;
      } catch (error) {
        // Two requests raced to create the same email: already subscribed.
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2002'
        ) {
          return { success: true, message: SUBSCRIBED_MESSAGE };
        }
        throw error;
      }
    } else if (existing.status === 'UNSUBSCRIBED') {
      subscriber = await this.prisma.newsletterSubscriber.update({
        where: { id: existing.id },
        data: {
          status: 'SUBSCRIBED',
          subscribedAt: new Date(),
          unsubscribedAt: null,
          unsubscribeToken: newToken(),
          ...(userId && !existing.userId ? { userId } : {}),
        },
      });
      isNew = true;
    }

    if (userId) {
      await this.prisma.user.updateMany({
        where: { id: userId, email: { equals: email, mode: 'insensitive' } },
        data: { newsletter: true },
      });
    }

    if (isNew && subscriber) {
      void this.sendWelcome(subscriber.email, subscriber.unsubscribeToken);
    }
    return { success: true, message: SUBSCRIBED_MESSAGE };
  }

  async unsubscribe(token: string) {
    const sub = await this.prisma.newsletterSubscriber.findUnique({
      where: { unsubscribeToken: token },
    });
    if (sub && sub.status === 'SUBSCRIBED') {
      await this.prisma.newsletterSubscriber.update({
        where: { id: sub.id },
        data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
      });
      await this.prisma.user.updateMany({
        where: { email: { equals: sub.email, mode: 'insensitive' } },
        data: { newsletter: false },
      });
    }
    // Same answer for unknown tokens: nothing to enumerate.
    return {
      success: true,
      message: 'You have been unsubscribed from our newsletter.',
    };
  }

  private async sendWelcome(email: string, token: string) {
    try {
      const settings = await this.settings.get('email');
      if (!settings.sendNewsletterWelcome) return;
      const site = await this.settings.get('site');
      const base = (this.config.get<string>('frontend.url') ?? '').replace(
        /\/$/,
        '',
      );
      const unsubscribe = `${base}/newsletter/unsubscribe?token=${token}`;
      // subscribers have no account language, so the welcome is sent in Bangla
      const lang = 'bn' as const;
      const subject = tr(lang, 'news.subject', { store: site.storeName });
      await this.mail.send({
        to: email,
        subject,
        text: `${tr(lang, 'news.body', { store: site.storeName })}\n\n${tr(lang, 'news.unsubscribe')}: ${unsubscribe}`,
        html: renderEmailLayout(site, {
          title: subject,
          lang,
          bodyHtml: `<h2 style="margin:0 0 12px;font-size:20px">${escapeHtml(tr(lang, 'news.heading'))}</h2><p>${escapeHtml(tr(lang, 'news.body', { store: site.storeName }))}</p>`,
          footerHtml: `<div><a href="${escapeHtml(unsubscribe)}" style="color:#666">${escapeHtml(tr(lang, 'news.unsubscribe'))}</a></div>`,
        }),
      });
    } catch (error) {
      this.logger.warn(
        `Newsletter welcome email failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }
}

function newToken() {
  return randomBytes(24).toString('hex');
}
