import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';

import { fetchMarkets } from '../api/coinGecko';
import CoinRow from '../components/CoinRow';
import { useFavorites } from '../context/FavoritesContext';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);

  const { favoriteIds, toggleFavorite } = useFavorites();
  const isMountedRef = useRef(true);
  const requestRef = useRef(null);

  const loadCoins = useCallback(async ({ refresh = false } = {}) => {
    if (requestRef.current) {
      requestRef.current.abort();
    }

    const controller = new AbortController();
    requestRef.current = controller;
    if (refresh) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
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
        setIsRefreshing(false);
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

  const favoriteSet = useMemo(() => new Set(favoriteIds), [favoriteIds]);

  const filteredCoins = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return coins.filter((coin) => {
      if (favoritesOnly && !favoriteSet.has(coin.id)) {
        return false;
      }
      if (!query) {
        return true;
      }
      const name = String(coin.name ?? '').toLowerCase();
      const symbol = String(coin.symbol ?? '').toLowerCase();
      return name.includes(query) || symbol.includes(query);
    });
  }, [coins, searchQuery, favoritesOnly, favoriteSet]);

  const handleRetry = useCallback(() => {
    loadCoins();
  }, [loadCoins]);

  const handleRefresh = useCallback(() => {
    loadCoins({ refresh: true });
  }, [loadCoins]);

  // Stable callbacks let memoized rows skip renders when unrelated state changes.
  const renderItem = useCallback(
    ({ item }) => (
      <CoinRow
        coin={item}
        isFavorite={favoriteSet.has(item.id)}
        onToggleFavorite={toggleFavorite}
      />
    ),
    [favoriteSet, toggleFavorite]
  );

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
          onPress={handleRetry}
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
      <View style={styles.controls}>
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search by name or symbol"
          placeholderTextColor="#9CA3AF"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search coins"
          style={styles.searchInput}
        />
        <View style={styles.favoritesToggle}>
          <Text style={styles.favoritesLabel}>Favorites only</Text>
          <Switch
            value={favoritesOnly}
            onValueChange={setFavoritesOnly}
            accessibilityLabel="Show favorites only"
            trackColor={{ false: '#D1D5DB', true: '#93C5FD' }}
            thumbColor={favoritesOnly ? '#2563EB' : '#FFFFFF'}
          />
        </View>
      </View>
      <FlatList
        data={filteredCoins}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={favoriteIds}
        contentContainerStyle={[
          styles.listContent,
          filteredCoins.length === 0 && styles.emptyListContent,
        ]}
        ListEmptyComponent={<Text style={styles.emptyText}>No coins found</Text>}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={['#2563EB']}
            tintColor="#2563EB"
          />
        }
        keyboardShouldPersistTaps="handled"
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
  controls: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  searchInput: {
    minHeight: 48,
    paddingHorizontal: 14,
    color: '#111827',
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 10,
  },
  favoritesToggle: {
    minHeight: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  favoritesLabel: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  listContent: {
    padding: 16,
  },
  emptyListContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  emptyText: {
    color: '#6B7280',
    fontSize: 16,
    textAlign: 'center',
  },
});
