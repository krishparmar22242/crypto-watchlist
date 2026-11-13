import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { loadFavorites, saveFavorites } from '../storage/favorites';

const FavoritesContext = createContext(null);

// Both screens need the same stars, so a small Context is simpler than passing
// favorite state through navigation params.
export function FavoritesProvider({ children }) {
  const [favoriteIds, setFavoriteIds] = useState([]);
  const favoriteIdsRef = useRef([]);

  useEffect(() => {
    let isActive = true;

    loadFavorites().then((storedIds) => {
      if (isActive) {
        favoriteIdsRef.current = storedIds;
        setFavoriteIds(storedIds);
      }
    });

    return () => {
      isActive = false;
    };
  }, []);

  const toggleFavorite = useCallback((id) => {
    const current = favoriteIdsRef.current;
    const next = current.includes(id)
      ? current.filter((favoriteId) => favoriteId !== id)
      : [...current, id];

    favoriteIdsRef.current = next;
    setFavoriteIds(next);
    saveFavorites(next);
  }, []);

  const value = useMemo(
    () => ({ favoriteIds, toggleFavorite }),
    [favoriteIds, toggleFavorite]
  );

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used inside FavoritesProvider');
  }
  return context;
}
