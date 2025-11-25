import { useState, useEffect } from 'react';
import { storage } from '../services/UnifiedStorage';

export interface CurrencyConfig {
  code: string;
  name: string;
  symbol: string;
  locale: string;
}

const DEFAULT_CURRENCY: CurrencyConfig = {
  code: 'IDR',
  name: 'Indonesian Rupiah',
  symbol: 'Rp',
  locale: 'id-ID'
};

// Global currency state
let globalCurrencyConfig: CurrencyConfig = DEFAULT_CURRENCY;
const currencyListeners = new Set<(config: CurrencyConfig) => void>();

// Load currency from UnifiedStorage
async function loadCurrencyFromStorage(): Promise<CurrencyConfig> {
  try {
    const saved = await storage.getCurrencySettings();
    if (saved && saved.code && saved.symbol) {
      // Convert CurrencySettings back to CurrencyConfig
      return {
        code: saved.code || 'IDR',
        name: getCurrencyName(saved.code),
        symbol: saved.symbol || 'Rp',
        locale: getLocaleForCurrency(saved.code)
      };
    }
  } catch { // Error handled silently
    }
  return DEFAULT_CURRENCY;
}

// Helper function to get currency name from code
function getCurrencyName(code: string): string {
  const names: Record<string, string> = {
    USD: 'US Dollar',
    EUR: 'Euro',
    GBP: 'British Pound',
    JPY: 'Japanese Yen',
    IDR: 'Indonesian Rupiah'
  };
  return names[code] || code;
}

// Helper function to get locale for currency
function getLocaleForCurrency(code: string): string {
  const locales: Record<string, string> = {
    USD: 'en-US',
    EUR: 'de-DE',
    GBP: 'en-GB',
    JPY: 'ja-JP',
    IDR: 'id-ID'
  };
  return locales[code] || 'en-US';
}

// Save currency to UnifiedStorage with proper type conversion
async function saveCurrencyToStorage(config: CurrencyConfig): Promise<void> {
  try {
    // Convert CurrencyConfig to CurrencySettings format
    const currencySettings: import('../services/UnifiedStorage').CurrencySettings = {
      code: config.code,
      symbol: config.symbol,
      decimalPlaces: 0, // Default value
      thousandSeparator: '.', // Default for IDR
      decimalSeparator: ',' // Default for IDR
    };
    await storage.storeCurrencySettings(currencySettings);
  } catch { // Error handled silently
    }
}

// Get current currency configuration
export async function getCurrencyConfig(): Promise<CurrencyConfig> {
  if (!globalCurrencyConfig || globalCurrencyConfig.code === DEFAULT_CURRENCY.code) {
    globalCurrencyConfig = await loadCurrencyFromStorage();
  }
  return globalCurrencyConfig;
}

// Get current currency configuration synchronously
export function getCurrencyConfigSync(): CurrencyConfig {
  return globalCurrencyConfig;
}

// Set new currency configuration
export async function setCurrencyConfig(config: CurrencyConfig): Promise<void> {
  globalCurrencyConfig = config;
  await saveCurrencyToStorage(config);

  // Notify all listeners
  currencyListeners.forEach(listener => listener(config));
}

// Format currency amount
export function formatCurrency(amount: number, config?: CurrencyConfig): string {
  const currencyConfig = config || getCurrencyConfigSync();

  try {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    }).format(amount);
  } catch {
    // Fallback formatting if Intl.NumberFormat fails
    return `${currencyConfig.symbol} ${amount.toFixed(2)}`;
  }
}

// Format currency without decimals (for whole amounts)
export function formatCurrencyWhole(amount: number, config?: CurrencyConfig): string {
  const currencyConfig = config || getCurrencyConfigSync();

  try {
    return new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  } catch {
    // Fallback formatting if Intl.NumberFormat fails
    return `${currencyConfig.symbol} ${Math.round(amount).toLocaleString()}`;
  }
}

// Format currency for printing (simplified version)
export function formatCurrencyForPrint(amount: number, config?: CurrencyConfig): string {
  const currencyConfig = config || getCurrencyConfigSync();

  try {
    const formatted = new Intl.NumberFormat(currencyConfig.locale, {
      style: 'currency',
      currency: currencyConfig.code,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);

    // Remove currency code and use symbol for better printing
    return formatted.replace(currencyConfig.code, currencyConfig.symbol);
  } catch {
    // Fallback formatting
    return `${currencyConfig.symbol} ${Math.round(amount).toLocaleString()}`;
  }
}

// React hook for currency
export function useCurrency(): [CurrencyConfig, (config: CurrencyConfig) => void] {
  const [currency, setCurrency] = useState<CurrencyConfig>(getCurrencyConfigSync);

  useEffect(() => {
    // Update state when global currency changes
    const handleCurrencyChange = (newConfig: CurrencyConfig) => {
      setCurrency(newConfig);
    };

    currencyListeners.add(handleCurrencyChange);

    return () => {
      currencyListeners.delete(handleCurrencyChange);
    };
  }, []);

  const updateCurrency = (newConfig: CurrencyConfig) => {
    // Fire and forget for UI updates, but log if it fails
    setCurrencyConfig(newConfig).catch(() => {
      // Error handled silently for UI updates
    });
  };

  return [currency, updateCurrency];
}

// Listen for currency changes globally
export function addCurrencyChangeListener(listener: (config: CurrencyConfig) => void): () => void {
  currencyListeners.add(listener);

  // Return cleanup function
  return () => {
    currencyListeners.delete(listener);
  };
}

// Initialize currency on module load
if (typeof window !== 'undefined') {
  // Load currency asynchronously
  loadCurrencyFromStorage().then(config => {
    globalCurrencyConfig = config;
  });

  // Listen for custom currency change events
  window.addEventListener('currencyChanged', (event: Event) => {
    const customEvent = event as CustomEvent;
    if (customEvent.detail) {
      setCurrencyConfig(customEvent.detail);
    }
  });
}

export default {
  getCurrencyConfig,
  getCurrencyConfigSync,
  setCurrencyConfig,
  formatCurrency,
  formatCurrencyWhole,
  formatCurrencyForPrint,
  useCurrency,
  addCurrencyChangeListener
};
