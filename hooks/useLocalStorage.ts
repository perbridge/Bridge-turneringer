import { useState, Dispatch, SetStateAction } from 'react';

// This is a private migration function within the hook's module.
// It is specifically for migrating the tournament data structure.
const migrateAndCleanTournaments = (data: any): any[] => {
  if (!Array.isArray(data)) {
    return [];
  }
  
  // 1. Filter out any null or non-object entries.
  const validTournaments = data.filter(t => t && typeof t === 'object');

  // 2. Map over valid entries and add missing properties.
  return validTournaments.map(t => {
    const migrated = { ...t };
    // The `pairs` property was added in a later version. If it doesn't exist, create it.
    if (!migrated.pairs) {
      console.warn(`Migrating old tournament data for "${migrated.name}". Adding default pairs.`);
      
      // CRITICAL FIX: Defensively check if `numTables` is a valid number.
      // If it's not present or not a number, default to 0 to prevent a crash.
      const numTables = (migrated.numTables && typeof migrated.numTables === 'number') ? migrated.numTables : 0;
      const numPairs = numTables * 2;

      migrated.pairs = Array.from({ length: numPairs }, (_, i) => ({
        pairNumber: i + 1,
        player1: `Player ${i * 2 + 1}`,
        player2: `Player ${i * 2 + 2}`,
      }));
    }
    return migrated;
  });
};


export function useLocalStorage<T>(key: string, initialValue: T): [T, Dispatch<SetStateAction<T>>] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }
      
      let parsedItem = JSON.parse(item);

      // IMPORTANT: Perform migration and cleaning synchronously during initialization.
      if (key === 'bridge-tournaments') {
        parsedItem = migrateAndCleanTournaments(parsedItem);
      }
      
      return parsedItem;
    } catch (error) {
      console.error(`Error reading or migrating localStorage key "${key}":`, error);
      // On any error, fall back to the initial value to prevent a crash.
      return initialValue;
    }
  });
  
  const setValue: Dispatch<SetStateAction<T>> = (value) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}