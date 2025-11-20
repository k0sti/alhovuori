/**
 * LocalStorage utility functions for survey form data
 */

// Storage keys
export const STORAGE_KEY = 'survey_form_data';
export const LAST_SAVE_KEY = 'survey_last_save';
export const FORM_COMPLETED_KEY = 'survey_form_completed';

/**
 * Save form data to localStorage
 */
export function saveToLocalStorage(key: string, data: any): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
    throw error;
  }
}

/**
 * Load form data from localStorage
 */
export function loadFromLocalStorage(key: string): any | null {
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error loading from localStorage:', error);
    return null;
  }
}

/**
 * Remove an item from localStorage
 */
export function removeFromLocalStorage(key: string): void {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error removing from localStorage:', error);
  }
}

/**
 * Clear multiple keys from localStorage
 */
export function clearLocalStorageKeys(...keys: string[]): void {
  try {
    keys.forEach(key => localStorage.removeItem(key));
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
}

/**
 * Check if localStorage is available
 */
export function isLocalStorageAvailable(): boolean {
  try {
    const test = '__localStorage_test__';
    localStorage.setItem(test, test);
    localStorage.removeItem(test);
    return true;
  } catch {
    return false;
  }
}
