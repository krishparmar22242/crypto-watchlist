import { memo } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { formatPercent, formatPrice } from '../utils/format';

function CoinRow({ coin, isFavorite, onPress, onToggleFavorite }) {
  const change = coin.price_change_percentage_24h;
  let changeColor = '#6B7280';
  if (typeof change === 'number' && Number.isFinite(change)) {
    changeColor = change >= 0 ? '#15803D' : '#DC2626';
  }

  return (
    <View style={styles.row}>
      <Pressable
        onPress={() => onPress(coin)}
        accessibilityRole="button"
        accessibilityLabel={`View ${coin.name} details`}
        style={styles.main}
      >
        <Image source={{ uri: coin.image }} style={styles.image} />
        <View style={styles.info}>
          <Text numberOfLines={1} style={styles.name}>
            {coin.name}
          </Text>
          <Text style={styles.symbol}>
            {coin.symbol ? coin.symbol.toUpperCase() : 'N/A'}
          </Text>
        </View>
        <View style={styles.numbers}>
          <Text style={styles.price}>{formatPrice(coin.current_price)}</Text>
          <Text style={[styles.change, { color: changeColor }]}>
            {formatPercent(change)}
          </Text>
        </View>
      </Pressable>
      <Pressable
        onPress={() => onToggleFavorite(coin.id)}
        accessibilityRole="button"
        accessibilityLabel={
          isFavorite
            ? `Remove ${coin.name} from favorites`
            : `Add ${coin.name} to favorites`
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
  );
}

// Rows are memoized because most props stay the same during unrelated screen updates.
export default memo(CoinRow);

const styles = StyleSheet.create({
  row: {
    minHeight: 72,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  main: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  image: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#E5E7EB',
  },
  info: {
    flex: 1,
    paddingRight: 8,
  },
  name: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  symbol: {
    marginTop: 2,
    color: '#6B7280',
    fontSize: 13,
    fontWeight: '600',
  },
  numbers: {
    alignItems: 'flex-end',
  },
  price: {
    color: '#111827',
    fontSize: 16,
    fontWeight: '600',
  },
  change: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: '600',
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
    fontSize: 24,
    lineHeight: 28,
  },
  starActive: {
    color: '#F59E0B',
  },
});
