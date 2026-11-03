import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/ui/Button';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bazar Shodai Mobile</Text>
      <Text style={styles.subtitle}>Fresh grocery delivered in Shahrasti</Text>
      <Button
        title="Explore Products"
        onPress={() => console.log('Button pressed')}
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
    marginBottom: 24,
  },
  button: {
    width: '100%',
    maxWidth: 280,
  },
});
