import React, { useState } from 'react';
import { Share } from 'react-native';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';

export interface OrderInvoiceButtonProps {
  orderId: string;
  orderNumber: string;
}

export function OrderInvoiceButton({ orderId, orderNumber }: OrderInvoiceButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleShareInvoice = async () => {
    setLoading(true);
    haptics.light();
    try {
      const invoiceUrl = `https://bazarshodai.com/orders/${orderNumber}/invoice`;
      await Share.share({
        title: `Invoice #${orderNumber}`,
        message: `Order Invoice #${orderNumber} from Bazar Shodai: ${invoiceUrl}`,
        url: invoiceUrl,
      });
      toast.success('Invoice Ready', 'Invoice link shared');
    } catch {
      toast.error('Error', 'Could not open invoice share sheet');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      title="Download Invoice"
      variant="outline"
      size="sm"
      onPress={handleShareInvoice}
      loading={loading}
      leftIcon={<Icon name="FileText" size={14} color="#0b6234" />}
    />
  );
}
