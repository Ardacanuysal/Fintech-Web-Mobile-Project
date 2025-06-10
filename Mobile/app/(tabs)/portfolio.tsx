import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Modal, TextInput, Alert, ActivityIndicator, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Plus, Eye, EyeOff, X, Star, Bell, BellOff } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { useRouter } from 'expo-router';
import { getStockQuote, getCompanyProfile, searchStocks } from '../../services/finnhub';
import { useAuth } from '../context/AuthContext';
import { addToPortfolio as addToPortfolioFirestore, subscribeToPortfolio, removeFromPortfolio } from '../../services/firestore';

const screenWidth = Dimensions.get('window').width;
const isSmallScreen = screenWidth < 400;

interface PortfolioItem {
  symbol: string;
  name: string;
  shares: number;
  avgPrice: number;
  currentPrice?: number;
  value?: number;
  id?: string;
  companyName?: string;
  exchange?: string;
}

export default function Portfolio() {
  const { theme } = useTheme();
  const router = useRouter();
  const [showValues, setShowValues] = useState(true);
  const [selectedTab, setSelectedTab] = useState('holdings');
  const [portfolioData, setPortfolioData] = useState<PortfolioItem[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newStockSymbol, setNewStockSymbol] = useState('');
  const [newStockShares, setNewStockShares] = useState('');
  const [newStockPrice, setNewStockPrice] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedStock, setSelectedStock] = useState<any>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [currentPrice, setCurrentPrice] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { user } = useAuth();

  // Subscribe to Firestore portfolio (subcollection)
  useEffect(() => {
    if (!user) return;
    const unsubscribe = subscribeToPortfolio(user.uid, (data: any[]) => {
      setPortfolioData(data);
    });
    return () => unsubscribe && unsubscribe();
  }, [user]);

  // Update prices and company info for portfolioData from Firestore
  useEffect(() => {
    const updateDetails = async () => {
      try {
        const updatedData = await Promise.all(
          portfolioData.map(async (item: any) => {
            let quote = { c: undefined };
            let profile = { name: '', exchange: '' };
            try {
              [quote, profile] = await Promise.all([
                getStockQuote(item.symbol),
                getCompanyProfile(item.symbol)
              ]);
            } catch (err) {
              // API error, fallback to empty
              console.error('Finnhub API error for', item.symbol, err);
            }
            const shares = Number(item.shares) || 0;
            const avgPrice = Number(item.avgPrice ?? item.purchasePrice) || 0;
            const currentPrice = typeof quote.c === 'number' && !isNaN(quote.c) ? quote.c : undefined;
            const value = typeof currentPrice === 'number' && !isNaN(currentPrice) ? shares * currentPrice : undefined;
            return {
              ...item,
              shares,
              avgPrice,
              currentPrice,
              value,
              companyName: profile.name || item.name,
              exchange: profile.exchange || '',
            };
          })
        );
        setPortfolioData(updatedData);
      } catch (error) {
        console.error('Error updating details:', error);
      }
    };
    if (portfolioData.length > 0) {
      updateDetails();
      const interval = setInterval(updateDetails, 60000);
      return () => clearInterval(interval);
    }
  }, [portfolioData.length]);

  // Stock search effect
  useEffect(() => {
    let timeoutId: any;
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
        setError('Failed to search stocks');
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

  const totalValue = portfolioData.reduce((sum, item) => sum + (item.value ?? 0), 0);
  const totalCost = portfolioData.reduce((sum, item) => sum + (item.shares * item.avgPrice), 0);
  const totalGainLoss = totalValue - totalCost;
  const totalGainLossPercent = totalCost > 0 ? ((totalGainLoss / totalCost) * 100).toFixed(2) : '0.00';

  const handleStockPress = (symbol: string) => {
    router.push({
      pathname: "/stock/[symbol]",
      params: { symbol }
    } as any);
  };

  const resetModalState = () => {
    setSearchQuery('');
    setSearchResults([]);
    setSelectedStock(null);
    setCurrentPrice(null);
    setNewStockSymbol('');
    setNewStockShares('');
    setNewStockPrice('');
    setError(null);
    setSuccess(null);
    setIsSearching(false);
  };

  const handleModalClose = () => {
    setShowAddModal(false);
    resetModalState();
  };

  const handleAddInvestment = async () => {
    if (!selectedStock || !newStockShares || !newStockPrice || isNaN(Number(newStockShares)) || isNaN(Number(newStockPrice)) || Number(newStockShares) <= 0 || Number(newStockPrice) <= 0) {
      setError('Please fill in all fields with valid values and select a stock.');
      return;
    }
    if (!user) {
      setError('You must be logged in to add to your portfolio.');
      return;
    }
    setError(null);
    setSuccess(null);
    setIsSearching(true);
    try {
      const quote = await getStockQuote(selectedStock.symbol);
      const shares = parseFloat(newStockShares);
      const price = parseFloat(newStockPrice);
      const newItem: PortfolioItem = {
        symbol: selectedStock.symbol.toUpperCase(),
        name: selectedStock.description || selectedStock.symbol,
        shares,
        avgPrice: price,
        currentPrice: quote.c,
        value: shares * quote.c,
        companyName: selectedStock.name || selectedStock.symbol,
        exchange: selectedStock.exchange || '',
      };
      // Save to Firestore (subcollection)
      await addToPortfolioFirestore(user.uid, {
        id: `${newItem.symbol}-${Date.now()}`,
        symbol: newItem.symbol,
        name: newItem.name,
        shares: newItem.shares,
        purchasePrice: newItem.avgPrice,
        addedAt: new Date().toISOString(),
      });
      setSuccess('Investment added successfully!');
      setTimeout(() => {
        handleModalClose();
      }, 1200);
    } catch (error) {
      setError('Failed to add investment. Please check the stock symbol and try again.');
    } finally {
      setIsSearching(false);
    }
  };

  const handleStockSelect = async (stock: any) => {
    try {
      setIsSearching(true);
      const quote = await getStockQuote(stock.symbol);
      setSelectedStock(stock);
      setCurrentPrice(quote.c);
      setNewStockSymbol(stock.symbol);
      setNewStockPrice(quote.c.toString());
      setSearchResults([]);
    } catch (err) {
      setError('Failed to get stock price');
    } finally {
      setIsSearching(false);
    }
  };

  const pieData = portfolioData.map((item, index) => ({
    name: item.symbol,
    population: Number(((item.value / totalValue) * 100).toFixed(2)),
    color: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'][index % 5],
    legendFontColor: '#666',
    legendFontSize: 12,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>Portfolio</Text>
            <Text style={[styles.headerSubtitle, { color: theme.subtitle }]}>Track your investments</Text>
          </View>
          <TouchableOpacity
            style={styles.visibilityButton}
            onPress={() => setShowValues(!showValues)}
          >
            {showValues ? <Eye size={24} color={theme.subtitle} /> : <EyeOff size={24} color={theme.subtitle} />}
          </TouchableOpacity>
        </View>

        {/* Portfolio Summary */}
        <View style={styles.summaryContainer}>
          <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, flexWrap: 'nowrap' }}>
            {/* Portfolio Value */}
            <View style={[styles.summaryCard, { width: 110, backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center', paddingVertical: 8, marginBottom: 0, marginHorizontal: 2 }]}> 
              <View style={{ backgroundColor: '#e0e7ff', borderRadius: 50, padding: 4, marginBottom: 2 }}>
                <Text style={{ fontSize: 13, color: '#2563eb' }}>$</Text>
              </View>
              <Text style={{ color: theme.subtitle, fontSize: 10, marginBottom: 2, textAlign: 'center', flexWrap: 'wrap' }} numberOfLines={2} ellipsizeMode="tail">Portfolio Value</Text>
              <Text style={{ color: '#2563eb', fontWeight: 'bold', fontSize: 15, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
                {showValues ? `$${totalValue !== undefined ? totalValue.toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}` : '••••••'}
              </Text>
            </View>
            {/* Total Gain/Loss */}
            <View style={[styles.summaryCard, { width: 110, backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center', paddingVertical: 8, marginBottom: 0, marginHorizontal: 2 }]}> 
              <View style={{ backgroundColor: '#d1fae5', borderRadius: 50, padding: 4, marginBottom: 2 }}>
                {totalGainLoss >= 0 ? (
                  <TrendingUp size={13} color="#10b981" />
                ) : (
                  <TrendingDown size={13} color="#ef4444" />
                )}
              </View>
              <Text style={{ color: theme.subtitle, fontSize: 10, marginBottom: 2, textAlign: 'center', flexWrap: 'wrap' }} numberOfLines={2} ellipsizeMode="tail">Total Gain/Loss</Text>
              <Text style={{ color: totalGainLoss >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: 15, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
                {showValues ? `${totalGainLoss >= 0 ? '+' : ''}$${Math.abs(totalGainLoss) !== undefined ? Math.abs(totalGainLoss).toLocaleString('en-US', { minimumFractionDigits: 2 }) : 'N/A'}` : '••••••'}
              </Text>
            </View>
            {/* Return (Percent) */}
            <View style={[styles.summaryCard, { width: 110, backgroundColor: theme.card, borderColor: theme.border, alignItems: 'center', paddingVertical: 8, marginBottom: 0, marginHorizontal: 2 }]}> 
              <View style={{ backgroundColor: '#d1fae5', borderRadius: 50, padding: 4, marginBottom: 2 }}>
                <Text style={{ fontSize: 13, color: '#10b981' }}>◎</Text>
              </View>
              <Text style={{ color: theme.subtitle, fontSize: 10, marginBottom: 2, textAlign: 'center', flexWrap: 'wrap' }} numberOfLines={2} ellipsizeMode="tail">Return</Text>
              <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 15, textAlign: 'center' }} numberOfLines={1} adjustsFontSizeToFit ellipsizeMode="tail">
                {showValues ? `${Number(totalGainLossPercent) >= 0 ? '' : '-'}${Math.abs(Number(totalGainLossPercent)).toLocaleString('en-US', { minimumFractionDigits: 2 })}%` : '••••••'}
              </Text>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'holdings' && styles.tabActive]}
            onPress={() => setSelectedTab('holdings')}
          >
            <Text style={[styles.tabText, selectedTab === 'holdings' && styles.tabTextActive]}>
              Holdings
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'allocation' && styles.tabActive]}
            onPress={() => setSelectedTab('allocation')}
          >
            <Text style={[styles.tabText, selectedTab === 'allocation' && styles.tabTextActive]}>
              Allocation
            </Text>
          </TouchableOpacity>
        </View>

        {selectedTab === 'holdings' ? (
          <View style={styles.section}>
            {portfolioData.map((item, index) => {
              const gainLoss = (item.value ?? 0) - (item.shares * item.avgPrice);
              const cost = item.shares * item.avgPrice;
              const gainLossPercent = cost > 0 ? ((gainLoss / cost) * 100).toFixed(2) : '0.00';
              const isPositive = gainLoss >= 0;
              const dailyChange = item.currentPrice !== undefined && item.avgPrice !== undefined ? item.currentPrice - item.avgPrice : 0;
              const dailyPercent = item.currentPrice !== undefined && item.avgPrice !== undefined && item.avgPrice !== 0 ? (((item.currentPrice - item.avgPrice) / item.avgPrice) * 100).toFixed(2) : '0.00';
              return (
                <View key={index} style={[styles.card, { backgroundColor: theme.card, borderColor: theme.border }]}> 
                  <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <Star size={20} color="#f59e0b" fill="#f59e0b" />
                      <Text style={[styles.holdingSymbol, { color: theme.text, fontSize: 18, fontWeight: 'bold' }]}>{item.symbol}</Text>
                      {/* Alarm icon placeholder */}
                      <BellOff size={18} color={theme.subtitle} style={{ marginLeft: 4 }} />
                    </View>
                    <TouchableOpacity onPress={() => removeFromPortfolio(user.uid, item.id)}>
                      <X size={20} color={theme.subtitle} />
                    </TouchableOpacity>
                  </View>
                  <Text style={[styles.holdingName, { color: theme.subtitle, marginTop: 2 }]}>{item.companyName || item.name}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'flex-end', marginTop: 8, gap: 12 }}>
                    <Text style={{ fontSize: 24, fontWeight: 'bold', color: theme.text }}>
                      {item.currentPrice !== undefined ? `$${item.currentPrice.toFixed(2)}` : 'N/A'}
                    </Text>
                    <View style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                        {item.currentPrice !== undefined && item.avgPrice !== undefined ? (
                          isPositive ? <TrendingUp size={16} color="#10b981" /> : <TrendingDown size={16} color="#ef4444" />
                        ) : null}
                        <Text style={{ color: isPositive ? '#10b981' : '#ef4444', fontWeight: 'bold', marginLeft: 4 }}>
                          {item.currentPrice !== undefined && item.avgPrice !== undefined ? `${isPositive ? '+' : ''}${dailyPercent}%` : '+0.00%'}
                        </Text>
                      </View>
                      <Text style={{ color: isPositive ? '#10b981' : '#ef4444', fontSize: 13, marginLeft: 20 }}>
                        {item.currentPrice !== undefined && item.avgPrice !== undefined ? `${isPositive ? '+' : ''}${dailyChange.toFixed(2)}` : 'N/A'}
                      </Text>
                    </View>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 8, gap: 16 }}>
                    <Text style={{ color: theme.subtitle, fontSize: 13 }}>{item.shares} shares</Text>
                    <Text style={{ color: theme.subtitle, fontSize: 13 }}>Avg: {item.avgPrice !== undefined ? `$${item.avgPrice.toFixed(2)}` : 'N/A'}</Text>
                    <Text style={{ color: theme.subtitle, fontSize: 13 }}>Value: {item.value !== undefined ? `$${item.value.toLocaleString('en-US', { minimumFractionDigits: 2 })}` : 'N/A'}</Text>
                  </View>
                  <Text style={{ color: isPositive ? '#10b981' : '#ef4444', fontSize: 13, marginTop: 2 }}>
                    Gain/Loss: {item.value !== undefined ? `${isPositive ? '+' : ''}$${Math.abs(gainLoss).toFixed(2)} (${isPositive ? '+' : ''}${gainLossPercent}%)` : '+0.00%'}
                  </Text>
                </View>
              );
            })}
          </View>
        ) : (
          /* Allocation Chart */
          <View style={styles.section}>
            <PieChart
              data={pieData}
              width={screenWidth - 40}
              height={220}
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
              }}
              accessor="population"
              backgroundColor="transparent"
              paddingLeft="15"
              center={[10, 10]}
              absolute
            />
            
            <View style={styles.allocationList}>
              {pieData.map((item, index) => (
                <TouchableOpacity 
                  key={index} 
                  style={styles.allocationItem}
                  onPress={() => handleStockPress(item.name)}
                >
                  <View style={[styles.colorDot, { backgroundColor: item.color }]} />
                  <Text style={[styles.allocationSymbol, { color: theme.text }]}>{item.name}</Text>
                  <Text style={[styles.allocationPercent, { color: theme.subtitle }]}>{Number(item.population).toFixed(2)}%</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Add Investment Button */}
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddModal(true)}
        >
          <Plus size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Investment</Text>
        </TouchableOpacity>

        {/* Add Investment Modal */}
        <Modal
          visible={showAddModal}
          transparent
          animationType="slide"
          onRequestClose={handleModalClose}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Add Investment</Text>
                <TouchableOpacity onPress={handleModalClose}>
                  <X size={24} color={theme.subtitle} />
                </TouchableOpacity>
              </View>
              {error && (
                <View style={{ backgroundColor: '#fee2e2', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <Text style={{ color: '#b91c1c', textAlign: 'center' }}>{error}</Text>
                </View>
              )}
              {success && (
                <View style={{ backgroundColor: '#dcfce7', borderRadius: 8, padding: 10, marginBottom: 10 }}>
                  <Text style={{ color: '#166534', textAlign: 'center' }}>{success}</Text>
                </View>
              )}
              <Text style={{ color: theme.subtitle, textAlign: 'center', marginBottom: 12 }}>
                Search and select a stock to add to your portfolio
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Search stocks (e.g., AAPL, MSFT)"
                placeholderTextColor={theme.subtitle}
                value={searchQuery}
                onChangeText={setSearchQuery}
                autoCapitalize="characters"
                editable={!isSearching}
              />
              {isSearching && !success && (
                <ActivityIndicator size="small" color={theme.primary} style={{ marginVertical: 8 }} />
              )}
              {searchResults.length > 0 && !selectedStock && (
                <View style={{
                  maxHeight: 300,
                  minHeight: 120,
                  marginBottom: 12,
                  borderWidth: 1,
                  borderColor: theme.border,
                  borderRadius: 12,
                  backgroundColor: theme.background,
                  overflow: 'hidden',
                }}>
                  <ScrollView>
                    {searchResults.map((stock, idx) => (
                      <TouchableOpacity
                        key={idx}
                        style={{
                          paddingVertical: 14,
                          paddingHorizontal: 16,
                          borderBottomWidth: idx === searchResults.length - 1 ? 0 : 1,
                          borderColor: theme.border,
                          backgroundColor: '#f9fafb',
                        }}
                        activeOpacity={0.7}
                        onPress={() => handleStockSelect(stock)}
                      >
                        <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{stock.symbol}</Text>
                        <Text style={{ color: theme.subtitle, fontSize: 13 }}>{stock.description}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
              {selectedStock && (
                <View style={{ padding: 10, backgroundColor: theme.background, borderRadius: 8, marginBottom: 12, alignItems: 'center' }}>
                  {/* Stock logo if available from Finnhub profile, else fallback icon */}
                  {selectedStock.logo ? (
                    <Image source={{ uri: selectedStock.logo }} style={{ width: 40, height: 40, borderRadius: 20, marginBottom: 6 }} />
                  ) : (
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: '#e5e7eb', marginBottom: 6, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: '#6b7280', fontWeight: 'bold', fontSize: 18 }}>{selectedStock.symbol[0]}</Text>
                    </View>
                  )}
                  <Text style={{ color: theme.text, fontWeight: 'bold', fontSize: 16 }}>{selectedStock.symbol}</Text>
                  <Text style={{ color: theme.subtitle, fontSize: 12 }}>{selectedStock.description}</Text>
                  {currentPrice && (
                    <Text style={{ color: theme.subtitle, marginTop: 4 }}>Current Price: ${currentPrice.toFixed(2)}</Text>
                  )}
                </View>
              )}
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <TouchableOpacity
                  style={{ padding: 8, backgroundColor: '#f3f4f6', borderRadius: 8, marginRight: 8 }}
                  onPress={() => setNewStockShares((prev) => (Math.max(0, parseFloat(prev || '0') - 1)).toString())}
                  disabled={isSearching || !selectedStock}
                >
                  <Text style={{ fontSize: 18, color: '#374151' }}>-</Text>
                </TouchableOpacity>
                <TextInput
                  style={[styles.input, { flex: 1, backgroundColor: theme.background, color: theme.text }]}
                  placeholder="Number of Shares (e.g., 10)"
                  placeholderTextColor={theme.subtitle}
                  value={newStockShares}
                  onChangeText={setNewStockShares}
                  keyboardType="numeric"
                  editable={!isSearching && !!selectedStock}
                />
                <TouchableOpacity
                  style={{ padding: 8, backgroundColor: '#f3f4f6', borderRadius: 8, marginLeft: 8 }}
                  onPress={() => setNewStockShares((prev) => (Math.max(0, parseFloat(prev || '0') + 1)).toString())}
                  disabled={isSearching || !selectedStock}
                >
                  <Text style={{ fontSize: 18, color: '#374151' }}>+</Text>
                </TouchableOpacity>
              </View>
              <TextInput
                style={[styles.input, { backgroundColor: theme.background, color: theme.text }]}
                placeholder="Purchase Price per Share (e.g., 189.50)"
                placeholderTextColor={theme.subtitle}
                value={newStockPrice}
                onChangeText={setNewStockPrice}
                keyboardType="numeric"
                editable={!isSearching && !!selectedStock}
              />
              <View style={{ padding: 10, backgroundColor: theme.background, borderRadius: 8, marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{ color: theme.subtitle }}>Total Position Value:</Text>
                  <Text style={{ color: theme.text, fontWeight: 'bold' }}>
                    ${
                      (parseFloat(newStockShares || '0') * parseFloat(newStockPrice || '0')).toFixed(2)
                    }
                  </Text>
                </View>
              </View>
              <TouchableOpacity 
                style={[styles.modalButton, { opacity: (!selectedStock || !newStockShares || !newStockPrice || isNaN(Number(newStockShares)) || isNaN(Number(newStockPrice)) || Number(newStockShares) <= 0 || Number(newStockPrice) <= 0 || isSearching) ? 0.5 : 1 }]}
                onPress={handleAddInvestment}
                disabled={!selectedStock || !newStockShares || !newStockPrice || isNaN(Number(newStockShares)) || isNaN(Number(newStockPrice)) || Number(newStockShares) <= 0 || Number(newStockPrice) <= 0 || isSearching}
              >
                {isSearching && !success ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.modalButtonText}>Add to Portfolio</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
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
  visibilityButton: {
    padding: 8,
  },
  summaryContainer: {
    margin: 20,
    marginTop: 10,
  },
  summaryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  summaryLabel: {
    fontSize: 16,
    color: '#666666',
    marginBottom: 8,
  },
  summaryValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  gainLossContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  gainLossText: {
    fontSize: 16,
    fontWeight: '500',
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 20,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 4,
    borderWidth: 1,
    borderColor: '#e5e5e5',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: '#3b82f6',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
  },
  tabTextActive: {
    color: '#ffffff',
  },
  section: {
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  holdingSymbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  holdingName: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 4,
  },
  allocationList: {
    marginTop: 20,
  },
  allocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  allocationSymbol: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    fontWeight: '500',
  },
  allocationPercent: {
    fontSize: 16,
    color: '#666666',
    fontWeight: '500',
  },
  addButton: {
    backgroundColor: '#3b82f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: 16,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  input: {
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 16,
    marginBottom: 16,
    fontSize: 16,
  },
  modalButton: {
    backgroundColor: '#3b82f6',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});