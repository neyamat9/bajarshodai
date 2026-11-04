import React, { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { Icon } from './Icon';
import { Radius, TouchTarget } from '@/constants/layout';
import { haptics } from '@/services/haptics';

export interface SearchBarProps {
  value?: string;
  onChangeQuery?: (query: string) => void;
  onSubmit?: (query: string) => void;
  onFilterPress?: () => void;
  placeholder?: string;
  debounceMs?: number;
  className?: string;
}

export function SearchBar({
  value: controlledValue,
  onChangeQuery,
  onSubmit,
  onFilterPress,
  placeholder = 'Search for vegetables, meat, fish...',
  debounceMs = 300,
  className = '',
}: SearchBarProps) {
  const [query, setQuery] = useState(controlledValue ?? '');
  const [prevControlled, setPrevControlled] = useState(controlledValue);

  if (controlledValue !== undefined && controlledValue !== prevControlled) {
    setPrevControlled(controlledValue);
    setQuery(controlledValue);
  }

  useEffect(() => {
    if (!onChangeQuery) return;
    const timer = setTimeout(() => {
      onChangeQuery(query);
    }, debounceMs);
    return () => clearTimeout(timer);
  }, [query, debounceMs, onChangeQuery]);

  const handleClear = () => {
    haptics.light();
    setQuery('');
    onChangeQuery?.('');
  };

  return (
    <View className={`flex-row items-center w-full ${className}`}>
      <View style={styles.searchBox} className="flex-1 bg-card border border-border">
        <Icon name="Search" size={18} color="#587263" style={styles.searchIcon} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          onSubmitEditing={() => onSubmit?.(query)}
          returnKeyType="search"
          placeholder={placeholder}
          placeholderTextColor="#9dbba6"
          className="flex-1 text-sm text-foreground"
          style={styles.input}
        />
        {query.length > 0 && (
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Clear search"
            onPress={handleClear}
            style={styles.clearButton}
          >
            <Icon name="X" size={14} color="#587263" />
          </TouchableOpacity>
        )}
      </View>

      {onFilterPress && (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Open search filters"
          activeOpacity={0.8}
          onPress={() => {
            haptics.light();
            onFilterPress();
          }}
          style={styles.filterButton}
          className="bg-brand-fresh/15 border border-brand-fresh/30"
        >
          <Icon name="SlidersHorizontal" size={18} color="#0b6234" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radius.brand,
    minHeight: TouchTarget.comfortable,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    paddingVertical: 8,
  },
  clearButton: {
    padding: 6,
  },
  filterButton: {
    width: 44,
    height: 44,
    borderRadius: Radius.brand,
    marginLeft: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
