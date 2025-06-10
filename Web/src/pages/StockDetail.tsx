import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { ArrowUp, ArrowDown, Star, StarOff, Plus, ChevronDown, ChevronUp, BarChart2, Briefcase, Share2, Trash2 } from 'lucide-react';
import StockChart from '../components/StockChart';
import { getStockQuote, getCompanyProfile } from '../services/finnhub';
import { useAuth } from '../context/AuthContext';
import { addToWatchlist, removeFromWatchlist, getUserProfile, removeFromPortfolio, subscribeToPortfolio, addToPortfolio } from '../services/firestore';
import { formatCurrency, formatLargeNumber } from '../utils/formatters';

const StockDetail: React.FC = () => {
  const { symbol } = useParams<{ symbol: string }>();
  const [quote, setQuote] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [inWatchlist, setInWatchlist] = useState(false);
  const [inPortfolio, setInPortfolio] = useState(false);
  const [portfolioItemId, setPortfolioItemId] = useState<string | null>(null);
  const [addingToPortfolio, setAddingToPortfolio] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    if (!symbol) return;

    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Fetch stock quote and company profile in parallel
        const [quoteData, companyData] = await Promise.all([
          getStockQuote(symbol),
          getCompanyProfile(symbol)
        ]);
        
        setQuote(quoteData);
        setCompany(companyData);
        
        // Check user's watchlist and portfolio
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.uid);
          setInWatchlist(userProfile?.watchlist?.includes(symbol) || false);
          
          // Check if stock is in portfolio
          const portfolioItem = userProfile?.portfolio?.find((item: any) => item.symbol === symbol);
          setInPortfolio(!!portfolioItem);
          setPortfolioItemId(portfolioItem?.id || null);
        }
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
    
    // Subscribe to portfolio changes
    let unsubscribe: (() => void) | undefined;
    if (currentUser) {
      unsubscribe = subscribeToPortfolio(currentUser.uid, (items) => {
        const portfolioItem = items.find((item: any) => item.symbol === symbol);
        setInPortfolio(!!portfolioItem);
        setPortfolioItemId(portfolioItem?.id || null);
      });
    }
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [symbol, currentUser]);

  const handleWatchlistToggle = async () => {
    if (!currentUser || !symbol) return;
    
    try {
      if (inWatchlist) {
        await removeFromWatchlist(currentUser.uid, symbol);
        setInWatchlist(false);
      } else {
        await addToWatchlist(currentUser.uid, symbol);
        setInWatchlist(true);
      }
    } catch (err) {
      console.error('Error toggling watchlist:', err);
    }
  };

  const handleRemoveFromPortfolio = async () => {
    if (!currentUser || !portfolioItemId) return;
    
    try {
      await removeFromPortfolio(currentUser.uid, portfolioItemId);
      setInPortfolio(false);
      setPortfolioItemId(null);
    } catch (err) {
      console.error('Error removing from portfolio:', err);
    }
  };

  const handleAddToPortfolio = async () => {
    if (!currentUser || !symbol || !quote || !company) return;
    setAddingToPortfolio(true);
    try {
      await addToPortfolio(currentUser.uid, {
        id: `${symbol}-${Date.now()}`,
        symbol,
        name: company.name || null,
        shares: 1,
        purchasePrice: quote.c,
        addedAt: new Date().toISOString()
      });
      setInPortfolio(true);
    } catch (err) {
      console.error('Error adding to portfolio:', err);
    } finally {
      setAddingToPortfolio(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-8">
        <div className="h-8 bg-gray-200 rounded w-1/4"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
          <div className="h-48 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error || !quote || !company) {
    return (
      <div className="text-center py-12">
        <BarChart2 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Stock Data Not Available</h2>
        <p className="text-gray-500 mb-6">
          {error || "We couldn't load the stock data for this symbol."}
        </p>
        <Button onClick={() => window.history.back()}>Go Back</Button>
      </div>
    );
  }

  const isPositive = quote.dp >= 0;

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold mr-3">{symbol}</h1>
            {company.name && <span className="text-gray-600">{company.name}</span>}
          </div>
          {company.exchange && (
            <p className="text-sm text-gray-500">
              {company.exchange} • {company.finnhubIndustry}
            </p>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          {currentUser && (
            <Button
              variant="outline"
              onClick={handleWatchlistToggle}
              leftIcon={inWatchlist ? <StarOff className="w-4 h-4" /> : <Star className="w-4 h-4" />}
            >
              {inWatchlist ? 'Remove from Watchlist' : 'Add to Watchlist'}
            </Button>
          )}
          
          {inPortfolio ? (
            <Button
              variant="danger"
              onClick={handleRemoveFromPortfolio}
              leftIcon={<Trash2 className="w-4 h-4" />}
            >
              Remove from Portfolio
            </Button>
          ) : (
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={handleAddToPortfolio}
              isLoading={addingToPortfolio}
            >
              Add to Portfolio
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex flex-col md:flex-row md:items-start md:space-x-8">
        <div className="md:w-2/3 space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <div className="flex items-baseline">
                  <CardTitle className="text-3xl mr-3">{formatCurrency(quote.c)}</CardTitle>
                  <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                    {isPositive ? <ArrowUp className="w-4 h-4 mr-1" /> : <ArrowDown className="w-4 h-4 mr-1" />}
                    <span className="font-medium">{formatCurrency(quote.d)} ({quote.dp.toFixed(2)}%)</span>
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Market {quote.t > Date.now() / 1000 - 24 * 60 * 60 ? 'Open' : 'Closed'}
                </p>
              </div>
              
              <div className="flex space-x-2">
                {(['1D', '1W', '1M', '3M', '1Y'] as const).map(period => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      timeframe === period
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                    }`}
                  >
                    {period}
                  </button>
                ))}
              </div>
            </CardHeader>
            <CardContent>
              <StockChart symbol={symbol || ''} timeframe={timeframe} />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>About {company.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-6">
                {company.weburl && (
                  <a 
                    href={company.weburl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline mb-2 inline-block"
                  >
                    {company.weburl.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                )}
              </p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Market Cap</p>
                  <p className="font-medium">{formatLargeNumber(company.marketCapitalization * 1000000)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Employees</p>
                  <p className="font-medium">{company.employeeTotal ? formatLargeNumber(company.employeeTotal) : 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Country</p>
                  <p className="font-medium">{company.country || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">IPO Date</p>
                  <p className="font-medium">{company.ipo || 'N/A'}</p>
                </div>
              </div>
              
              {company.phone && (
                <div className="mb-4">
                  <h4 className="font-medium mb-2">Contact Information</h4>
                  <p className="text-sm text-gray-700">Phone: {company.phone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="md:w-1/3 space-y-6 mt-6 md:mt-0">
          <Card>
            <CardHeader>
              <CardTitle>Key Statistics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Open</span>
                  <span className="font-medium">{formatCurrency(quote.o)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">High</span>
                  <span className="font-medium">{formatCurrency(quote.h)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Low</span>
                  <span className="font-medium">{formatCurrency(quote.l)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">Prev Close</span>
                  <span className="font-medium">{formatCurrency(quote.pc)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="text-gray-600">52W High</span>
                  <span className="font-medium">N/A</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">52W Low</span>
                  <span className="font-medium">N/A</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Related Stocks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {['AAPL', 'MSFT', 'GOOGL', 'AMZN'].filter(s => s !== symbol).slice(0, 3).map(relatedSymbol => (
                  <a 
                    key={relatedSymbol} 
                    href={`/stock/${relatedSymbol}`}
                    className="flex justify-between items-center p-2 hover:bg-gray-50 rounded"
                  >
                    <span className="font-medium">{relatedSymbol}</span>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

const ChevronRight = (props: any) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
    {...props}
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

export default StockDetail; 