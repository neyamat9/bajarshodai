import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';
import { ENV } from '@/config/env';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bazar Shodai Mobile</Text>
      <Text style={styles.subtitle}>Fresh grocery delivered in Shahrasti</Text>
      <View style={styles.envBadge}>
        <Text style={styles.envLabel}>API Target:</Text>
        <Text style={styles.envValue} numberOfLines={1}>
          {ENV.API_BASE_URL}
        </Text>
      </View>
      <Button
        title="Explore Products"
        onPress={() => console.log('Connected to API:', ENV.API_BASE_URL)}
        style={styles.button}
      />
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
  },
  envBadge: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 24,
    alignItems: 'center',
  },
  envLabel: {
    fontSize: 11,
    color: '#64748b',
    textTransform: 'uppercase',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  envValue: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  button: {
    width: '100%',
    maxWidth: 280,
  },
});
