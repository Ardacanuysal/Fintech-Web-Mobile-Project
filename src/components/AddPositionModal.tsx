import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import Modal from './ui/Modal';
import Button from './ui/Button';
import Input from './ui/Input';
import { useAuth } from '../context/AuthContext';
import { addToPortfolio } from '../services/firestore';
import { DollarSign, Hash, Search } from 'lucide-react';
import { searchStocks, getStockQuote, StockSearchResult } from '../services/finnhub';

interface AddPositionModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface PositionFormData {
  symbol: string;
  shares: number;
  purchasePrice: number;
}

const AddPositionModal: React.FC<AddPositionModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<StockSearchResult[]>([]);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const { currentUser } = useAuth();
  
  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PositionFormData>({
    defaultValues: {
      shares: 1
    }
  });

  const shares = watch('shares');
  const purchasePrice = watch('purchasePrice');
  const totalValue = shares * (purchasePrice || 0);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }

      try {
        setIsSearching(true);
        const results = await searchStocks(searchQuery);
        setSearchResults(results.result || []);
      } catch (err) {
        console.error('Error searching stocks:', err);
        setError('Failed to search stocks');
      } finally {
        setIsSearching(false);
      }
    };

    if (searchQuery.trim()) {
      timeoutId = setTimeout(performSearch, 500);
    }

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [searchQuery]);

  const handleStockSelect = async (stock: StockSearchResult) => {
    try {
      setLoading(true);
      const quote = await getStockQuote(stock.symbol);
      setSelectedStock(stock);
      setCurrentPrice(quote.c);
      setValue('purchasePrice', quote.c);
      setSearchResults([]);
    } catch (err) {
      console.error('Error getting stock quote:', err);
      setError('Failed to get stock price');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: PositionFormData) => {
    if (!currentUser || !selectedStock) return;

    try {
      setError(null);
      setLoading(true);

      await addToPortfolio(currentUser.uid, {
        id: `${selectedStock.symbol}-${Date.now()}`,
        symbol: selectedStock.symbol,
        name: selectedStock.description || null,
        shares: Number(data.shares),
        purchasePrice: Number(data.purchasePrice),
        addedAt: new Date().toISOString()
      });

      onClose();
    } catch (err) {
      console.error('Error adding position:', err);
      setError('Failed to add position to portfolio');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New Position"
      className="w-1/2 max-w-3xl"
    >
      <div className="text-center mb-6">
        <p className="text-gray-600">
          Search and select a stock to add to your portfolio
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-800 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="mb-6">
        <Input
          placeholder="Search stocks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          leftIcon={<Search className="w-4 h-4 text-gray-400" />}
        />
      </div>

      {isSearching && (
        <div className="text-center text-gray-500 mb-6">
          Searching...
        </div>
      )}

      {searchResults.length > 0 && (
        <div className="mb-6 max-h-48 overflow-y-auto border rounded-lg">
          {searchResults.map((stock) => (
            <div
              key={stock.symbol}
              className="p-3 hover:bg-gray-50 cursor-pointer border-b last:border-b-0"
              onClick={() => handleStockSelect(stock)}
            >
              <div className="font-medium">{stock.symbol}</div>
              <div className="text-sm text-gray-500">{stock.description}</div>
            </div>
          ))}
        </div>
      )}

      {selectedStock && (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="p-4 bg-gray-50 rounded-lg mb-6">
            <div className="font-medium">{selectedStock.symbol}</div>
            <div className="text-sm text-gray-500">{selectedStock.description}</div>
            {currentPrice && (
              <div className="text-sm text-gray-600 mt-2">
                Current Price: ${currentPrice.toFixed(2)}
              </div>
            )}
          </div>

          <Input
            label="Number of Shares"
            type="number"
            step="any"
            {...register('shares', {
              required: 'Number of shares is required',
              min: {
                value: 0.000001,
                message: 'Shares must be greater than 0'
              }
            })}
            error={errors.shares?.message}
            leftIcon={<Hash className="w-4 h-4 text-gray-400" />}
          />

          <Input
            label="Purchase Price per Share"
            type="number"
            step="any"
            {...register('purchasePrice', {
              required: 'Purchase price is required',
              min: {
                value: 0.01,
                message: 'Price must be greater than 0'
              }
            })}
            error={errors.purchasePrice?.message}
            leftIcon={<DollarSign className="w-4 h-4 text-gray-400" />}
          />

          <div className="p-4 bg-gray-50 rounded-lg">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Total Position Value:</span>
              <span className="font-medium">${totalValue.toFixed(2)}</span>
            </div>
          </div>

          <Button
            type="submit"
            fullWidth
            isLoading={loading}
          >
            Add to Portfolio
          </Button>
        </form>
      )}
    </Modal>
  );
};

export default AddPositionModal; 