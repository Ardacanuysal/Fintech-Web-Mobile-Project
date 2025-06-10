import axios from 'axios';

const FINNHUB_API_KEY = import.meta.env.VITE_FINNHUB_API_KEY;
const BASE_URL = 'https://finnhub.io/api/v1';

// Create axios instance with default headers
const finnhubClient = axios.create({
  baseURL: BASE_URL,
  params: {
    token: FINNHUB_API_KEY
  }
});

// Cache for API responses
const cache = new Map();
const CACHE_DURATION = 10 * 60 * 1000; // 10 minutes cache duration

export interface StockSearchResult {
  description: string;
  displaySymbol: string;
  symbol: string;
  type: string;
}

export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
}

/**
 * Get stock quote data with caching
 */
export const getStockQuote = async (symbol: string): Promise<StockQuote> => {
  const cacheKey = `quote-${symbol}`;
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  
  try {
    const response = await fetch(
      `${BASE_URL}/quote?symbol=${encodeURIComponent(symbol)}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to get stock quote');
    }

    const data = await response.json();
    
    // Cache the response
    cache.set(cacheKey, {
      data: data,
      timestamp: now
    });
    
    return data;
  } catch (error) {
    console.error('Error getting stock quote:', error);
    throw error;
  }
};

/**
 * Search for stocks
 */
export const searchStocks = async (query: string): Promise<{ result: StockSearchResult[] }> => {
  const cacheKey = `search-${query}`;
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  
  try {
    const response = await fetch(
      `${BASE_URL}/search?q=${encodeURIComponent(query)}&token=${FINNHUB_API_KEY}`
    );
    
    if (!response.ok) {
      throw new Error('Failed to search stocks');
    }

    const data = await response.json();
    const filteredResults = data.result.filter((item: any) => 
      item.symbol && item.description && 
      // Only include stocks (exclude crypto, forex, etc.)
      item.type === 'Common Stock'
    );
    
    const results = {
      result: filteredResults
    };
    
    // Cache the response
    cache.set(cacheKey, {
      data: results,
      timestamp: now
    });
    
    return results;
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
};

/**
 * Get candle data for charts
 */
export const getCandles = async (symbol: string, resolution: string, from: number, to: number) => {
  const cacheKey = `candles-${symbol}-${resolution}-${from}-${to}`;
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  
  try {
    const response = await finnhubClient.get('/stock/candle', {
      params: { symbol, resolution, from, to }
    });
    
    // Cache the response
    cache.set(cacheKey, {
      data: response.data,
      timestamp: now
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching candles:', error);
    throw error;
  }
};

/**
 * Get company profile
 */
export const getCompanyProfile = async (symbol: string) => {
  const cacheKey = `profile-${symbol}`;
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (now - timestamp < CACHE_DURATION * 10) { // Longer cache for profile data
      return data;
    }
  }
  
  try {
    const response = await finnhubClient.get('/stock/profile2', {
      params: { symbol }
    });
    
    // Cache the response
    cache.set(cacheKey, {
      data: response.data,
      timestamp: now
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching company profile:', error);
    throw error;
  }
};

/**
 * Get market news
 */
export const getMarketNews = async (category: string = 'general') => {
  const cacheKey = `news-${category}`;
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (now - timestamp < CACHE_DURATION * 5) { // 50 minutes for news
      return data;
    }
  }
  
  try {
    const response = await finnhubClient.get('/news', {
      params: { 
        category,
        token: FINNHUB_API_KEY
      }
    });
    
    // Cache the response
    cache.set(cacheKey, {
      data: response.data,
      timestamp: now
    });
    
    return response.data;
  } catch (error) {
    console.error('Error fetching market news:', error);
    throw error;
  }
};