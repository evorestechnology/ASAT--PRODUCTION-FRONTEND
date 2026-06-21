import React, { createContext, useContext, useState, useEffect } from 'react';

const CurrencyContext = createContext();

export const SUPPORTED_CURRENCIES = {
  INR: { symbol: '₹', name: 'Indian Rupee', rate: 1, locale: 'en-IN', decimals: 0 },
  USD: { symbol: '$', name: 'US Dollar', locale: 'en-US', decimals: 2 },
  EUR: { symbol: '€', name: 'Euro', locale: 'en-IE', decimals: 2 },
  GBP: { symbol: '£', name: 'British Pound', locale: 'en-GB', decimals: 2 },
  AED: { symbol: 'AED ', name: 'UAE Dirham', locale: 'en-AE', decimals: 2 },
  SAR: { symbol: 'SR ', name: 'Saudi Riyal', locale: 'en-SA', decimals: 2 },
  CAD: { symbol: 'C$', name: 'Canadian Dollar', locale: 'en-CA', decimals: 2 },
  AUD: { symbol: 'A$', name: 'Australian Dollar', locale: 'en-AU', decimals: 2 },
  JPY: { symbol: '¥', name: 'Japanese Yen', locale: 'ja-JP', decimals: 0 },
  SGD: { symbol: 'S$', name: 'Singapore Dollar', locale: 'en-SG', decimals: 2 }
};

const FALLBACK_RATES = {
  INR: 1,
  USD: 0.012,
  EUR: 0.011,
  GBP: 0.0094,
  AED: 0.044,
  SAR: 0.045,
  CAD: 0.016,
  AUD: 0.018,
  JPY: 1.88,
  SGD: 0.016
};

const CACHE_KEY_RATES = 'asat_currency_rates';
const CACHE_KEY_CURRENCY = 'asat_user_currency';
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours

export function CurrencyProvider({ children }) {
  const [currency, setCurrencyState] = useState('INR');
  const [rates, setRates] = useState(FALLBACK_RATES);
  const [globalCurrencies, setGlobalCurrencies] = useState(SUPPORTED_CURRENCIES);
  const [activeCurrencies, setActiveCurrencies] = useState(['INR', 'USD', 'EUR', 'GBP', 'AED', 'SAR', 'CAD', 'AUD', 'JPY', 'SGD']);
  const [loading, setLoading] = useState(true);

  // Set selected currency & persist in localStorage
  const setCurrency = (code) => {
    if (globalCurrencies[code] || SUPPORTED_CURRENCIES[code]) {
      setCurrencyState(code);
      localStorage.setItem(CACHE_KEY_CURRENCY, code);
      // Dispatch custom event to sync across tabs/components
      window.dispatchEvent(new Event('currency_changed'));
    }
  };

  // Fetch exchange rates and auto-detect country on mount
  useEffect(() => {
    const initCurrencySystem = async () => {
      // 1. Fetch / Load Rates
      let activeRates = FALLBACK_RATES;
      try {
        const cachedData = localStorage.getItem(CACHE_KEY_RATES);
        if (cachedData) {
          const { rates: cachedRates, timestamp } = JSON.parse(cachedData);
          if (Date.now() - timestamp < CACHE_DURATION) {
            activeRates = cachedRates;
            setRates(cachedRates);
          } else {
            activeRates = await fetchRates();
          }
        } else {
          activeRates = await fetchRates();
        }
      } catch (err) {
        console.warn('Failed to load exchange rates, using fallback:', err);
      }

      // 1b. Fetch Global Currencies Dictionary
      let loadedGlobalDict = SUPPORTED_CURRENCIES;
      try {
        const resDict = await fetch((import.meta.env.VITE_API_URL || '') + '/api/currency/dictionary');
        if (resDict.ok) {
          const dictData = await resDict.json();
          if (dictData && Object.keys(dictData).length > 0) {
            loadedGlobalDict = dictData;
            setGlobalCurrencies(dictData);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch global currencies dictionary', err);
      }

      // 1b. Fetch Supported Currencies and Force Refresh Timestamp from Backend
      try {
        const res = await fetch((import.meta.env.VITE_API_URL || '') + '/api/settings');
        if (res.ok) {
          const dbSettings = await res.json();
          // Load active currencies
          if (dbSettings.supported_currencies) {
            setActiveCurrencies(dbSettings.supported_currencies);
          }
          // Handle force refresh
          if (dbSettings.force_rates_refresh_timestamp) {
            const serverForceTime = Number(dbSettings.force_rates_refresh_timestamp);
            const cachedData = localStorage.getItem(CACHE_KEY_RATES);
            let localCacheTime = 0;
            if (cachedData) {
              try { localCacheTime = JSON.parse(cachedData).timestamp; } catch(e){}
            }
            if (serverForceTime > localCacheTime) {
              console.log('Server forced a currency refresh!');
              activeRates = await fetchRates();
            }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch dynamic currencies from backend', err);
      }

      // 2. Auto-detect user currency
      const savedCurrency = localStorage.getItem(CACHE_KEY_CURRENCY);
      if (savedCurrency && SUPPORTED_CURRENCIES[savedCurrency]) {
        setCurrencyState(savedCurrency);
      } else {
        // Run auto-detection
        try {
          const detected = await detectUserCurrency();
          if (detected && SUPPORTED_CURRENCIES[detected]) {
            setCurrencyState(detected);
            localStorage.setItem(CACHE_KEY_CURRENCY, detected);
          } else {
            setCurrencyState('INR');
          }
        } catch (err) {
          console.warn('Currency auto-detection failed, defaulting to INR:', err);
          setCurrencyState('INR');
        }
      }

      setLoading(false);
    };

    initCurrencySystem();

    const handleCurrencySync = () => {
      const saved = localStorage.getItem(CACHE_KEY_CURRENCY);
      if (saved && SUPPORTED_CURRENCIES[saved]) {
        setCurrencyState(saved);
      }
    };

    window.addEventListener('currency_changed', handleCurrencySync);
    window.addEventListener('storage', handleCurrencySync);
    window.addEventListener('force_currency_refresh', fetchRates);

    return () => {
      window.removeEventListener('currency_changed', handleCurrencySync);
      window.removeEventListener('storage', handleCurrencySync);
      window.removeEventListener('force_currency_refresh', fetchRates);
    };
  }, []);

  // Fetch rates from our backend cache to prevent hitting external API limits
  const fetchRates = async () => {
    const url = (import.meta.env.VITE_API_URL || '') + '/api/currency/rates';

    const res = await fetch(url);
    if (!res.ok) throw new Error('Backend API fetch failed');
    const fetchedRates = await res.json();
    
    // Ensure fallback rates are also included if API missed them
    Object.keys(FALLBACK_RATES).forEach(code => {
      if (!fetchedRates[code]) {
        fetchedRates[code] = FALLBACK_RATES[code];
      }
    });

    // Save to cache
    localStorage.setItem(CACHE_KEY_RATES, JSON.stringify({
      rates: fetchedRates,
      timestamp: Date.now()
    }));

    setRates(fetchedRates);
    return fetchedRates;
  };

  // Detect location via IP Geolocation or Browser Locale
  const detectUserCurrency = async () => {
    try {
      const res = await fetch('https://ipapi.co/json/');
      if (res.ok) {
        const data = await res.json();
        if (data.currency && SUPPORTED_CURRENCIES[data.currency]) {
          return data.currency;
        }
      }
    } catch (e) {
      console.warn('IP geolocation failed, falling back to browser locale detection.');
    }

    // Fallback to browser locale map
    const locale = Intl.NumberFormat().resolvedOptions().locale || '';
    if (locale.includes('US')) return 'USD';
    if (locale.includes('GB')) return 'GBP';
    if (locale.includes('IN')) return 'INR';
    if (locale.includes('AE')) return 'AED';
    if (locale.includes('SA')) return 'SAR';
    if (locale.includes('CA')) return 'CAD';
    if (locale.includes('AU')) return 'AUD';
    if (locale.includes('JP')) return 'JPY';
    if (locale.includes('SG')) return 'SGD';

    // Check European countries
    const euroCountries = ['IE', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AT', 'FI', 'PT', 'GR'];
    if (euroCountries.some(code => locale.includes(code))) return 'EUR';

    return 'INR'; // Default to INR if completely uncertain
  };

  // Convert numerical INR value to active currency
  const convertPrice = (priceInINR) => {
    const amount = Number(priceInINR) || 0;
    const rate = rates[currency] || FALLBACK_RATES[currency] || 1;
    return amount * rate;
  };

  // Format INR price with correct symbols and side-by-side display for non-INR users
  const formatPrice = (priceInINR, showOnlyConverted = false) => {
    const amount = Number(priceInINR) || 0;
    
    // 1. Format INR base representation
    const formattedINR = '₹' + amount.toLocaleString('en-IN', {
      maximumFractionDigits: 0
    });

    if (currency === 'INR') {
      return formattedINR;
    }

    // 2. Format converted representation
    const rate = rates[currency] || FALLBACK_RATES[currency] || 1;
    const convertedAmount = amount * rate;
    const info = globalCurrencies[currency] || { symbol: currency + ' ', decimals: 2, locale: 'en-US' };

    const formattedConverted = info.symbol + convertedAmount.toLocaleString(info.locale || 'en-US', {
      minimumFractionDigits: info.decimals !== undefined ? info.decimals : 2,
      maximumFractionDigits: info.decimals !== undefined ? info.decimals : 2
    });

    if (showOnlyConverted) {
      return formattedConverted;
    }

    // 3. Return side-by-side display for international users
    return `${formattedConverted} (${formattedINR})`;
  };

  const value = {
    currency,
    setCurrency,
    rates,
    activeCurrencies,
    globalCurrencies,
    loading,
    convertPrice,
    formatPrice
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
}
