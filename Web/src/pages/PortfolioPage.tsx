import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import Button from '../components/ui/Button';
import DeleteConfirmationModal from '../components/ui/DeleteConfirmationModal';
import Input from '../components/ui/Input';
import { 
  BarChart2, 
  PieChart,
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  Plus, 
  Trash2,
  Search
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { subscribeToPortfolio, removeFromPortfolio } from '../services/firestore';
import { getStockQuote, searchStocks } from '../services/finnhub';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { Line, Pie } from 'react-chartjs-2';
import AddPositionModal from '../components/AddPositionModal';

const PortfolioPage: React.FC = () => {
  const [portfolioItems, setPortfolioItems] = useState<any[]>([]);
  const [portfolioValue, setPortfolioValue] = useState(0);
  const [portfolioGain, setPortfolioGain] = useState(0);
  const [portfolioGainPercent, setPortfolioGainPercent] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingPosition, setDeletingPosition] = useState<{ id: string; symbol: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [addPositionModalOpen, setAddPositionModalOpen] = useState(false);
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Historical performance data
  const [performanceData, setPerformanceData] = useState<any>({
    labels: [],
    datasets: []
  });

  // Allocation data
  const [allocationData, setAllocationData] = useState<any>({
    labels: [],
    datasets: []
  });

  useEffect(() => {
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = subscribeToPortfolio(currentUser.uid, async (items) => {
      try {
        const itemsWithQuotes = await Promise.all(
          items.map(async (item) => {
            const quote = await getStockQuote(item.symbol);
            return {
              ...item,
              currentPrice: quote.c,
              change: quote.d,
              changePercent: quote.dp
            };
          })
        );

        // Calculate portfolio metrics
        let totalValue = 0;
        let totalCost = 0;

        itemsWithQuotes.forEach(item => {
          const itemValue = item.shares * item.currentPrice;
          const itemCost = item.shares * item.purchasePrice;
          
          totalValue += itemValue;
          totalCost += itemCost;
        });

        const gain = totalValue - totalCost;
        const gainPercent = totalCost > 0 ? (gain / totalCost) * 100 : 0;

        // Update portfolio metrics
        setPortfolioItems(itemsWithQuotes);
        setPortfolioValue(totalValue);
        setPortfolioGain(gain);
        setPortfolioGainPercent(gainPercent);

        // Update allocation chart data
        const allocationLabels = itemsWithQuotes.map(item => item.symbol);
        const allocationValues = itemsWithQuotes.map(item => (item.shares * item.currentPrice));
        
        setAllocationData({
          labels: allocationLabels,
          datasets: [{
            data: allocationValues,
            backgroundColor: [
              'rgba(54, 162, 235, 0.8)',
              'rgba(75, 192, 192, 0.8)',
              'rgba(153, 102, 255, 0.8)',
              'rgba(255, 159, 64, 0.8)',
              'rgba(255, 99, 132, 0.8)',
              'rgba(255, 206, 86, 0.8)',
            ],
            borderWidth: 1
          }]
        });

        // Generate performance data (simulated historical data)
        const today = new Date();
        const labels = Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(today.getDate() - (29 - i));
          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });

        const baseValue = totalValue * 0.8;
        const performanceValues = labels.map((_, i) => {
          const progress = i / (labels.length - 1);
          const randomFactor = 1 + (Math.random() - 0.5) * 0.1;
          return baseValue + (totalValue - baseValue) * progress * randomFactor;
        });

        setPerformanceData({
          labels,
          datasets: [{
            label: 'Portfolio Value',
            data: performanceValues,
            borderColor: 'rgb(75, 192, 192)',
            backgroundColor: 'rgba(75, 192, 192, 0.1)',
            tension: 0.4,
            fill: true
          }]
        });

        setLoading(false);
      } catch (error) {
        console.error('Error updating portfolio with quotes:', error);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  const handleDeleteClick = (id: string, symbol: string) => {
    setDeletingPosition({ id, symbol });
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!currentUser || !deletingPosition) return;

    try {
      setDeleting(true);
      await removeFromPortfolio(currentUser.uid, deletingPosition.id);
      setDeleteModalOpen(false);
      setDeletingPosition(null);
    } catch (error) {
      console.error('Error deleting position:', error);
      alert('Failed to delete position. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const performanceOptions = {
    responsive: true,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            return formatCurrency(context.raw);
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: false,
        ticks: {
          callback: function(value: any) {
            return formatCurrency(value);
          }
        }
      }
    }
  };

  const allocationOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'right' as const,
        labels: {
          font: {
            size: 12
          }
        }
      },
      tooltip: {
        callbacks: {
          label: function(context: any) {
            const value = context.raw;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${context.label}: ${formatCurrency(value)} (${percentage}%)`;
          }
        }
      }
    }
  };

  if (!currentUser) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className="bg-blue-50 p-8 rounded-lg text-center max-w-md">
          <BarChart2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Portfolio Tracking</h2>
          <p className="text-gray-600 mb-6">
            Sign in to track your investments, monitor performance, and analyze your portfolio allocation.
          </p>
          <div className="flex space-x-4 justify-center">
            <Button onClick={() => navigate('/login')}>Log In</Button>
            <Button variant="outline" onClick={() => navigate('/signup')}>Sign Up</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Your Portfolio</h1>
        <p className="text-gray-600">
          Track and manage your investments
        </p>
      </div>
      
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className="bg-blue-100 p-3 rounded-full mr-4">
                    <DollarSign className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Portfolio Value</p>
                    <p className="text-2xl font-bold" style={{color:"#1d4ed8"}}>{formatCurrency(portfolioValue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full mr-4 ${
                    portfolioGain >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    {portfolioGain >= 0 ? (
                      <TrendingUp className="w-6 h-6 text-green-600" />
                    ) : (
                      <TrendingDown className="w-6 h-6 text-red-600" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Gain/Loss</p>
                    <p className={`text-2xl font-bold ${
                      portfolioGain >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {formatCurrency(portfolioGain)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center">
                  <div className={`p-3 rounded-full mr-4 ${
                    portfolioGainPercent >= 0 ? 'bg-green-100' : 'bg-red-100'
                  }`}>
                    <PieChart className={`w-6 h-6 ${
                      portfolioGainPercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`} />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Return</p>
                    <p className={`text-2xl font-bold ${
                      portfolioGainPercent >= 0 ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {portfolioGainPercent.toFixed(2)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Holdings</CardTitle>
              <div className="flex items-center space-x-4">
                <Button 
                  size="sm"
                  leftIcon={<Plus className="w-4 h-4" />}
                  onClick={() => setAddPositionModalOpen(true)}
                >
                  Add Position
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {portfolioItems.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">
                    Your portfolio is empty. Add positions to get started.
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-2 font-semibold text-black dark:text-white">Symbol</th>
                        <th className="pb-2 font-semibold text-black dark:text-white">Shares</th>
                        <th className="pb-2 font-semibold text-black dark:text-white">Avg Price</th>
                        <th className="pb-2 font-semibold text-black dark:text-white">Current</th>
                        <th className="pb-2 font-semibold text-black dark:text-white">Value</th>
                        <th className="pb-2 font-semibold text-black dark:text-white">Gain/Loss</th>
                        <th className="pb-2 font-semibold text-black dark:text-white"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {portfolioItems.map(item => {
                        const value = item.shares * item.currentPrice;
                        const cost = item.shares * item.purchasePrice;
                        const gain = value - cost;
                        const gainPercent = (gain / cost) * 100;
                        
                        return (
                          <tr 
                            key={item.id} 
                            className="border-b hover:bg-gray-50 cursor-pointer"
                            onClick={() => navigate(`/stock/${item.symbol}`)}
                          >
                            <td className="py-3 text-black dark:text-white">
                              <div className="font-medium">{item.symbol}</div>
                              {item.name && <div className="text-xs text-gray-500">{item.name}</div>}
                            </td>
                            <td className="py-3 text-black dark:text-white">{item.shares}</td>
                            <td className="py-3 text-black dark:text-white">{formatCurrency(item.purchasePrice)}</td>
                            <td className="py-3 text-black dark:text-white">{formatCurrency(item.currentPrice)}</td>
                            <td className="py-3 font-medium text-black dark:text-white">{formatCurrency(value)}</td>
                            <td className={`py-3 ${gain >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatCurrency(gain)} ({gainPercent.toFixed(2)}%)</td>
                            <td className="py-3">
                              <button 
                                className="p-1 text-gray-400 hover:text-red-500 focus:outline-none"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteClick(item.id, item.symbol);
                                }}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Portfolio Allocation</CardTitle>
              </CardHeader>
              <CardContent>
                {portfolioItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Add positions to see your portfolio allocation.
                    </p>
                  </div>
                ) : (
                  <div className="h-64">
                    <Pie data={allocationData} options={allocationOptions} />
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent>
                {portfolioItems.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">
                      Add positions to track your portfolio performance.
                    </p>
                  </div>
                ) : (
                  <div className="h-64">
                    <Line data={performanceData} options={performanceOptions} />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}

      <AddPositionModal
        isOpen={addPositionModalOpen}
        onClose={() => setAddPositionModalOpen(false)}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingPosition(null);
        }}
        onConfirm={handleDeleteConfirm}
        title="Delete Position"
        message={`Are you sure you want to remove ${deletingPosition?.symbol} from your portfolio? This action cannot be undone.`}
        loading={deleting}
      />
    </div>
  );
};

export default PortfolioPage;