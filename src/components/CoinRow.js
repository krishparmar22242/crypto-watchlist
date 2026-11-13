import { memo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';

function CoinRow({ coin }) {
  const change = coin.price_change_percentage_24h;
  const changeColor = change >= 0 ? '#15803D' : '#DC2626';
  const changeLabel =
    typeof change === 'number'
      ? `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`
      : 'N/A';

  return (
    <View style={styles.row}>
      <Image source={{ uri: coin.image }} style={styles.image} />
      <View style={styles.info}>
        <Text numberOfLines={1} style={styles.name}>
          {coin.name}
        </Text>
        <Text style={styles.symbol}>{coin.symbol.toUpperCase()}</Text>
      </View>
      <View style={styles.numbers}>
        <Text style={styles.price}>${coin.current_price.toFixed(2)}</Text>
        <Text style={[styles.change, { color: changeColor }]}>
          {changeLabel}
        </Text>
      </View>
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
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
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
});
