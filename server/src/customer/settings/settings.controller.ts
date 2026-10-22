import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { SettingsService } from '../../common/settings';
import {
  MOBILE_BANKING_METHODS,
  mobileAccount,
} from '../../common/settings/settings.types';
import { ShippingService } from '../shipping/shipping.service';

@ApiTags('Customer - Settings')
@Controller('customer/settings')
export class SettingsController {
  constructor(
    private readonly settings: SettingsService,
    private readonly shippingService: ShippingService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({
    summary:
      'Public store settings: store info, payment options, delivery rules, the map to draw, return policy',
  })
  async getPublicSettings() {
    const [site, payment, returns, delivery, maps] = await Promise.all([
      this.settings.get('site'),
      this.settings.get('payment'),
      this.settings.get('returns'),
      this.shippingService.getOptions(),
      this.settings.get('maps'),
    ]);

    const paymentMethods: string[] = [];
    if (payment.codEnabled) paymentMethods.push('CASH_ON_DELIVERY');
    const accounts: Record<string, ReturnType<typeof mobileAccount>> = {};
    const fallbackPhone = site.hotline || site.whatsapp || '01834529197';
    for (const m of MOBILE_BANKING_METHODS) {
      const k = m.toLowerCase() as 'bkash' | 'nagad' | 'rocket';
      const isEnabled = Boolean(payment[`${k}Enabled`]);
      const acc = isEnabled ? mobileAccount(payment, m, fallbackPhone) : null;
      accounts[k] = acc;
      if (isEnabled) paymentMethods.push(m);
    }

    return {
      site,
      payment: {
        methods: paymentMethods,
        // one entry per mobile-banking method: where to send the money
        ...accounts,
      },
      delivery,
      // only what the browser needs to draw a map: the secret server keys never leave the server
      maps: {
        provider: maps.provider,
        distanceCalculation: delivery.distanceCalculation ?? 'direct',
        googleBrowserKey:
          (delivery.distanceCalculation ?? 'direct') === 'direct' || maps.provider === 'google'
            ? maps.googleBrowserKey
            : null,
        osmTileUrl: maps.osmTileUrl,
        enableMapSearch: maps.enableMapSearch ?? true,
        dynamicPlaceNames: maps.dynamicPlaceNames ?? false,
      },
      returns,
    };
  }
}
