# Crypto Watchlist

A small Expo app that shows the top 50 cryptocurrencies with current prices and
lets the user search, refresh, and save favorites on the device.

## Tech stack

- React Native with Expo
- React Navigation (native stack)
- AsyncStorage for favorites
- CoinGecko public REST API (no API key)

## Features

- Top-50 market list with current price and 24h change
- Search by coin name or symbol
- "Favorites only" filter and persistent stars
- Coin detail screen with rank, market cap, 24h high/low, and volume
- Pull-to-refresh, loading, error, and empty states
- Clear error messages for network, HTTP, timeout, and rate-limit failures

## Run on a fresh machine

1. Install a current Node.js LTS release.
2. Open a terminal in this project folder.
3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the Expo development server:

   ```bash
   npx expo start
   ```

5. Install Expo Go on your phone and scan the QR code. The phone and computer
   should be on the same network.

## Screenshots

_Add screenshots of the list and detail screens here._

## Known limitations

- Prices refresh only when the app loads or the user pulls to refresh; they are
  not live-streamed.
- The free CoinGecko API has rate limits and may occasionally return HTTP 429.
- There is no offline cache, so the app needs a network connection to load data.

Tested on: (fill in)
