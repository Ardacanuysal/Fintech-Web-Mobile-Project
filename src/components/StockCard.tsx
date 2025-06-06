import React, { useState, useEffect } from 'react';
import { ArrowUp, ArrowDown, Star, StarOff, AlertCircle } from 'lucide-react';
import Card from './ui/Card';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { getStockQuote } from '../services/finnhub';
import { useAuth } from '../context/AuthContext';

interface StockCardProps {
  symbol: string;
  companyName?: string;
  inWatchlist?: boolean;
  onClick?: () => void;
}

const StockCard: React.FC<StockCardProps> = ({
  symbol,
  companyName,
  inWatchlist = false,
  onClick
}) => {
  const [quote, setQuote] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInWatchlist, setIsInWatchlist] = useState(inWatchlist);
  const { currentUser } = useAuth();

  useEffect(() => {
    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getStockQuote(symbol);
        if (!data || typeof data.c === 'undefined') {
          throw new Error('Invalid data received');
        }
        setQuote(data);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data');
        setQuote(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
    
    // Update every 5 minutes instead of 60 seconds
    const interval = setInterval(fetchStockData, 300000);
    return () => clearInterval(interval);
  }, [symbol]);
  
  const handleWatchlistToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentUser) return;
    
    try {
      setIsInWatchlist(!isInWatchlist);
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <div className="mt-4 flex justify-center">
          <div className="animate-pulse h-16 w-full bg-gray-200 rounded"></div>
        </div>
      );
    }

    if (error || !quote) {
      return (
        <div className="mt-4 flex items-center justify-center text-gray-500">
          <AlertCircle className="w-5 h-5 mr-2" />
          <span>Failed to load stock data</span>
        </div>
      );
    }

    const isPositive = quote.dp >= 0;
    
    return (
      <div className="mt-4">
        <div className="flex justify-between items-baseline">
          <span className="text-2xl font-bold">{formatCurrency(quote.c)}</span>
          <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
            {isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
            <span className="font-medium">{formatPercentage(quote.dp)}</span>
          </div>
        </div>
        
        <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-gray-600">
          <div>
            <span className="block">Open</span>
            <span className="font-medium">{formatCurrency(quote.o)}</span>
          </div>
          <div>
            <span className="block">High</span>
            <span className="font-medium">{formatCurrency(quote.h)}</span>
          </div>
          <div>
            <span className="block">Low</span>
            <span className="font-medium">{formatCurrency(quote.l)}</span>
          </div>
          <div>
            <span className="block">Prev Close</span>
            <span className="font-medium">{formatCurrency(quote.pc)}</span>
          </div>
        </div>
      </div>
    );
  };
  
  return (
    <Card 
      className="transition-all duration-200 hover:shadow-md cursor-pointer"
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-lg font-bold">{symbol}</h3>
          {companyName && <p className="text-sm text-gray-600">{companyName}</p>}
        </div>
        {currentUser && (
          <button 
            onClick={handleWatchlistToggle}
            className="text-gray-400 hover:text-yellow-500 focus:outline-none"
            aria-label={isInWatchlist ? "Remove from watchlist" : "Add to watchlist"}
          >
            {isInWatchlist ? (
              <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOff className="w-5 h-5" />
            )}
          </button>
        )}
      </div>
      
      {renderContent()}
    </Card>
  );
};

export default StockCard;