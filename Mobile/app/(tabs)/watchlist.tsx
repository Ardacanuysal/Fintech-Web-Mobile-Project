import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, Plus, TrendingUp, TrendingDown, Star, X, Bell, BellOff } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { subscribeToWatchlist, addToWatchlist as addToWatchlistFirestore, removeFromWatchlist as removeFromWatchlistFirestore } from '../../services/firestore';
import { getStockQuote, getCompanyProfile, searchStocks } from '../../services/finnhub';

const suggestedStocks = [
  { symbol: 'MSFT', name: 'Microsoft Corporation' },
  { symbol: 'NFLX', name: 'Netflix Inc.' },
  { symbol: 'DIS', name: 'The Walt Disney Company' },
  { symbol: 'INTC', name: 'Intel Corporation' },
  { symbol: 'AMD', name: 'Advanced Micro Devices' },
];

export default function Watchlist() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [watchlistSymbols, setWatchlistSymbols] = useState<string[]>([]);
  const [watchlist, setWatchlist] = useState<any[]>([]);
  const [showAddStock, setShowAddStock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Subscribe to Firestore watchlist
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToWatchlist(user.uid, (symbols: string[]) => {
      setWatchlistSymbols(symbols);
    });
    return () => unsubscribe && unsubscribe();
  }, [user]);

  // Fetch real-time data for watchlist symbols
  useEffect(() => {
    const fetchData = async () => {
      if (!watchlistSymbols.length) {
        setWatchlist([]);
        return;
      }
      setLoading(true);
      try {
        const results = await Promise.all(watchlistSymbols.map(async (symbol) => {
          try {
            const [quote, profile] = await Promise.all([
              getStockQuote(symbol),
              getCompanyProfile(symbol)
            ]);
            return {
              symbol,
              name: profile.name || symbol,
              price: quote.c,
              change: `${quote.dp >= 0 ? '+' : ''}${quote.dp.toFixed(2)}%`,
              changeValue: `${quote.d >= 0 ? '+' : ''}${quote.d.toFixed(2)}`,
              positive: quote.dp >= 0,
              alerts: false, // Alerts can be managed in Firestore if needed
            };
          } catch (err) {
            return { symbol, name: symbol, price: 0, change: 'N/A', changeValue: 'N/A', positive: false, alerts: false };
          }
        }));
        setWatchlist(results);
      } catch (err) {
        setError('Failed to fetch watchlist data');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [watchlistSymbols]);

  // Search effect for add stock
  useEffect(() => {
    let timeoutId: any;
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults([]);
        return;
      }
      setIsSearching(true);
      try {
        const results = await searchStocks(searchQuery);
        setSearchResults(results.result || []);
      } catch (err) {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };
    if (searchQuery.trim()) {
      timeoutId = setTimeout(performSearch, 500);
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [searchQuery]);

  const removeFromWatchlist = async (symbol: string) => {
    if (!user) return;
    await removeFromWatchlistFirestore(user.uid, symbol);
  };

  const addToWatchlist = async (stock: { symbol: string; name: string }) => {
    if (!user) return;
    await addToWatchlistFirestore(user.uid, stock.symbol);
    setShowAddStock(false);
  };

  const toggleAlert = (symbol: string) => {
    // Optional: implement alert toggling in Firestore if needed
    setWatchlist(watchlist.map(stock => 
      stock.symbol === symbol ? { ...stock, alerts: !stock.alerts } : stock
    ));
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Watchlist</Text>
          <Text style={[styles.headerSubtitle, { color: theme.subtitle }]}>Monitor your favorite stocks</Text>
        </View>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => setShowAddStock(!showAddStock)}
        >
          <Plus size={24} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Add Stock Section */}
      {showAddStock && (
        <View style={[styles.addStockContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.searchContainer}>
            <Search size={20} color="#666" />
            <TextInput
              style={styles.searchInput}
              placeholder="Search stocks to add..."
              placeholderTextColor="#666"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <TouchableOpacity onPress={() => setShowAddStock(false)}>
              <X size={20} color="#666" />
            </TouchableOpacity>
          </View>
          
          {isSearching && (
            <Text style={{ color: theme.subtitle, textAlign: 'center', marginVertical: 8 }}>Searching...</Text>
          )}
          {searchResults.length > 0 && (
            <ScrollView style={{ maxHeight: 200, marginBottom: 8 }}>
              {searchResults.map((stock, idx) => (
                <TouchableOpacity
                  key={idx}
                  style={{ paddingVertical: 10, paddingHorizontal: 8, borderBottomWidth: 1, borderColor: theme.border, backgroundColor: '#f9fafb' }}
                  onPress={() => addToWatchlist({ symbol: stock.symbol, name: stock.description })}
                >
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 15 }}>{stock.symbol}</Text>
                  <Text style={{ color: theme.subtitle, fontSize: 12 }}>{stock.description}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>
      )}

      {/* Watchlist Items */}
      <ScrollView style={styles.watchlistContainer} showsVerticalScrollIndicator={false}>
        {watchlist.length === 0 ? (
          <View style={styles.emptyState}>
            <Star size={48} color={theme.subtitle} />
            <Text style={[styles.emptyTitle, { color: theme.text }]}>Your watchlist is empty</Text>
            <Text style={[styles.emptySubtitle, { color: theme.subtitle }]}>Add stocks to start monitoring their performance</Text>
          </View>
        ) : (
          watchlist.map((stock, index) => (
            <View key={index} style={[styles.stockItem, { backgroundColor: theme.card, borderColor: theme.border }]}>
              <View style={styles.stockLeft}>
                <View style={styles.stockHeader}>
                  <Star size={20} color="#f59e0b" fill="#f59e0b" />
                  <Text style={[styles.stockSymbol, { color: theme.text }]}>{stock.symbol}</Text>
                  <TouchableOpacity
                    style={styles.alertButton}
                    onPress={() => toggleAlert(stock.symbol)}
                  >
                    {stock.alerts ? (
                      <Bell size={16} color={theme.primary} fill={theme.primary} />
                    ) : (
                      <BellOff size={16} color={theme.subtitle} />
                    )}
                  </TouchableOpacity>
                </View>
                <Text style={[styles.stockName, { color: theme.subtitle }]}>{stock.name}</Text>
              </View>
              <View style={styles.stockCenter}>
                <Text style={[styles.stockPrice, { color: theme.text }]}>${stock.price.toFixed(2)}</Text>
                <View style={styles.stockChangeContainer}>
                  {stock.positive ? (
                    <TrendingUp size={14} color="#10b981" />
                  ) : (
                    <TrendingDown size={14} color="#ef4444" />
                  )}
                  <Text style={[styles.stockChange, { color: stock.positive ? '#10b981' : '#ef4444' }]}>
                    {stock.change}
                  </Text>
                </View>
                <Text style={[styles.stockChangeValue, { color: stock.positive ? '#10b981' : '#ef4444' }]}>
                  {stock.changeValue}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => removeFromWatchlist(stock.symbol)}
              >
                <X size={20} color="#666" />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      {/* Quick Stats */}
      {watchlist.length > 0 && (
        <View style={[styles.statsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: theme.text }]}>{watchlist.length}</Text>
            <Text style={[styles.statLabel, { color: theme.subtitle }]}>Watching</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#10b981' }]}> {watchlist.filter(stock => stock.positive).length} </Text>
            <Text style={[styles.statLabel, { color: theme.subtitle }]}>Gainers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#ef4444' }]}> {watchlist.filter(stock => !stock.positive).length} </Text>
            <Text style={[styles.statLabel, { color: theme.subtitle }]}>Losers</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: '#3b82f6' }]}> {watchlist.filter(stock => stock.alerts).length} </Text>
            <Text style={[styles.statLabel, { color: theme.subtitle }]}>Alerts</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    paddingBottom: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666666',
  },
  addButton: {
    backgroundColor: '#ffffff',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  addStockContainer: {
    margin: 20,
    marginTop: 0,
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingHorizontal: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    paddingLeft: 12,
    color: '#1f2937',
    fontSize: 16,
  },
  suggestedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  suggestedContainer: {
    marginBottom: 8,
  },
  suggestedItem: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 12,
    marginRight: 12,
    minWidth: 120,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  suggestedSymbol: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#3b82f6',
    marginBottom: 4,
  },
  suggestedName: {
    fontSize: 12,
    color: '#666666',
    lineHeight: 16,
  },
  watchlistContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  stockItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  stockLeft: {
    flex: 1,
  },
  stockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  stockSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginLeft: 8,
    marginRight: 8,
  },
  alertButton: {
    padding: 4,
  },
  stockName: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 28,
  },
  stockCenter: {
    alignItems: 'flex-end',
    marginRight: 16,
  },
  stockPrice: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  stockChangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  stockChange: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  stockChangeValue: {
    fontSize: 12,
    fontWeight: '400',
  },
  removeButton: {
    padding: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    margin: 20,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
  },
});