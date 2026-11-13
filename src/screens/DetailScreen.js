import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFavorites } from '../context/FavoritesContext';
import { formatCompact, formatPercent, formatPrice } from '../utils/format';

function formatCompactUsd(value) {
  const formatted = formatCompact(value);
  return formatted === 'N/A' ? formatted : `$${formatted}`;
}

function formatRank(value) {
  return typeof value === 'number' && Number.isFinite(value)
    ? `#${value}`
    : 'N/A';
}

function Stat({ label, value, isLast = false }) {
  return (
    <View style={[styles.stat, isLast && styles.statLast]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function DetailScreen({ route }) {
  const coin = route.params?.coin;
  const { favoriteIds, toggleFavorite } = useFavorites();

  if (!coin) {
    return (
      <View style={styles.centered}>
        <Text style={styles.missingText}>Coin details are unavailable.</Text>
      </View>
    );
  }

  const isFavorite = favoriteIds.includes(coin.id);
  const change = coin.price_change_percentage_24h;
  let changeColor = '#6B7280';
  if (typeof change === 'number' && Number.isFinite(change)) {
    changeColor = change >= 0 ? '#15803D' : '#DC2626';
  }

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <View style={styles.headerCard}>
        <Image source={{ uri: coin.image }} style={styles.image} />
        <View style={styles.headerInfo}>
          <Text style={styles.name}>{coin.name}</Text>
          <Text style={styles.symbol}>
            {coin.symbol?.toUpperCase() || 'N/A'}
          </Text>
          <Text style={styles.rank}>
            Rank {formatRank(coin.market_cap_rank)}
          </Text>
        </View>
        <Pressable
          onPress={() => toggleFavorite(coin.id)}
          accessibilityRole="button"
          accessibilityLabel={
            isFavorite ? 'Remove from favorites' : 'Add to favorites'
          }
          accessibilityState={{ selected: isFavorite }}
          style={({ pressed }) => [
            styles.starButton,
            pressed && styles.starButtonPressed,
          ]}
        >
          <Text style={[styles.star, isFavorite && styles.starActive]}>
            {isFavorite ? '★' : '☆'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.priceCard}>
        <Text style={styles.priceLabel}>Current price</Text>
        <Text style={styles.price}>{formatPrice(coin.current_price)}</Text>
        <Text style={[styles.change, { color: changeColor }]}>
          {formatPercent(change)} (24h)
        </Text>
      </View>

      <View style={styles.statsCard}>
        <Stat label="Market cap" value={formatCompactUsd(coin.market_cap)} />
        <Stat label="24h high" value={formatPrice(coin.high_24h)} />
        <Stat label="24h low" value={formatPrice(coin.low_24h)} />
        <Stat
          label="24h volume"
          value={formatCompactUsd(coin.total_volume)}
          isLast
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  missingText: {
    color: '#4B5563',
    fontSize: 16,
    textAlign: 'center',
  },
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  image: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginRight: 16,
    backgroundColor: '#E5E7EB',
  },
  headerInfo: {
    flex: 1,
  },
  name: {
    color: '#111827',
    fontSize: 24,
    fontWeight: '700',
  },
  symbol: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 15,
    fontWeight: '600',
  },
  rank: {
    marginTop: 8,
    color: '#4B5563',
    fontSize: 14,
  },
  starButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButtonPressed: {
    opacity: 0.5,
  },
  star: {
    color: '#9CA3AF',
    fontSize: 30,
    lineHeight: 34,
  },
  starActive: {
    color: '#F59E0B',
  },
  priceCard: {
    marginTop: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  priceLabel: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
  price: {
    marginTop: 4,
    color: '#111827',
    fontSize: 32,
    fontWeight: '700',
  },
  change: {
    marginTop: 6,
    fontSize: 16,
    fontWeight: '600',
  },
  statsCard: {
    marginTop: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  stat: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  statLast: {
    borderBottomWidth: 0,
  },
  statLabel: {
    color: '#6B7280',
    fontSize: 15,
  },
  statValue: {
    maxWidth: '60%',
    color: '#111827',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'right',
  },
});
