import axios from 'axios';
const FINNHUB_API_KEY = "d0u5cm1r01qn5fk395n0d0u5cm1r01qn5fk395ng";

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

export interface StockQuote {
  c: number;  // Current price
  d: number;  // Change
  dp: number; // Percent change
  h: number;  // High price of the day
  l: number;  // Low price of the day
  o: number;  // Open price of the day
  pc: number; // Previous close price
}

export interface MarketData {
  name: string;
  symbol: string;
  change: string;
  positive: boolean;
  price: number;
}

export interface NewsItem {
  id: number;
  category: string;
  datetime: number;
  headline: string;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

export interface SectorPerformance {
  sector: string;
  changesPercentage: string;
  changes: string;
  price: string;
  yearHigh: string;
  yearLow: string;
  yearOpen: string;
  yearClose: string;
  updated: string;
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
    const response = await finnhubClient.get('/quote', {
      params: { symbol }
    });
    
    if (!response.data || !response.data.c) {
      throw new Error(`No data received for symbol ${symbol}`);
}

    // Cache the response
    cache.set(cacheKey, {
      data: response.data,
      timestamp: now
    });
    
    return response.data;
  } catch (error) {
    console.error(`Error fetching quote for ${symbol}:`, error);
    throw error;
  }
};

/**
 * Get multiple stock quotes with caching
 */
export const getMultipleStockQuotes = async (symbols: string[]): Promise<StockQuote[]> => {
  try {
  const results = await Promise.all(symbols.map(getStockQuote));
  return results;
  } catch (error) {
    console.error('Error fetching multiple quotes:', error);
    throw error;
  }
};

/**
 * Get market overview data
 */
export const getMarketOverview = async (): Promise<MarketData[]> => {
  const cacheKey = 'market-overview';
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  try {
    const marketIndices = [
      { name: 'S&P 500', symbol: 'SPY' },
      { name: 'Nasdaq Composite', symbol: 'QQQ' },
      { name: 'Dow Jones', symbol: 'DIA' },
      { name: 'Russell 2000', symbol: 'IWM' },
      { name: 'FTSE 100', symbol: 'EFA' }
    ];

    const quotes = await getMultipleStockQuotes(marketIndices.map(index => index.symbol));
    
    const marketData = marketIndices.map((index, i) => {
      const quote = quotes[i];
      if (!quote || typeof quote.dp !== 'number') {
        console.warn(`No valid data received for ${index.symbol}, using fallback data`);
        return {
          name: index.name,
          symbol: index.symbol,
          change: 'N/A',
          positive: false,
          price: 0
        };
      }
      
      const change = quote.dp.toFixed(2);
      return {
        name: index.name,
        symbol: index.symbol,
        change: `${quote.dp >= 0 ? '+' : ''}${change}%`,
        positive: quote.dp >= 0,
        price: quote.c
      };
    }).filter(data => data.change !== 'N/A'); // Filter out failed symbols

    // Cache the response
    cache.set(cacheKey, {
      data: marketData,
      timestamp: now
    });

    return marketData;
  } catch (error) {
    console.error('Error in getMarketOverview:', error);
    throw error;
  }
};

/**
 * Get top gainers and losers
 */
export const getTopGainersLosers = async (): Promise<{ gainers: MarketData[], losers: MarketData[] }> => {
  const cacheKey = 'gainers-losers';
  const now = Date.now();
  
  // Check cache first
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }

  try {
    // Popular tech stocks for demonstration
    const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'META', 'NVDA', 'TSLA', 'NFLX'];
    const quotes = await getMultipleStockQuotes(symbols);
    
    const stocks = symbols.map((symbol, i) => {
      const quote = quotes[i];
      if (!quote || typeof quote.dp !== 'number') {
        return {
          name: symbol,
          symbol: symbol,
          change: 'N/A',
          positive: false,
          price: 0
        };
      }
      
      return {
        name: symbol,
        symbol: symbol,
        change: `${quote.dp >= 0 ? '+' : ''}${quote.dp.toFixed(2)}%`,
        positive: quote.dp >= 0,
        price: quote.c
      };
    });

    const validStocks = stocks.filter(stock => stock.change !== 'N/A');
    const sorted = validStocks.sort((a, b) => {
      const aChange = parseFloat(a.change);
      const bChange = parseFloat(b.change);
      return bChange - aChange;
    });

    const result = {
      gainers: sorted.slice(0, 3),
      losers: sorted.slice(-3).reverse()
    };

    // Cache the response
    cache.set(cacheKey, {
      data: result,
      timestamp: now
    });

    return result;
  } catch (error) {
    console.error('Error in getTopGainersLosers:', error);
    throw error;
  }
};

/**
 * Get market news
 */
export const getMarketNews = async (category: string = 'general'): Promise<NewsItem[]> => {
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
    console.log('Fetching news from Finnhub...');
    const response = await finnhubClient.get('/news', {
      params: { 
        category,
        token: FINNHUB_API_KEY
      }
    });
    
    console.log('Raw news response:', response.data);
    
    if (!response.data || !Array.isArray(response.data)) {
      console.error('Invalid news data received:', response.data);
      throw new Error('Invalid news data received');
    }

    if (response.data.length === 0) {
      console.log('No news data available, trying with different category...');
      // Try with a different category if no news is found
      const alternativeResponse = await finnhubClient.get('/news', {
        params: { 
          category: 'business',
          token: FINNHUB_API_KEY
        }
      });
      
      if (!alternativeResponse.data || !Array.isArray(alternativeResponse.data)) {
        throw new Error('Invalid news data received from alternative category');
      }
      
      response.data = alternativeResponse.data;
    }

    // Format and filter news items
    const formattedNews = response.data
      .filter((item: any) => item.headline && item.summary) // Filter out items without headline or summary
      .map((item: any) => ({
        id: item.id,
        category: item.category,
        datetime: item.datetime,
        headline: item.headline,
        image: item.image || 'https://via.placeholder.com/150', // Fallback image
        related: item.related,
        source: item.source,
        summary: item.summary,
        url: item.url
      }))
      .slice(0, 10); // Limit to 10 most recent news items
    
    console.log('Formatted news data:', formattedNews);
    
    // Cache the response
    cache.set(cacheKey, {
      data: formattedNews,
      timestamp: now
    });
    
    return formattedNews;
  } catch (error) {
    console.error('Error fetching market news:', error);
    if (axios.isAxiosError(error)) {
      console.error('API Error details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
    }
    // Return empty array instead of throwing to prevent app crash
    return [];
  }
};

/**
 * Get sector performance from Finnhub
 */
export const getSectorPerformance = async (): Promise<any[]> => {
  const cacheKey = 'sector-performance';
  const now = Date.now();
  if (cache.has(cacheKey)) {
    const { data, timestamp } = cache.get(cacheKey);
    if (now - timestamp < CACHE_DURATION) {
      return data;
    }
  }
  try {
    const response = await finnhubClient.get('/stock/sector-performance');
    console.log('Raw sector performance response:', response.data);
    if (!response.data || !Array.isArray(response.data)) {
      throw new Error('Invalid sector performance data');
    }
    cache.set(cacheKey, { data: response.data, timestamp: now });
    return response.data;
  } catch (error) {
    console.error('Error fetching sector performance:', error);
    return [];
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
    const url = `${BASE_URL}/stock/candle?symbol=${encodeURIComponent(symbol)}&resolution=${resolution}&from=${from}&to=${to}&token=${FINNHUB_API_KEY}`;
    console.log('Fetching candles URL:', url);
    const response = await fetch(url);
    console.log('Candle response status:', response.status);
    const text = await response.text();
    console.log('Candle response body:', text);
    if (!response.ok) {
      throw new Error('Failed to get candle data');
    }
    const data = JSON.parse(text);
    // Cache the response
    cache.set(cacheKey, {
      data: data,
      timestamp: now
    });
    return data;
  } catch (error) {
    console.error('Error fetching candles:', error);
    throw error;
  }
};

export const getCompanyProfile = async (symbol: string) => {
  try {
    const response = await fetch(
      `${BASE_URL}/stock/profile2?symbol=${symbol}&token=${FINNHUB_API_KEY}`
    );
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching company profile:', error);
    throw error;
  }
};

/**
 * Search for stocks by symbol or name
 */
export const searchStocks = async (query: string) => {
  try {
    const response = await finnhubClient.get('/search', {
      params: { q: query }
    });
    return response.data;
  } catch (error) {
    console.error('Error searching stocks:', error);
    throw error;
  }
}; 