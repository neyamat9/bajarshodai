import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public override state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public override componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (__DEV__) {
      console.error('[ErrorBoundary caught error]:', error, errorInfo);
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public override render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <Text style={styles.icon}>⚠️</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.description}>
            The application encountered an unexpected issue. Please restart or try again.
          </Text>
          {__DEV__ && this.state.error && (
            <View style={styles.debugBox}>
              <Text style={styles.debugText} numberOfLines={4}>
                {this.state.error.message}
              </Text>
            </View>
          )}
          <Button
            title="Try Again"
            variant="primary"
            size="md"
            onPress={this.handleReset}
            style={styles.button}
          />
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#f4f8f1',
  },
  icon: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#12301f',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 13,
    color: '#587263',
    textAlign: 'center',
    marginBottom: 20,
    maxWidth: 280,
    lineHeight: 18,
  },
  debugBox: {
    backgroundColor: '#edf3e8',
    padding: 10,
    borderRadius: 6,
    marginBottom: 20,
    width: '100%',
    maxWidth: 320,
  },
  debugText: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#d92d20',
  },
  button: {
    minWidth: 160,
  },
});

