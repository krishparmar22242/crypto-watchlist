# Crypto Watchlist - Learning Notes

These notes explain the code as it exists in this project. The goal is to make
the data flow and the main React Native ideas easy to explain out loud.

## How the app fits together

1. `index.js` registers `App.js` as the root component.
2. `App.js` sets up safe areas, the favorites provider, and the stack navigator.
3. `ListScreen` fetches 50 coins from CoinGecko, filters them, and renders rows.
4. Tapping a row sends the already-loaded coin object to `DetailScreen`.
5. `FavoritesProvider` loads saved ids once and shares them with both screens.
6. `favorites.js` is the only file that reads and writes AsyncStorage.

## File-by-file

### `App.js`

This is the entry point for the UI. It wraps the app in:

- `SafeAreaProvider`, so screens can respect notches and system bars.
- `FavoritesProvider`, so both screens share the same saved stars.
- `NavigationContainer`, which enables navigation.
- A native stack navigator with two screens: `List` and `Detail`.

The `Detail` screen title is built from the route params:

```js
options={({ route }) => ({
  title: route.params?.coin?.name ?? 'Coin details',
})}
```

The header title updates automatically because the coin name is passed in the
navigation params. The native stack also supplies the back button.

### `index.js`

This file uses Expo's `registerRootComponent(App)`. It connects the React
component to the native app container. There is no app logic here.

### `src/api/coinGecko.js`

This file contains one API function: `fetchMarkets(signal)`.

Its responsibilities are:

- Call the CoinGecko markets endpoint for the top 50 USD coins.
- Add a 10-second timeout with `AbortController`.
- Also stop when the screen passes its own aborted signal.
- Convert low-level failures into an `ApiError` with a useful `type`.
- Return only valid array data.

The API function does not know about React. It only knows how to fetch and how
to report failure. That separation makes it easier to test later.

Error types:

| Type | Meaning |
| --- | --- |
| `rate-limit` | CoinGecko returned HTTP 429. |
| `http` | Some other non-success HTTP status. |
| `timeout` | The request took longer than 10 seconds. |
| `network` | The request could not reach the server. |
| `response` | The response was not the JSON array the app expected. |
| `aborted` | The screen cancelled the request, usually on unmount. |

Two controllers are used because there are two reasons to stop: the screen
being closed and the timeout expiring. The timeout controller is always the
signal passed to `fetch`; the screen's signal is linked to it by an event
listener. `finally` clears the timer and removes the listener.

### `src/screens/ListScreen.js`

This is the main screen and the busiest file.

State:

- `coins`: the latest successful API response.
- `searchQuery`: the text in the search box.
- `favoritesOnly`: whether the switch is on.
- `isLoading`: used for the first load and for a full retry.
- `isRefreshing`: used for the pull-to-refresh spinner.
- `error`: a user-facing error message, or `null`.

Refs:

- `isMountedRef`: tells asynchronous code whether the screen still exists.
- `requestRef`: stores the current `AbortController` so an old request cannot
  overwrite a newer one.

`loadCoins` does the following:

1. Aborts any older request.
2. Creates a fresh controller.
3. Shows the full spinner for a retry, or the small refresh spinner for a
   pull-to-refresh.
4. Clears the old error.
5. Calls `fetchMarkets`.
6. Checks that this request is still the current one before changing state.
7. Ignores intentional aborts.
8. Always clears the loading/refreshing flags in `finally` when still current.

The effect runs `loadCoins` when the screen mounts. Its cleanup marks the screen
as unmounted and aborts the request. This is why no state updates happen after
the screen disappears.

`filteredCoins` is calculated with `useMemo`:

- A `Set` of favorite ids makes favorite checks fast.
- Search is case-insensitive.
- Search matches either the coin name or its symbol.
- The favorites-only switch and the search text are combined.

The switch must use the native `Switch` callback:

```jsx
<Switch value={favoritesOnly} onValueChange={setFavoritesOnly} />
```

A previous version made the switch non-interactive with `pointerEvents="none"`
and relied only on a parent `Pressable`. On the phone, the native switch did not
respond. The fixed version lets the native switch update state directly. Its
`hitSlop` enlarges the touch area without changing its visual size.

Screen states are handled in this order:

1. Loading: centered `ActivityIndicator`.
2. Error: title, specific message, and a Retry button.
3. Success: search controls above a `FlatList`.
4. Empty filtered result: "No coins found".

Pull-to-refresh uses a `RefreshControl`. It calls the same `loadCoins` function
with `refresh: true`, so there is only one fetching code path.

`renderItem` is wrapped in `useCallback`, and its callback props are stable. The
comment above it explains why: this lets `React.memo` on `CoinRow` avoid doing
work for rows whose props did not change.

### `src/components/CoinRow.js`

This is one wallet-style row:

- Coin image.
- Name and uppercase symbol.
- Price in USD.
- Signed 24-hour percentage in green or red.
- A star button.

The row is split into two `Pressable` areas so the star does not open the
detail screen. The star has a 44 by 44 touch target.

The component is exported with `React.memo(CoinRow)`. When the screen re-renders
because of the search box, only rows whose props actually changed need to run
again. `onPress` and `onToggleFavorite` are kept stable in the parent for this to
work well.

`formatPercent` controls the `+` sign and the two decimal places. If the API
returns `null`, the text is "N/A" and the color is gray instead of red or green.

### `src/screens/DetailScreen.js`

This screen uses the coin object that `ListScreen` passed in the route params.
It does not call the API, so opening a detail screen is instant and does not use
another rate-limited request.

It shows:

- Large image, name, symbol, and market rank.
- Current price.
- Colored 24-hour change.
- Market cap.
- 24-hour high and low.
- 24-hour volume.

A local `Stat` component keeps the label/value rows consistent. The star reads
the same favorites Context as the list, so changing it here changes the list too
when the user goes back.

`ScrollView` is used here because the detail page is a short static form, not a
large dynamic list. The list screen uses `FlatList` instead.

### `src/context/FavoritesContext.js`

The Context holds an array of coin ids. Both screens need the same data, so a
small Context is simpler than passing favorite state through navigation params.

Startup:

1. `FavoritesProvider` mounts once.
2. It calls `loadFavorites()`.
3. If the provider is still mounted, it stores the ids in state and a ref.

Toggling:

1. `toggleFavorite(id)` reads the latest ids from `favoriteIdsRef`.
2. It adds or removes the id.
3. It updates the ref and React state.
4. It calls `saveFavorites(next)`.

The ref is useful because the toggle callback can stay stable and always read
the newest list, even if a render has not completed yet. The storage functions
handle their own failures, so a broken disk does not crash the app.

### `src/storage/favorites.js`

AsyncStorage is device storage, similar to a tiny key/value database.

- The key is exactly `favorites:v1`.
- The saved value is a JSON array of coin ids.
- Loading validates that the parsed value is an array of strings.
- Both reads and writes are wrapped in `try/catch`.
- A failed read returns an empty array.
- A failed write is ignored so the UI keeps working.

The `v1` suffix is useful later: if the saved format changes, the app can add a
migration instead of guessing what an old value meant.

### `src/utils/format.js`

All display formatting lives here so screens stay readable.

- `formatPrice`: adds `$`, groups thousands, and uses more decimal places for
  cheap coins.
- `formatCompact`: turns large numbers into values such as `1.2T`, `350.4B`, and
  `12.3M`.
- `formatPercent`: outputs `+2.35%`, `-1.10%`, or `N/A`.

All three guard against `null`, `undefined`, and non-finite numbers. Formatting
is kept separate from layout, and `DetailScreen` has a tiny wrapper for adding
the dollar sign to compact market values.

### `package.json`, `app.json`, and `.gitignore`

`package.json` lists only the runtime libraries needed for the two screens,
navigation, and favorites storage.

`app.json` keeps the app in light mode and defines the Expo app identity and
icons.

`.gitignore` keeps generated and heavy files out of git: `node_modules`,
`.expo`, `dist`, logs, and native build folders. The Android export used `dist/`
and it is not tracked.

### `README.md`

The README is the public explanation of the project: features, technology,
fresh-machine setup, screenshot placeholder, limitations, and the manual testing
note. It deliberately does not claim the app was tested on a particular device.

## 15 interview questions

### 1. What is the difference between `useState` and `useEffect`?

`useState` stores values that change over time, such as the coin list, search
text, and loading flag. `useEffect` runs side effects after rendering, such as
starting the API request and setting up cleanup. State describes what the UI
should show; effects connect React to things outside React.

### 2. Why does this app need cleanup in `useEffect`?

The list starts an asynchronous request. If the user leaves the screen before it
returns, the app could call `setState` on an unmounted component. The cleanup
sets `isMountedRef` to false and aborts the request. This prevents wasted work,
stale state updates, and confusing warnings.

### 3. Why use `FlatList` instead of `ScrollView` for the coin list?

`ScrollView` renders all of its children. `FlatList` virtualizes rows, so it can
reuse and mount only what is near the viewport. With 50 coins, this is more
efficient and it also supports `keyExtractor`, refresh controls, and empty
states cleanly.

### 4. How does the selected coin reach the detail screen?

The row calls `navigation.navigate('Detail', { coin })`. The coin object becomes
a route param, and `DetailScreen` reads it with `route.params.coin`. The header
title is also derived from that param in `App.js`, so no second API request is
needed.

### 5. What happens when the API fails or the phone is offline?

`fetchMarkets` catches the low-level failure and throws a typed error. The list
screen turns it into a specific message. Offline usually produces the network
message; a timeout produces the timeout message; HTTP 429 produces "Too many
requests. Wait a minute and retry." The Retry button calls the same fetch
function again.

### 6. How are favorites saved and loaded?

The provider loads `favorites:v1` from AsyncStorage once when the app starts.
Toggling a star updates the shared array and immediately writes the new array
back. On the next app launch, the same ids are read and used to show the stars.
Storage errors are caught so the app remains usable without persistence.

### 7. Why use `AbortController` and a timeout?

Without stopping the request, a slow or dead network could leave the screen
spinning forever. The 10-second timeout aborts a request that takes too long.
The screen also passes a signal so its own unmount, retry, or refresh can cancel
an old request. This avoids unnecessary work and stale results.

### 8. Why are `React.memo` and `useCallback` used for `CoinRow`?

`FlatList` can re-render while the user types in the search box. Without
protection, every visible row would execute again even when its coin and star
state did not change. `React.memo` skips those unchanged rows, and `useCallback`
keeps the row's callback props stable so the memo comparison can succeed.
`extraData={favoriteIds}` makes sure the list still updates when a star changes.

### 9. How is React Native different from Swift/native iOS and Flutter?

React Native uses JavaScript and React to drive real native UI components. One
codebase can target Android and iOS, but some behavior still differs by platform.
Swift with UIKit or SwiftUI is native to Apple's ecosystem and has the tightest
platform integration, but it only targets Apple platforms. Flutter uses Dart
and draws its own UI with a rendering engine, which gives consistent visuals
across platforms. This project uses Expo to make React Native development and
testing easier.

### 10. What would you add before calling this production-ready?

I would add an offline cache, automated tests for the API and formatting
helpers, retry with exponential backoff, and a WebSocket or polling strategy for
true live prices. I would also add TypeScript, structured error reporting, and
a review of accessibility and secure data handling. Loading and error states
for favorites loading would also be worth adding.

### 11. Why choose Context instead of passing favorites as props?

The list and detail screens are siblings in the navigator, not parent and child.
Passing arrays and callbacks through navigation params would be awkward and
would mix UI state with navigation data. A small Context keeps one source of
truth and lets both screens read and update it directly.

### 12. Why is `useMemo` used for `filteredCoins` and `favoriteSet`?

Filtering and creating a `Set` do work on every coin. `useMemo` recalculates
them only when their inputs change. The favorite `Set` only needs to be rebuilt
when the saved ids change, and the filtered list only needs to be rebuilt when
the coin list, search text, or favorites filter changes.

### 13. What does `keyExtractor` do, and why use the coin id?

`keyExtractor` gives each row a stable identity across renders. Using
`coin.id` is better than using the array index because the same coin keeps the
same key after sorting, filtering, or refreshing. Stable keys help React reuse
the correct rows and avoid state ending up on the wrong item.

### 14. How do search and the favorites-only filter work together?

Both filters are applied to the already-loaded coin array on the client, inside
one `useMemo`. Favorites-only first checks membership in the favorite id set.
Then the search text, trimmed and lowercased, is checked against the coin name
and symbol. If the result is empty, `FlatList` shows "No coins found".

### 15. How does the app avoid stale requests and state updates?

Each request gets a new controller stored in `requestRef`. A result is accepted
only if its controller is still the current one and the screen is still mounted.
Starting a new request aborts the previous one, and unmounting aborts the current
one. Errors of type `aborted` are intentionally ignored, because they mean the
app, not the user, cancelled the work.

## Things to try yourself

**1. Sort by 24-hour change**

Add a small sort control with options such as "Market cap", "Biggest gainers",
and "Biggest losers". Use `price_change_percentage_24h`, and sort a copy of the
filtered array inside a `useMemo`. Treat `null` changes as the end of the list,
and keep the star buttons working while the order changes.

**2. Show a 7-day change**

Add `7d` to the `price_change_percentage` query parameter, inspect the API
response, and find the 7-day field (CoinGecko uses an `_in_currency` name for
this on the markets endpoint). Display it on the detail screen with
`formatPercent`. Handle a missing value with "N/A" and confirm the list screen
still uses its existing 24-hour field.

**3. Change the number of coins**

Change `per_page=50` in `MARKETS_URL` to a smaller number such as 10 or a larger
number such as 100. Check that loading, search, favorites, empty results, and
detail navigation still work. Note that the free API has limits, so requesting
too many coins can make rate limiting more likely.
