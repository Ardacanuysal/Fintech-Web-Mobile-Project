import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card, { CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Search, ArrowUp, ArrowDown, TrendingUp, TrendingDown } from 'lucide-react';
import Input from '../components/ui/Input';
import StockChart from '../components/StockChart';
import { getStockQuote } from '../services/finnhub';

// List of sectors and their ETFs
const SECTORS = [
  { name: 'Technology', symbol: 'XLK', description: 'Information Technology Sector' },
  { name: 'Healthcare', symbol: 'XLV', description: 'Health Care Sector' },
  { name: 'Financials', symbol: 'XLF', description: 'Financial Sector' },
  { name: 'Consumer Discretionary', symbol: 'XLY', description: 'Consumer Discretionary Sector' },
  { name: 'Energy', symbol: 'XLE', description: 'Energy Sector' },
  { name: 'Industrials', symbol: 'XLI', description: 'Industrial Sector' },
  { name: 'Utilities', symbol: 'XLU', description: 'Utilities Sector' },
  { name: 'Materials', symbol: 'XLB', description: 'Materials Sector' },
];

const MarketsPage: React.FC = () => {
  const [sectorData, setSectorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchSectorData = async () => {
      try {
        setLoading(true);
        
        // Fetch data for all sectors in parallel
        const promises = SECTORS.map(sector => 
          getStockQuote(sector.symbol)
            .then(data => ({
              ...sector,
              quote: data
            }))
        );
        
        const results = await Promise.all(promises);
        setSectorData(results);
        
        // Default selected sector
        if (!selectedSector && results.length > 0) {
          setSelectedSector(results[0].symbol);
        }
      } catch (error) {
        console.error('Error fetching sector data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchSectorData();
    
    // Update data every 60 seconds
    const interval = setInterval(fetchSectorData, 60000);
    
    return () => clearInterval(interval);
  }, [selectedSector]);

  const handleSectorClick = (symbol: string) => {
    setSelectedSector(symbol);
  };

  const selectedSectorData = sectorData.find(s => s.symbol === selectedSector);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold mb-2">Markets</h1>
        <p className="text-gray-600">
          Explore market sectors and global indices
        </p>
      </div>
      
      <div className="flex justify-between items-center">
        <div className="flex space-x-2 overflow-x-auto pb-2 max-w-full">
          {sectorData.map(sector => (
            <button
              key={sector.symbol}
              onClick={() => handleSectorClick(sector.symbol)}
              className={`px-4 py-2 rounded-full whitespace-nowrap ${
                selectedSector === sector.symbol
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
              }`}
            >
              {sector.name}
            </button>
          ))}
        </div>
      </div>
      
      {selectedSectorData && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle>{selectedSectorData.name}</CardTitle>
                <p className="text-sm text-gray-500 mt-1">{selectedSectorData.description}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold">${selectedSectorData.quote.c.toFixed(2)}</div>
                <div className={`flex items-center justify-end ${
                  selectedSectorData.quote.dp >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {selectedSectorData.quote.dp >= 0 ? (
                    <ArrowUp className="w-4 h-4 mr-1" />
                  ) : (
                    <ArrowDown className="w-4 h-4 mr-1" />
                  )}
                  <span>{Math.abs(selectedSectorData.quote.dp).toFixed(2)}%</span>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <StockChart symbol={selectedSectorData.symbol} timeframe="3M" />
            
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Open</p>
                <p className="text-lg font-medium">${selectedSectorData.quote.o.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">High</p>
                <p className="text-lg font-medium">${selectedSectorData.quote.h.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Low</p>
                <p className="text-lg font-medium">${selectedSectorData.quote.l.toFixed(2)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Prev Close</p>
                <p className="text-lg font-medium">${selectedSectorData.quote.pc.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Top Gainers</CardTitle>
            <TrendingUp className="w-5 h-5 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { symbol: 'NVDA', name: 'NVIDIA Corp', price: 942.89, change: 3.42 },
                { symbol: 'TSLA', name: 'Tesla Inc', price: 215.65, change: 2.87 },
                { symbol: 'AMD', name: 'Advanced Micro Devices', price: 145.32, change: 2.64 },
                { symbol: 'AAPL', name: 'Apple Inc', price: 185.59, change: 1.89 },
                { symbol: 'MSFT', name: 'Microsoft Corp', price: 412.76, change: 1.54 }
              ].map(stock => (
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
                      {stock.change}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row justify-between items-center">
            <CardTitle>Top Losers</CardTitle>
            <TrendingDown className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { symbol: 'META', name: 'Meta Platforms Inc', price: 478.22, change: -2.34 },
                { symbol: 'NFLX', name: 'Netflix Inc', price: 625.43, change: -1.92 },
                { symbol: 'JPM', name: 'JPMorgan Chase & Co', price: 187.67, change: -1.75 },
                { symbol: 'BAC', name: 'Bank of America Corp', price: 38.92, change: -1.48 },
                { symbol: 'AMZN', name: 'Amazon.com Inc', price: 175.34, change: -1.12 }
              ].map(stock => (
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
                      {Math.abs(stock.change)}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default MarketsPage;