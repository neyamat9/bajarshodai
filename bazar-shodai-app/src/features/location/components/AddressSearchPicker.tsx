import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { Icon } from '@/components/ui/Icon';
import { Radius } from '@/constants/layout';
import { searchAreasApi, LocationSearchResult } from '../api/myLocation';
import { haptics } from '@/services/haptics';

export interface AddressSearchPickerProps {
  onSelectArea: (area: LocationSearchResult) => void;
  placeholder?: string;
}

export function AddressSearchPicker({
  onSelectArea,
  placeholder = 'Search road, area, thana, or district...',
}: AddressSearchPickerProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<LocationSearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (!text.trim() || text.length < 2) {
      setResults([]);
      return;
    }

    setLoading(true);
    try {
      const data = await searchAreasApi(text);
      setResults(data);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (item: LocationSearchResult) => {
    haptics.selection();
    onSelectArea(item);
    setQuery(item.name);
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchBox}>
        <Icon name="Search" size={18} color="#9ca3af" />
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          value={query}
          onChangeText={handleSearch}
          returnKeyType="search"
        />
        {loading && <ActivityIndicator size="small" color="#0b6234" />}
        {query.length > 0 && !loading && (
          <TouchableOpacity
            onPress={() => {
              setQuery('');
              setResults([]);
            }}
          >
            <Icon name="X" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Autocomplete Dropdown List */}
      {results.length > 0 && (
        <View style={styles.dropdown}>
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => handleSelect(item)}
                style={styles.resultItem}
                activeOpacity={0.7}
              >
                <Icon name="MapPin" size={16} color="#0b6234" />
                <View style={styles.resultTextCol}>
                  <Text style={styles.resultName}>{item.name}</Text>
                  {item.nameBn && <Text style={styles.resultNameBn}>{item.nameBn}</Text>}
                </View>
                {item.parentName && <Text style={styles.parentName}>{item.parentName}</Text>}
              </TouchableOpacity>
            )}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 20,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 13,
    color: '#111827',
  },
  dropdown: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    maxHeight: 220,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    gap: 10,
  },
  resultTextCol: {
    flex: 1,
  },
  resultName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
  },
  resultNameBn: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  parentName: {
    fontSize: 11,
    color: '#9ca3af',
  },
});

