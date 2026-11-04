import React from 'react';
import { useRouter } from 'expo-router';
import { Button } from '@/components/ui/Button';
import { Icon } from '@/components/ui/Icon';
import { useCartStore } from '@/store/useCartStore';
import { toast } from '@/store/useToastStore';
import { haptics } from '@/services/haptics';
import { PrescriptionRecord } from '../types';

export interface PrescriptionOrderButtonProps {
  prescription: PrescriptionRecord;
}

export function PrescriptionOrderButton({ prescription }: PrescriptionOrderButtonProps) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const isEligible = prescription.status === 'REVIEWED' || prescription.status === 'ORDER_CREATED';

  if (!isEligible) return null;

  const handleOrder = () => {
    haptics.success();
    // Push approved prescription medication package to cart
    addItem(
      {
        id: `rx-${prescription.id}`,
        productId: `rx-${prescription.id}`,
        name: `Prescription Meds (#${prescription.id.slice(0, 6).toUpperCase()})`,
        price: 250,
        unit: 'package',
      },
      1,
    );

    toast.success('Added to Bag', 'Approved prescription medications added to your cart');
    router.push('/(tabs)/cart');
  };

  return (
    <Button
      title="Order Approved Medicines"
      variant="primary"
      size="sm"
      onPress={handleOrder}
      leftIcon={<Icon name="ShoppingBag" size={14} color="#ffffff" />}
    />
  );
}
