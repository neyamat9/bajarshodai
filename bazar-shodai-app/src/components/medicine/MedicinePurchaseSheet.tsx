import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius, TouchTarget } from '@/constants/layout';
import { formatBdt, toBengaliNumerals } from '@/utils/format';
import { haptics } from '@/services/haptics';
import {
  calculateMedicinePrice,
  parseUnitsPerStrip,
  DiscountEligibility,
  MedicinePriceBreakdown,
  MedicineMetadataInput,
} from '@/services/medicinePricing';

export interface MedicinePurchaseSheetProps {
  visible: boolean;
  product: {
    id: string;
    name: string;
    nameBn?: string;
    slug?: string;
    price: number;
    originalPrice?: number;
    dosageForm?: string;
    strength?: string;
    manufacturer?: string;
    genericName?: string;
    imageUrl?: string;
    stock?: number;
    unitsPerStrip?: number;
    mrpUnit?: number;
    mrpStrip?: number;
    packSizeInfo?: string;
    discountPercent?: number;
    discountEligibility?: DiscountEligibility;
    meta?: MedicineMetadataInput | null;
  };
  onClose: () => void;
  onConfirm: (breakdown: MedicinePriceBreakdown) => void;
  globalDiscountEligibility?: DiscountEligibility;
  defaultDiscountPercent?: number;
}

export function MedicinePurchaseSheet({
  visible,
  product,
  onClose,
  onConfirm,
  globalDiscountEligibility = 'MIN_STRIP_ONLY',
  defaultDiscountPercent = 0,
}: MedicinePurchaseSheetProps) {
  const unitsPerStrip =
    product.unitsPerStrip ||
    parseUnitsPerStrip(
      product.meta || {
        dosageForm: product.dosageForm,
        strength: product.strength,
        genericName: product.genericName,
        manufacturer: product.manufacturer,
        unitsPerStrip: product.unitsPerStrip,
        mrpUnit: product.mrpUnit,
        mrpStrip: product.mrpStrip,
        packSizeInfo: product.packSizeInfo,
        discountEligibility: product.discountEligibility,
      },
    );

  const [prevId, setPrevId] = useState(product.id);
  const [strips, setStrips] = useState(1);
  const [looseTabs, setLooseTabs] = useState(0);

  // Reset counters when rendered with a new product
  if (product.id !== prevId) {
    setPrevId(product.id);
    setStrips(1);
    setLooseTabs(0);
  }

  const discountPercent =
    product.discountPercent !== undefined && product.discountPercent > 0
      ? product.discountPercent
      : product.originalPrice && product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : defaultDiscountPercent;

  const breakdown = calculateMedicinePrice({
    strips,
    looseTabs,
    stripPrice: product.price,
    tabPrice: product.mrpUnit,
    discountPercent,
    discountEligibility: product.discountEligibility || globalDiscountEligibility,
    meta: product.meta,
    unitsPerStrip,
  });

  const handleStripMinus = () => {
    void haptics.selection().catch(() => {});
    if (strips > 0) {
      if (strips === 1 && looseTabs === 0) {
        setLooseTabs(1);
      }
      setStrips((s) => Math.max(0, s - 1));
    }
  };

  const handleStripPlus = () => {
    void haptics.selection().catch(() => {});
    setStrips((s) => s + 1);
  };

  const handleLooseMinus = () => {
    void haptics.selection().catch(() => {});
    if (looseTabs > 0) {
      setLooseTabs((t) => t - 1);
    } else if (strips > 0) {
      // If 0 loose tabs, can transition
      setLooseTabs(0);
    }
  };

  const handleLoosePlus = () => {
    void haptics.selection().catch(() => {});
    const nextTabs = looseTabs + 1;
    if (nextTabs >= unitsPerStrip) {
      // Auto-rollover into 1 full pata!
      void haptics.success().catch(() => {});
      setStrips((s) => s + 1);
      setLooseTabs(0);
    } else {
      setLooseTabs(nextTabs);
    }
  };

  const handleConfirm = () => {
    void haptics.selection().catch(() => {});
    onConfirm(breakdown);
    onClose();
  };

  const displayName = product.nameBn || product.name;
  const isMinStripOnly =
    (product.discountEligibility || globalDiscountEligibility) === 'MIN_STRIP_ONLY';

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheetContainer} onPress={(e) => e.stopPropagation()}>
          {/* Sheet Handle */}
          <View style={styles.handleWrap}>
            <View style={styles.handleBar} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerInfo}>
              <View style={styles.titleRow}>
                <Text style={styles.medicineName} numberOfLines={1}>
                  {displayName}
                </Text>
                {product.strength ? (
                  <Text style={styles.strengthText}>{product.strength}</Text>
                ) : null}
              </View>

              <View style={styles.metaRow}>
                {product.genericName ? (
                  <Text style={styles.genericText} numberOfLines={1}>
                    {product.genericName}
                  </Text>
                ) : null}
                {product.manufacturer ? (
                  <Text style={styles.manufacturerText} numberOfLines={1}>
                    • {product.manufacturer}
                  </Text>
                ) : null}
              </View>

              {/* Units per Pata badge */}
              <View style={styles.stripBadge}>
                <Icon name="Pill" size={12} color="#0b6234" />
                <Text style={styles.stripBadgeText}>
                  {toBengaliNumerals(unitsPerStrip)}টি {product.dosageForm || 'ট্যাবলেট'} / পাতা (Strip)
                </Text>
              </View>
            </View>

            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Icon name="X" size={20} color="#64748b" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} contentContainerStyle={styles.bodyContent}>
            {/* ── Option 1: Full Pata (পাতা) ─────────────────────────── */}
            <View style={[styles.optionCard, strips > 0 && styles.optionCardActive]}>
              <View style={styles.optionHeader}>
                <View style={styles.optionIconBox}>
                  <Icon name="Layers" size={20} color="#0b6234" />
                </View>

                <View style={styles.optionInfo}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>সম্পূর্ণ পাতা (Full Strip)</Text>
                    {discountPercent > 0 && breakdown.effectiveStripPrice < breakdown.stripPrice ? (
                      <View style={styles.discountPill}>
                        <Text style={styles.discountPillText}>
                          {toBengaliNumerals(discountPercent)}% ছাড়
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.effectivePrice}>
                      {formatBdt(breakdown.effectiveStripPrice)}
                    </Text>
                    {breakdown.effectiveStripPrice < breakdown.stripPrice ? (
                      <Text style={styles.mrpStrike}>{formatBdt(breakdown.stripPrice)}</Text>
                    ) : null}
                    <Text style={styles.unitSubtext}>/ পাতা</Text>
                  </View>
                </View>

                {/* Stepper for Strips */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    onPress={handleStripMinus}
                    disabled={strips <= 0}
                    style={[styles.stepperBtn, strips <= 0 && styles.stepperBtnDisabled]}
                    accessibilityLabel="Decrease strips"
                  >
                    <Icon name="Minus" size={14} color={strips <= 0 ? '#94a3b8' : '#0b6234'} />
                  </TouchableOpacity>

                  <View style={styles.qtyDisplay}>
                    <Text style={styles.qtyDisplayText}>{toBengaliNumerals(strips)}</Text>
                    <Text style={styles.qtyDisplaySub}>পাতা</Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleStripPlus}
                    style={styles.stepperBtn}
                    accessibilityLabel="Increase strips"
                  >
                    <Icon name="Plus" size={14} color="#0b6234" />
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* ── Option 2: Loose Tablets (খুচরা ট্যাবলেট) ─────────────── */}
            <View style={[styles.optionCard, looseTabs > 0 && styles.optionCardActive]}>
              <View style={styles.optionHeader}>
                <View style={[styles.optionIconBox, { backgroundColor: '#f0fdf4', borderColor: '#bbf7d0' }]}>
                  <Icon name="CircleDot" size={18} color="#15803d" />
                </View>

                <View style={styles.optionInfo}>
                  <View style={styles.optionTitleRow}>
                    <Text style={styles.optionTitle}>খুচরা ট্যাবলেট (Loose)</Text>
                    {breakdown.discountApplied && breakdown.effectiveTabPrice < breakdown.tabPrice ? (
                      <View style={styles.discountPill}>
                        <Text style={styles.discountPillText}>
                          {toBengaliNumerals(discountPercent)}% ছাড়
                        </Text>
                      </View>
                    ) : null}
                  </View>

                  <View style={styles.priceRow}>
                    <Text style={styles.effectivePrice}>
                      {formatBdt(breakdown.effectiveTabPrice)}
                    </Text>
                    {breakdown.effectiveTabPrice < breakdown.tabPrice ? (
                      <Text style={styles.mrpStrike}>{formatBdt(breakdown.tabPrice)}</Text>
                    ) : null}
                    <Text style={styles.unitSubtext}>/ পিস</Text>
                  </View>
                </View>

                {/* Stepper for Loose Tabs */}
                <View style={styles.stepperContainer}>
                  <TouchableOpacity
                    onPress={handleLooseMinus}
                    disabled={looseTabs <= 0}
                    style={[styles.stepperBtn, looseTabs <= 0 && styles.stepperBtnDisabled]}
                    accessibilityLabel="Decrease loose tablets"
                  >
                    <Icon name="Minus" size={14} color={looseTabs <= 0 ? '#94a3b8' : '#0b6234'} />
                  </TouchableOpacity>

                  <View style={styles.qtyDisplay}>
                    <Text style={styles.qtyDisplayText}>{toBengaliNumerals(looseTabs)}</Text>
                    <Text style={styles.qtyDisplaySub}>পিস</Text>
                  </View>

                  <TouchableOpacity
                    onPress={handleLoosePlus}
                    style={styles.stepperBtn}
                    accessibilityLabel="Increase loose tablets"
                  >
                    <Icon name="Plus" size={14} color="#0b6234" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Rollover Hint Note */}
              <View style={styles.rolloverHint}>
                <Icon name="Sparkles" size={12} color="#16a34a" />
                <Text style={styles.rolloverHintText}>
                  {toBengaliNumerals(unitsPerStrip)}টি ট্যাবলেট নিলে স্বয়ংক্রিয়ভাবে ১টি পাতা হয়ে যাবে।
                </Text>
              </View>
            </View>

            {/* Discount unlock notice if under MIN_STRIP_ONLY with 0 strips */}
            {isMinStripOnly && breakdown.totalStrips === 0 && discountPercent > 0 ? (
              <View style={styles.policyNotice}>
                <Icon name="Info" size={14} color="#0284c7" />
                <Text style={styles.policyNoticeText}>
                  কমপক্ষে ১ পাতা নিলে পুরো অর্ডারে {toBengaliNumerals(discountPercent)}% ছাড় পাওয়া যাবে!
                </Text>
              </View>
            ) : null}

            {/* ── Summary & Breakdown Box ───────────────────────────── */}
            <View style={styles.summaryBox}>
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>নির্বাচিত পরিমাণ:</Text>
                <Text style={styles.summaryValue}>
                  {breakdown.totalStrips > 0
                    ? `${toBengaliNumerals(breakdown.totalStrips)} পাতা`
                    : ''}
                  {breakdown.totalStrips > 0 && breakdown.looseTabs > 0 ? ' + ' : ''}
                  {breakdown.looseTabs > 0
                    ? `${toBengaliNumerals(breakdown.looseTabs)}টি ট্যাবলেট`
                    : ''}
                  {' '}(মোট {toBengaliNumerals(breakdown.totalTabs)} টি)
                </Text>
              </View>

              <View style={styles.summaryDivider} />

              <View style={styles.totalRow}>
                <View>
                  <Text style={styles.totalLabel}>সর্বমোট মূল্য</Text>
                  {breakdown.totalSavings > 0 ? (
                    <Text style={styles.savingsText}>
                      {formatBdt(breakdown.totalSavings)} সাশ্রয় হচ্ছে!
                    </Text>
                  ) : null}
                </View>
                <Text style={styles.totalAmount}>{formatBdt(breakdown.finalTotal)}</Text>
              </View>
            </View>
          </ScrollView>

          {/* Footer CTA */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={handleConfirm}
              activeOpacity={0.85}
              style={styles.confirmBtn}
              accessibilityRole="button"
              accessibilityLabel="Add to cart"
            >
              <Icon name="ShoppingCart" size={18} color="#ffffff" />
              <Text style={styles.confirmBtnText}>
                কার্টে যোগ করুন ({formatBdt(breakdown.finalTotal)})
              </Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 8,
  },
  handleWrap: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  handleBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  headerInfo: {
    flex: 1,
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    flexWrap: 'wrap',
    gap: 6,
  },
  medicineName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0f172a',
  },
  strengthText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0b6234',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 4,
  },
  genericText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  manufacturerText: {
    fontSize: 12,
    color: '#64748b',
  },
  stripBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  stripBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#065f46',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#f8fafc',
  },
  body: {
    maxHeight: 460,
  },
  bodyContent: {
    padding: 20,
    gap: 14,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    padding: 14,
    gap: 10,
  },
  optionCardActive: {
    borderColor: '#0b6234',
    backgroundColor: '#fcfdfb',
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionIconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  optionInfo: {
    flex: 1,
    marginRight: 10,
  },
  optionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  optionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  discountPill: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 4,
    borderWidth: 0.5,
    borderColor: '#86efac',
  },
  discountPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#15803d',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2,
    gap: 6,
  },
  effectivePrice: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0b6234',
  },
  mrpStrike: {
    fontSize: 12,
    color: '#94a3b8',
    textDecorationLine: 'line-through',
  },
  unitSubtext: {
    fontSize: 11,
    color: '#64748b',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: 2,
  },
  stepperBtn: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  stepperBtnDisabled: {
    backgroundColor: '#f1f5f9',
    opacity: 0.5,
  },
  qtyDisplay: {
    minWidth: 42,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  qtyDisplayText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0f172a',
  },
  qtyDisplaySub: {
    fontSize: 9,
    fontWeight: '600',
    color: '#64748b',
    marginTop: -2,
  },
  rolloverHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#dcfce7',
  },
  rolloverHintText: {
    fontSize: 11,
    color: '#15803d',
    fontWeight: '600',
    flex: 1,
  },
  policyNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0f9ff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  policyNoticeText: {
    fontSize: 11.5,
    color: '#0369a1',
    fontWeight: '600',
    flex: 1,
  },
  summaryBox: {
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    marginTop: 4,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 13,
    color: '#64748b',
    fontWeight: '600',
  },
  summaryValue: {
    fontSize: 13,
    color: '#0f172a',
    fontWeight: '700',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginVertical: 10,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  savingsText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16a34a',
    marginTop: 2,
  },
  totalAmount: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0b6234',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  confirmBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#0b6234',
    height: TouchTarget.comfortable,
    borderRadius: Radius.xl,
    shadowColor: '#0b6234',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#ffffff',
  },
});
