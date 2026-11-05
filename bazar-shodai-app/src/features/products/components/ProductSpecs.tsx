import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export interface ProductSpecsProps {
  description?: string;
  nutrition?: Record<string, string | number>;
  origin?: string;
  unit?: string;
  weight?: string;
  storageInstructions?: string;
  organic?: boolean;
  isBn?: boolean;
}

export function ProductSpecs({
  description,
  nutrition,
  origin = 'Bangladesh',
  unit = 'kg',
  weight,
  storageInstructions = 'Keep in a cool and dry place away from direct sunlight.',
  organic,
  isBn = true,
}: ProductSpecsProps) {
  const [expandedSection, setExpandedSection] = useState<'desc' | 'specs' | 'nutrition' | null>(
    'desc',
  );

  const headerDesc = isBn ? 'বিবরণ ও বিস্তারিত' : 'Description & Details';
  const headerSpecs = isBn ? 'স্পেসিফিকেশন' : 'Specifications';
  const originKey = isBn ? 'উৎস / দেশ' : 'Origin / দেশ';
  const originVal = isBn ? (origin === 'Bangladesh' ? 'বাংলাদেশ' : origin) : origin;
  const unitKey = isBn ? 'মূল একক' : 'Base Unit';
  const weightKey = isBn ? 'ওজন / পরিমাণ' : 'Weight / Quantity';
  const typeKey = isBn ? 'ধরন' : 'Category Type';
  const typeVal = isBn
    ? organic
      ? 'অর্গানিক / রাসায়নিকমুক্ত'
      : 'ফার্মের তাজা পণ্য'
    : organic
      ? 'Organic / রাসায়নিকমুক্ত'
      : 'Standard Farm';
  const storageKey = isBn ? 'সংরক্ষণ' : 'Storage';
  const storageVal = isBn
    ? 'সরাসরি সূর্যালোক থেকে দূরে ঠাণ্ডা ও শুকনো স্থানে সংরক্ষণ করুন।'
    : storageInstructions;
  const fallbackDesc = isBn
    ? '১০০% তাজা ও স্বাস্থ্যসম্মত পণ্য। পরিবারের সুস্বাস্থ্য নিশ্চিত করতে বিশেষ যত্নসহকারে বাছাই ও সরবরাহকৃত।'
    : '100% fresh, farm-sourced produce harvested daily. Sorted and packed under hygienic standards to retain natural vitamins, moisture, and crisp taste for your family meals.';

  const toggleSection = (section: 'desc' | 'specs' | 'nutrition') => {
    haptics.selection();
    setExpandedSection((prev) => (prev === section ? null : section));
  };

  return (
    <View style={styles.container}>
      {/* Description Accordion */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          onPress={() => toggleSection('desc')}
          style={styles.headerRow}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Toggle product description"
        >
          <View style={styles.titleRow}>
            <Icon name="Info" size={18} color="#0b6234" />
            <Text style={styles.headerTitle}>{headerDesc}</Text>
          </View>
          <Icon
            name={expandedSection === 'desc' ? 'ChevronUp' : 'ChevronDown'}
            size={18}
            color="#6b7280"
          />
        </TouchableOpacity>

        {expandedSection === 'desc' && (
          <View style={styles.contentBody}>
            <Text style={styles.bodyText}>
              {description || fallbackDesc}
            </Text>
          </View>
        )}
      </View>

      {/* Specifications Accordion */}
      <View style={styles.sectionCard}>
        <TouchableOpacity
          onPress={() => toggleSection('specs')}
          style={styles.headerRow}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Toggle product specifications"
        >
          <View style={styles.titleRow}>
            <Icon name="Sliders" size={18} color="#0b6234" />
            <Text style={styles.headerTitle}>{headerSpecs}</Text>
          </View>
          <Icon
            name={expandedSection === 'specs' ? 'ChevronUp' : 'ChevronDown'}
            size={18}
            color="#6b7280"
          />
        </TouchableOpacity>

        {expandedSection === 'specs' && (
          <View style={styles.contentBody}>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>{originKey}</Text>
              <Text style={styles.specVal}>{originVal}</Text>
            </View>
            <View style={styles.specRow}>
              <Text style={styles.specKey}>{unitKey}</Text>
              <Text style={styles.specVal}>{unit}</Text>
            </View>
            {weight && (
              <View style={styles.specRow}>
                <Text style={styles.specKey}>{weightKey}</Text>
                <Text style={styles.specVal}>{weight}</Text>
              </View>
            )}
            <View style={styles.specRow}>
              <Text style={styles.specKey}>{typeKey}</Text>
              <Text style={styles.specVal}>{typeVal}</Text>
            </View>
            <View style={[styles.specRow, { borderBottomWidth: 0 }]}>
              <Text style={styles.specKey}>{storageKey}</Text>
              <Text style={styles.specVal} numberOfLines={2}>
                {storageVal}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Nutritional Value Accordion */}
      {nutrition && Object.keys(nutrition).length > 0 && (
        <View style={styles.sectionCard}>
          <TouchableOpacity
            onPress={() => toggleSection('nutrition')}
            style={styles.headerRow}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Toggle nutritional information"
          >
            <View style={styles.titleRow}>
              <Icon name="Sparkles" size={18} color="#0b6234" />
              <Text style={styles.headerTitle}>Nutritional Value (per 100g)</Text>
            </View>
            <Icon
              name={expandedSection === 'nutrition' ? 'ChevronUp' : 'ChevronDown'}
              size={18}
              color="#6b7280"
            />
          </TouchableOpacity>

          {expandedSection === 'nutrition' && (
            <View style={styles.contentBody}>
              {Object.entries(nutrition).map(([key, val], idx, arr) => (
                <View
                  key={key}
                  style={[styles.specRow, idx === arr.length - 1 && { borderBottomWidth: 0 }]}
                >
                  <Text style={styles.specKey}>{key}</Text>
                  <Text style={styles.specVal}>{String(val)}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginVertical: 12,
  },
  sectionCard: {
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
  },
  contentBody: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  bodyText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#4b5563',
  },
  specRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  specKey: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  specVal: {
    fontSize: 13,
    color: '#111827',
    fontWeight: '600',
    maxWidth: '60%',
    textAlign: 'right',
  },
});
