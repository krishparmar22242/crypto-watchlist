import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchMarkets } from '../api/coinGecko';
import CoinRow from '../components/CoinRow';

function getErrorMessage(error) {
  switch (error?.type) {
    case 'rate-limit':
      return 'Too many requests. Wait a minute and retry.';
    case 'http':
      return `The server returned HTTP ${error.status ?? 'error'}. Please retry.`;
    case 'timeout':
      return 'The request timed out. Check your connection and retry.';
    case 'network':
      return 'Network error. Check your connection and retry.';
    case 'response':
      return 'The server sent an unexpected response. Please retry.';
    default:
      return 'Something went wrong. Please retry.';
  }
}

export default function ListScreen() {
  const [coins, setCoins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const isMountedRef = useRef(true);
  const requestRef = useRef(null);

  const loadCoins = useCallback(async () => {
    if (requestRef.current) {
      requestRef.current.abort();
    }

    const controller = new AbortController();
    requestRef.current = controller;
    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchMarkets(controller.signal);
      if (isMountedRef.current && requestRef.current === controller) {
        setCoins(data);
      }
    } catch (caught) {
      if (
        isMountedRef.current &&
        requestRef.current === controller &&
        caught.type !== 'aborted'
      ) {
        setError(getErrorMessage(caught));
      }
    } finally {
      if (isMountedRef.current && requestRef.current === controller) {
        setIsLoading(false);
        requestRef.current = null;
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    loadCoins();

    return () => {
      isMountedRef.current = false;
      if (requestRef.current) {
        requestRef.current.abort();
      }
    };
  }, [loadCoins]);

  const renderItem = useCallback(({ item }) => <CoinRow coin={item} />, []);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#2563EB" />
        <Text style={styles.loadingText}>Loading coins...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.errorTitle}>Could not load prices</Text>
        <Text style={styles.errorMessage}>{error}</Text>
        <Pressable
          onPress={loadCoins}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.retryButton,
            pressed && styles.retryButtonPressed,
          ]}
        >
          <Text style={styles.retryText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={coins}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    color: '#4B5563',
    fontSize: 16,
  },
  errorTitle: {
    marginBottom: 8,
    color: '#111827',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  errorMessage: {
    marginBottom: 20,
    color: '#4B5563',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
  },
  retryButton: {
    minHeight: 44,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: '#2563EB',
    borderRadius: 10,
  },
  retryButtonPressed: {
    opacity: 0.8,
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  listContent: {
    padding: 16,
  },
});
