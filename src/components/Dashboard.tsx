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

// ... rest of the imports and interfaces ...

const Dashboard: React.FC = () => {
  // ... existing state and hooks ...

  return (
    <div className="space-y-8">
      {/* ... other components ... */}
      
      {/* Portfolio Summary Section */}
      {currentUser && (
        <div className="mt-6 border-t pt-6">
          <div className="flex items-center mb-4">
            <Briefcase className="w-5 h-5 text-gray-500 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Your Portfolio</h3>
          </div>
          
          {portfolioLoading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          ) : portfolioItems.length === 0 ? (
            <p className="text-gray-700 text-center py-4">
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
                    <div className="font-medium text-gray-900">{item.symbol}</div>
                    <div className="text-sm text-gray-600">{item.shares} shares</div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium text-gray-900">${item.currentValue.toFixed(2)}</div>
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
      
      {/* ... rest of the components ... */}
    </div>
  );
};

export default Dashboard;