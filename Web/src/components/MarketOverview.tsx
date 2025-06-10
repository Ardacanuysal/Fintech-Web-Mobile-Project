import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import { ArrowUp, ArrowDown, Percent, AlertCircle, TrendingUp, TrendingDown } from 'lucide-react';
import { getStockQuote, getCompanyProfile } from '../services/finnhub';

interface MarketIndex {
  symbol: string;
  name: string;
  quote: any;
  profile?: any;
}

const MARKET_INDICES = [
  { symbol: 'SPY', name: 'S&P 500' },
  { symbol: 'QQQ', name: 'Nasdaq Composite' },
  { symbol: 'DIA', name: 'Dow Jones' },
  { symbol: 'IWM', name: 'Russell 2000' },
  { symbol: 'VIX', name: 'VIX' },
  { symbol: 'EFA', name: 'FTSE 100' },
];

// Popular tech and growth stocks
const POPULAR_STOCKS = [
  { symbol: 'AAPL', name: 'Apple Inc' },
  { symbol: 'MSFT', name: 'Microsoft Corp' },
  { symbol: 'GOOGL', name: 'Alphabet Inc' },
  { symbol: 'AMZN', name: 'Amazon.com Inc' },
  { symbol: 'NVDA', name: 'NVIDIA Corp' },
  { symbol: 'META', name: 'Meta Platforms Inc' },
  { symbol: 'TSLA', name: 'Tesla Inc' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
];

const MarketOverview: React.FC = () => {
  const [marketData, setMarketData] = useState<MarketIndex[]>([]);
  const [popularStocks, setPopularStocks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        setLoading(true);
        
        // Fetch data for all indices in parallel
        const promises = MARKET_INDICES.map(async index => {
          try {
            const [quote, profile] = await Promise.all([
              getStockQuote(index.symbol),
              getCompanyProfile(index.symbol).catch(() => null)
            ]);
            
            return {
              ...index,
              quote,
              profile
            };
          } catch (err) {
            console.error(`Error fetching data for ${index.symbol}:`, err);
            return {
              ...index,
              quote: null,
              profile: null
            };
          }
        });
        
        const results = await Promise.all(promises);
        setMarketData(results);

        // Fetch popular stocks data
        const stockPromises = POPULAR_STOCKS.map(async stock => {
          try {
            const quote = await getStockQuote(stock.symbol);
            return {
              ...stock,
              quote,
              price: quote.c,
              change: quote.dp
            };
          } catch (err) {
            console.error(`Error fetching data for ${stock.symbol}:`, err);
            return null;
          }
        });

        const stockResults = (await Promise.all(stockPromises))
          .filter(stock => stock !== null)
          .sort((a, b) => Math.abs(b.change) - Math.abs(a.change));

        const gainers = stockResults.filter(stock => stock.change > 0)
          .sort((a, b) => b.change - a.change)
          .slice(0, 5);

        const losers = stockResults.filter(stock => stock.change < 0)
          .sort((a, b) => a.change - b.change)
          .slice(0, 5);

        setPopularStocks({ gainers, losers });
        setError(null);
      } catch (err) {
        console.error('Error fetching market data:', err);
        setError('Failed to load market overview');
      } finally {
        setLoading(false);
      }
    };

    fetchMarketData();
    
    // Update market data every 5 minutes instead of 60 seconds
    const interval = setInterval(fetchMarketData, 300000);
    
    return () => clearInterval(interval);
  }, []);

  const handleItemClick = (symbol: string) => {
    navigate(`/stock/${symbol}`);
  };

  const renderQuoteData = (item: MarketIndex) => {
    if (!item.quote || typeof item.quote.c === 'undefined' || typeof item.quote.dp === 'undefined') {
      return (
        <div className="flex items-center text-gray-500">
          <AlertCircle className="w-4 h-4 mr-1" />
          <span className="text-sm">Data unavailable</span>
        </div>
      );
    }

    const isPositive = item.quote.dp >= 0;
    return (
      <>
        <span className="font-semibold">${item.quote.c.toFixed(2)}</span>
        <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
          {isPositive ? <ArrowUp className="w-3 h-3 mr-1" /> : <ArrowDown className="w-3 h-3 mr-1" />}
          <span>{Math.abs(item.quote.dp).toFixed(2)}</span>
          <Percent className="w-3 h-3" />
        </div>
      </>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Market Overview</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="animate-pulse flex justify-between p-2">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-16"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-20"></div>
                  <div className="h-3 bg-gray-200 rounded w-12"></div>
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="text-center py-6">
            <p className="text-red-500 mb-2">{error}</p>
            <button 
              onClick={() => window.location.reload()}
              className="text-blue-600 hover:text-blue-800"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="space-y-2 mb-6">
              {marketData.map(item => (
                <div 
                  key={item.symbol} 
                  className="flex justify-between items-center p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                  onClick={() => handleItemClick(item.symbol)}
                >
                  <div>
                    <h4 className="font-medium">{item.name}</h4>
                    <p className="text-sm text-gray-500">{item.symbol}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    {renderQuoteData(item)}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingUp className="w-5 h-5 text-green-500 mr-2" />
                  Top Gainers
                </h3>
                <div className="space-y-3">
                  {popularStocks.gainers?.map(stock => (
                    <div 
                      key={stock.symbol}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                    >
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-sm text-gray-500">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${stock.price.toFixed(2)}</p>
                        <p className="text-green-600 flex items-center justify-end">
                          <ArrowUp className="w-3 h-3 mr-1" />
                          {stock.change.toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <TrendingDown className="w-5 h-5 text-red-500 mr-2" />
                  Top Losers
                </h3>
                <div className="space-y-3">
                  {popularStocks.losers?.map(stock => (
                    <div 
                      key={stock.symbol}
                      className="flex justify-between items-center p-2 hover:bg-gray-50 rounded cursor-pointer"
                      onClick={() => navigate(`/stock/${stock.symbol}`)}
                    >
                      <div>
                        <p className="font-medium">{stock.symbol}</p>
                        <p className="text-sm text-gray-500">{stock.name}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">${stock.price.toFixed(2)}</p>
                        <p className="text-red-600 flex items-center justify-end">
                          <ArrowDown className="w-3 h-3 mr-1" />
                          {Math.abs(stock.change).toFixed(2)}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketOverview;