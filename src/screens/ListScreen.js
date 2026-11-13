import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { fetchMarkets } from '../api/coinGecko';
import CoinRow from '../components/CoinRow';

export default function ListScreen() {
  const [coins, setCoins] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadCoins = useCallback(async (signal, isActive) => {
    try {
      const data = await fetchMarkets(signal);
      if (isActive()) {
        setCoins(data);
        setError(null);
      }
    } catch (caught) {
      if (isActive() && caught.type !== 'aborted') {
        setError('Could not load prices.');
      }
    } finally {
      if (isActive()) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    let mounted = true;
    const isActive = () => mounted;

    loadCoins(controller.signal, isActive);

    return () => {
      mounted = false;
      controller.abort();
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
        <Text style={styles.errorText}>{error}</Text>
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
  errorText: {
    color: '#B91C1C',
    fontSize: 16,
    textAlign: 'center',
  },
  listContent: {
    padding: 16,
  },
});
