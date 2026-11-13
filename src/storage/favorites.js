import AsyncStorage from '@react-native-async-storage/async-storage';

const FAVORITES_KEY = 'favorites:v1';

export async function loadFavorites() {
  try {
    const stored = await AsyncStorage.getItem(FAVORITES_KEY);
    if (!stored) {
      return [];
    }

    const parsed = JSON.parse(stored);
    return Array.isArray(parsed)
      ? parsed.filter((id) => typeof id === 'string')
      : [];
  } catch {
    // A storage failure should leave the app usable, just without saved stars.
    return [];
  }
}

export async function saveFavorites(ids) {
  try {
    await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(ids));
  } catch {
    // Ignore write failures so a storage problem never crashes the app.
  }
}
