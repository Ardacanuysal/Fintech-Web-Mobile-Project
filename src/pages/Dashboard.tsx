import React, { useState, useEffect } from 'react';
import MarketOverview from '../components/MarketOverview';
import Watchlist from '../components/Watchlist';
import StockChart from '../components/StockChart';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Newspaper, TrendingUp, ExternalLink, Briefcase, ArrowUp, ArrowDown } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { getMarketNews } from '../services/finnhub';
import { subscribeToPortfolio } from '../services/firestore';
import { getStockQuote } from '../services/finnhub';

interface NewsItem {
  category: string;
  datetime: number;
  headline: string;
  id: number;
  image: string;
  related: string;
  source: string;
  summary: string;
  url: string;
}

const Dashboard: React.FC = () => {
  const { currentUser } = useAuth();
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [portfolioLoading, setPortfolioLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
      setPortfolioItems([]);
      setPortfolioLoading(false);
      return;
    }

    const unsubscribe = subscribeToPortfolio(currentUser.uid, async (items) => {
      try {
        // Fetch current quotes for portfolio items
        const itemsWithQuotes = await Promise.all(
          items.map(async (item) => {
            const quote = await getStockQuote(item.symbol);
            const currentValue = item.shares * quote.c;
            const costBasis = item.shares * item.purchasePrice;
            const gain = currentValue - costBasis;
            const gainPercent = (gain / costBasis) * 100;

            return {
              ...item,
              currentPrice: quote.c,
              currentValue,
              gain,
              gainPercent
            };
          })
        );

        setPortfolioItems(itemsWithQuotes);
      } catch (error) {
        console.error('Error updating portfolio:', error);
      } finally {
        setPortfolioLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        setLoading(true);
        const newsData = await getMarketNews('general');
        setNews(newsData.slice(0, 5));
        setError(null);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load market news');
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
    const interval = setInterval(fetchNews, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">
          {currentUser ? `Welcome back, ${currentUser.displayName || 'Investor'}` : 'Market Dashboard'}
        </h1>
        <p className="text-gray-600">
          Track your investments and market performance
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Market Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <StockChart symbol="SPY" timeframe={timeframe} />
              <div className="mt-4 flex justify-center space-x-2">
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

              {/* Portfolio Summary Section */}
              {currentUser && (
                <div className="mt-6 border-t pt-6">
                  <div className="flex items-center mb-4">
                    <Briefcase className="w-5 h-5 text-gray-500 mr-2" />
                    <h3 className="text-lg font-semibold">Your Portfolio</h3>
                  </div>
                  
                  {portfolioLoading ? (
                    <div className="animate-pulse space-y-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="h-12 bg-gray-100 rounded"></div>
                      ))}
                    </div>
                  ) : portfolioItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">
                      No stocks in your portfolio yet. Add some to track their performance!
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {portfolioItems.map(item => (
                        <div
                          key={item.id}
                          className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg transition-colors cursor-pointer"
                          onClick={() => window.location.href = `/stock/${item.symbol}`}
                        >
                          <div>
                            <div className="font-medium">{item.symbol}</div>
                            <div className="text-sm text-gray-500">{item.shares} shares</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium">${item.currentValue.toFixed(2)}</div>
                            <div className={`text-sm flex items-center justify-end ${
                              item.gainPercent >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {item.gainPercent >= 0 ? (
                                <ArrowUp className="w-3 h-3 mr-1" />
                              ) : (
                                <ArrowDown className="w-3 h-3 mr-1" />
                              )}
                              {Math.abs(item.gainPercent).toFixed(2)}%
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="mt-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Market News</CardTitle>
                <Newspaper className="w-5 h-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                {error ? (
                  <div className="text-center py-6">
                    <p className="text-red-500 mb-2">{error}</p>
                    <button 
                      onClick={() => window.location.reload()}
                      className="text-blue-600 hover:text-blue-800"
                    >
                      Try again
                    </button>
                  </div>
                ) : loading ? (
                  <div className="space-y-4">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="flex space-x-4 animate-pulse">
                        <div className="bg-gray-200 w-24 h-24 rounded-lg flex-shrink-0"></div>
                        <div className="flex-1 space-y-2">
                          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-6">
                    {news.map(item => (
                      <a
                        key={item.id}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex space-x-4 group hover:bg-gray-50 p-2 rounded-lg transition-colors"
                      >
                        {item.image && (
                          <div className="w-24 h-24 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.image}
                              alt={item.headline}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                            />
                          </div>
                        )}
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                              {item.headline}
                            </h3>
                            <ExternalLink className="w-4 h-4 text-gray-400 flex-shrink-0 ml-2" />
                          </div>
                          <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                            {item.summary}
                          </p>
                          <div className="flex items-center mt-2 text-sm text-gray-500">
                            <span className="font-medium text-gray-700">{item.source}</span>
                            <span className="mx-2">•</span>
                            <time dateTime={new Date(item.datetime * 1000).toISOString()}>
                              {format(item.datetime * 1000, 'MMM d, h:mm a')}
                            </time>
                          </div>
                        </div>
                      </a>
                    ))}
                    
                    <button 
                      onClick={() => window.open('https://finnhub.io/news', '_blank')}
                      className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors w-full text-center"
                    >
                      View all news
                    </button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
        
        <div className="space-y-6">
          <MarketOverview />
          <Watchlist />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;