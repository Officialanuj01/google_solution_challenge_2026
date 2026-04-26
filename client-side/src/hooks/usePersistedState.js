import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting state in localStorage
 * @param {string} key - The localStorage key
 * @param {any} defaultValue - Default value if no stored value exists
 * @param {object} options - Configuration options
 * @returns {[value, setValue, clearValue]} - State value, setter, and clear function
 */
export const usePersistedState = (key, defaultValue, options = {}) => {
  const { 
    serialize = JSON.stringify, 
    deserialize = JSON.parse,
    skipSerialization = false 
  } = options;

  // Get initial value from localStorage or use default
  const getStoredValue = useCallback(() => {
    try {
      const item = localStorage.getItem(key);
      if (item === null) return defaultValue;
      
      if (skipSerialization) return item;
      return deserialize(item);
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return defaultValue;
    }
  }, [key, defaultValue, deserialize, skipSerialization]);

  const [value, setValue] = useState(getStoredValue);

  // Update localStorage when value changes
  useEffect(() => {
    try {
      if (value === undefined || value === null) {
        localStorage.removeItem(key);
      } else {
        const valueToStore = skipSerialization ? value : serialize(value);
        localStorage.setItem(key, valueToStore);
      }
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, value, serialize, skipSerialization]);

  // Clear function
  const clearValue = useCallback(() => {
    localStorage.removeItem(key);
    setValue(defaultValue);
  }, [key, defaultValue]);

  return [value, setValue, clearValue];
};

/**
 * Hook for persisting complex objects with automatic cleanup
 * @param {string} key - The localStorage key
 * @param {object} defaultState - Default state object
 * @param {number} ttl - Time to live in milliseconds (optional)
 * @returns {[state, updateState, clearState]} - State object, update function, and clear function
 */
export const usePersistedObject = (key, defaultState, ttl = null) => {
  const [storedData, setStoredData, clearStoredData] = usePersistedState(
    key,
    { data: defaultState, timestamp: Date.now() },
    {
      serialize: (value) => JSON.stringify(value),
      deserialize: (value) => {
        const parsed = JSON.parse(value);
        
        // Check TTL if provided
        if (ttl && parsed.timestamp && (Date.now() - parsed.timestamp > ttl)) {
          return { data: defaultState, timestamp: Date.now() };
        }
        
        return parsed;
      }
    }
  );

  const updateState = useCallback((updates) => {
    setStoredData(prev => ({
      data: typeof updates === 'function' ? updates(prev.data) : { ...prev.data, ...updates },
      timestamp: Date.now()
    }));
  }, [setStoredData]);

  const clearState = useCallback(() => {
    clearStoredData();
  }, [clearStoredData]);

  return [storedData.data, updateState, clearState];
};

/**
 * Hook for persisting file-related state with special handling for File objects
 * @param {string} key - The localStorage key
 * @param {object} defaultState - Default state object
 * @returns {[state, updateState, clearState]} - State object, update function, and clear function
 */
export const usePersistedFileState = (key, defaultState) => {
  const [state, updateState, clearState] = usePersistedObject(key, defaultState);

  // Custom update function that handles File objects properly
  const updateFileState = useCallback((updates) => {
    updateState(currentState => {
      const newState = typeof updates === 'function' ? updates(currentState) : { ...currentState, ...updates };
      
      // Handle File objects - we can't serialize them, so we store metadata instead
      if (newState.file && newState.file instanceof File) {
        newState.fileMetadata = {
          name: newState.file.name,
          size: newState.file.size,
          type: newState.file.type,
          lastModified: newState.file.lastModified
        };
      }
      
      return newState;
    });
  }, [updateState]);

  return [state, updateFileState, clearState];
};
