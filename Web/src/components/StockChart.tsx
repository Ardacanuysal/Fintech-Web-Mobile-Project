import React, { useEffect, useState } from 'react';
import { Line } from 'react-chartjs-2';
import { format, subDays, subMonths } from 'date-fns';
import { useAuth } from '../context/AuthContext';
import { getUserProfile } from '../services/firestore';

interface StockChartProps {
  symbol: string;
  timeframe?: '1D' | '1W' | '1M' | '3M' | '1Y';
}

const generateChartData = (timeframe: '1D' | '1W' | '1M' | '3M' | '1Y', basePrice: number = 100, portfolioData: any = null) => {
  const now = new Date();
  let dates: Date[] = [];
  let dataPoints = 0;
  
  switch (timeframe) {
    case '1D':
      dataPoints = 24;
      dates = Array.from({ length: dataPoints }, (_, i) => subDays(now, 1)).map((date, i) => {
        const hours = Math.floor(i * (24 / dataPoints));
        return new Date(date.setHours(hours));
      });
      break;
    case '1W':
      dataPoints = 7;
      dates = Array.from({ length: dataPoints }, (_, i) => subDays(now, 6 - i));
      break;
    case '1M':
      dataPoints = 30;
      dates = Array.from({ length: dataPoints }, (_, i) => subDays(now, 29 - i));
      break;
    case '3M':
      dataPoints = 12;
      dates = Array.from({ length: dataPoints }, (_, i) => subDays(now, 89 - (i * 7)));
      break;
    case '1Y':
      dataPoints = 12;
      dates = Array.from({ length: dataPoints }, (_, i) => subMonths(now, 11 - i));
      break;
  }

  // Generate realistic-looking price data
  const volatility = 0.02; // 2% daily volatility
  let currentPrice = basePrice;
  const prices = dates.map(() => {
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    currentPrice += change;
    return Math.max(currentPrice, 1);
  });

  // If we have portfolio data, adjust the prices based on purchase price
  if (portfolioData) {
    const purchaseDate = new Date(portfolioData.addedAt);
    const purchasePrice = portfolioData.purchasePrice;
    
    // Adjust prices to reflect actual purchase price
    const purchaseIndex = dates.findIndex(date => date >= purchaseDate);
    if (purchaseIndex !== -1) {
      const priceRatio = purchasePrice / prices[purchaseIndex];
      for (let i = 0; i < prices.length; i++) {
        prices[i] *= priceRatio;
      }
    }
  }

  return {
    dates,
    prices
  };
};

const StockChart: React.FC<StockChartProps> = ({ symbol, timeframe = '1M' }) => {
  const [chartData, setChartData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useAuth();

  useEffect(() => {
    const generateChart = async () => {
      try {
        setLoading(true);
        
        // Get portfolio data if user is logged in
        let portfolioData = null;
        if (currentUser) {
          const userProfile = await getUserProfile(currentUser.uid);
          portfolioData = userProfile?.portfolio?.find((item: any) => item.symbol === symbol);
        }
        
        // Generate mock data
        const { dates, prices } = generateChartData(timeframe, 150, portfolioData);
        
        // Format dates based on timeframe
        const labels = dates.map(date => {
          if (timeframe === '1D') {
            return format(date, 'HH:mm');
          } else if (timeframe === '1W' || timeframe === '1M') {
            return format(date, 'MMM dd');
          } else {
            return format(date, 'MMM yyyy');
          }
        });
        
        // Determine chart color based on price movement
        const startPrice = prices[0];
        const endPrice = prices[prices.length - 1];
        const isPositive = endPrice >= startPrice;
        const primaryColor = isPositive ? 'rgba(16, 185, 129, 0.7)' : 'rgba(239, 68, 68, 0.7)';
        const backgroundColor = isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)';
        
        setChartData({
          labels,
          datasets: [
            {
              label: portfolioData ? `${symbol} (Portfolio)` : symbol,
              data: prices,
              borderColor: primaryColor,
              backgroundColor,
              borderWidth: 2,
              pointRadius: 0,
              pointHoverRadius: 5,
              pointBackgroundColor: primaryColor,
              pointHoverBackgroundColor: primaryColor,
              tension: 0.1,
              fill: true,
            },
          ],
        });
        
        setError(null);
      } catch (err) {
        console.error('Error generating chart data:', err);
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    generateChart();
  }, [symbol, timeframe, currentUser]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: any) {
            return `$${context.raw.toFixed(2)}`;
          }
        }
      },
    },
    scales: {
      y: {
        grid: {
          display: true,
          color: 'rgba(0, 0, 0, 0.05)',
        },
        ticks: {
          callback: function(value: any) {
            return '$' + value.toFixed(2);
          }
        }
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          maxRotation: 0,
          maxTicksLimit: 6,
        }
      }
    },
    interaction: {
      mode: 'index' as const,
      intersect: false,
    },
    elements: {
      line: {
        tension: 0.3
      }
    }
  };

  return (
    <div className="h-[300px] w-full">
      {loading ? (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg animate-pulse">
          <p className="text-gray-400">Loading chart...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <p className="text-red-500">{error}</p>
        </div>
      ) : chartData ? (
        <Line data={chartData} options={chartOptions} />
      ) : (
        <div className="flex items-center justify-center h-full bg-gray-50 rounded-lg">
          <p className="text-gray-400">No data available</p>
        </div>
      )}
    </div>
  );
};

export default StockChart;