import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from './ui/Card';
import { useAuth } from '../context/AuthContext';
import { subscribeToWatchlist, removeFromWatchlist } from '../services/firestore';
import { getStockQuote, getCompanyProfile } from '../services/finnhub';
import { X } from 'lucide-react';

interface WatchlistStock {
  symbol: string;
  name: string;
  currentPrice: number;
  changePercent: number;
}

const Watchlist: React.FC = () => {
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [detailedStocks, setDetailedStocks] = useState<WatchlistStock[]>([]);
  const [loading, setLoading] = useState(true);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!currentUser) {
      setWatchlist([]);
      setDetailedStocks([]);
      setLoading(false);
      return;
    }

    // Subscribe to watchlist changes
    const unsubscribe = subscribeToWatchlist(currentUser.uid, (data) => {
      setWatchlist(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const fetchDetails = async () => {
      if (watchlist.length === 0) {
        setDetailedStocks([]);
        return;
      }
      setLoading(true);
      try {
        const details = await Promise.all(
          watchlist.map(async (symbol) => {
            try {
              const [profile, quote] = await Promise.all([
                getCompanyProfile(symbol),
                getStockQuote(symbol)
              ]);
              return {
                symbol,
                name: profile?.name || symbol,
                currentPrice: quote?.c ?? 0,
                changePercent: quote?.dp ?? 0
              };
            } catch {
              return {
                symbol,
                name: symbol,
                currentPrice: 0,
                changePercent: 0
              };
            }
          })
        );
        setDetailedStocks(details);
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [watchlist]);

  const handleStockClick = (symbol: string) => {
    navigate(`/stock/${symbol}`);
  };

  const handleRemove = async (symbol: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    await removeFromWatchlist(currentUser.uid, symbol);
  };

  // Default stocks to show if watchlist is empty
  const defaultStocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN'];

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {currentUser ? 'Your Watchlist' : 'Popular Stocks'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse h-8 bg-gray-100 rounded"></div>
            ))}
          </div>
        ) : (
          <ul className="divide-y divide-gray-200">
            {(detailedStocks.length > 0 ? detailedStocks : defaultStocks.map(symbol => ({ symbol, name: symbol, currentPrice: 0, changePercent: 0 }))).map(stock => (
              <li
                key={stock.symbol}
                className="py-3 px-2 cursor-pointer hover:bg-gray-50 transition rounded flex items-center justify-between group"
                onClick={() => handleStockClick(stock.symbol)}
              >
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">{stock.symbol}</div>
                  <div className="text-xs text-gray-500">{stock.name}</div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium text-gray-900 dark:text-white">{stock.currentPrice ? `$${stock.currentPrice.toFixed(2)}` : '-'}</div>
                    <div className={`text-xs ${stock.changePercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>{stock.changePercent ? `${stock.changePercent.toFixed(2)}%` : ''}</div>
                  </div>
                  {watchlist.includes(stock.symbol) && currentUser && (
                    <button
                      className="ml-2 p-1 rounded hover:bg-red-100 text-red-500 hover:text-red-700 transition-opacity opacity-0 group-hover:opacity-100"
                      title="Remove from Watchlist"
                      onClick={e => handleRemove(stock.symbol, e)}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
            {watchlist.length === 0 && currentUser && (
              <li className="text-gray-500 text-sm py-2">Add stocks to your watchlist by searching or viewing stock details.</li>
            )}
          </ul>
        )}
      </CardContent>
    </Card>
  );
};

export default Watchlist;