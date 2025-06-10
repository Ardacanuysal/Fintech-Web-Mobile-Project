import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LineChart } from 'react-native-chart-kit';
import { getStockQuote, getCompanyProfile } from '../../services/finnhub';
import { formatCurrency, formatLargeNumber } from '../../utils/formatters';

const StockDetailScreen = () => {
  const { symbol } = useLocalSearchParams();
  const router = useRouter();
  const [quote, setQuote] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M' | '3M' | '1Y'>('1M');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!symbol) return;

    const fetchStockData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const [quoteData, companyData] = await Promise.all([
          getStockQuote(symbol as string),
          getCompanyProfile(symbol as string)
        ]);
        
        setQuote(quoteData);
        setCompany(companyData);
      } catch (err) {
        console.error('Error fetching stock data:', err);
        setError('Failed to load stock data');
      } finally {
        setLoading(false);
      }
    };

    fetchStockData();
  }, [symbol]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0066cc" />
      </View>
    );
  }

  if (error || !quote || !company) {
    return (
      <View style={styles.errorContainer}>
        <MaterialCommunityIcons name="chart-line" size={64} color="#666" />
        <Text style={styles.errorTitle}>Stock Data Not Available</Text>
        <Text style={styles.errorText}>
          {error || "We couldn't load the stock data for this symbol."}
        </Text>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isPositive = quote.dp >= 0;
  const screenWidth = Dimensions.get('window').width;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.symbol}>{symbol}</Text>
          {company.name && (
            <Text style={styles.companyName}>{company.name}</Text>
          )}
          {company.exchange && (
            <Text style={styles.exchange}>
              {company.exchange} • {company.finnhubIndustry}
            </Text>
          )}
        </View>
      </View>

      <View style={styles.priceCard}>
        <View style={styles.priceHeader}>
          <View>
            <Text style={styles.currentPrice}>{formatCurrency(quote.c)}</Text>
            <View style={styles.priceChange}>
              <MaterialCommunityIcons 
                name={isPositive ? "arrow-up" : "arrow-down"} 
                size={16} 
                color={isPositive ? "#22c55e" : "#ef4444"} 
              />
              <Text style={[styles.priceChangeText, isPositive ? styles.positive : styles.negative]}>
                {formatCurrency(quote.d)} ({quote.dp.toFixed(2)}%)
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.timeframeButtons}>
          {(['1D', '1W', '1M', '3M', '1Y'] as const).map(period => (
            <TouchableOpacity
              key={period}
              style={[
                styles.timeframeButton,
                timeframe === period && styles.timeframeButtonActive
              ]}
              onPress={() => setTimeframe(period)}
            >
              <Text style={[
                styles.timeframeButtonText,
                timeframe === period && styles.timeframeButtonTextActive
              ]}>
                {period}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.chartContainer}>
          <LineChart
            data={{
              labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
              datasets: [{
                data: [20, 45, 28, 80, 99, 43]
              }]
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 2,
              color: (opacity = 1) => `rgba(0, 102, 204, ${opacity})`,
              style: {
                borderRadius: 16
              }
            }}
            style={styles.chart}
            bezier
          />
        </View>
      </View>

      <View style={styles.statsCard}>
        <Text style={styles.cardTitle}>Key Statistics</Text>
        <View style={styles.statsGrid}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Open</Text>
            <Text style={styles.statValue}>{formatCurrency(quote.o)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>High</Text>
            <Text style={styles.statValue}>{formatCurrency(quote.h)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Low</Text>
            <Text style={styles.statValue}>{formatCurrency(quote.l)}</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Prev Close</Text>
            <Text style={styles.statValue}>{formatCurrency(quote.pc)}</Text>
          </View>
        </View>
      </View>

      <View style={styles.companyCard}>
        <Text style={styles.cardTitle}>About {company.name}</Text>
        <View style={styles.companyInfo}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Market Cap</Text>
            <Text style={styles.infoValue}>
              {formatLargeNumber(company.marketCapitalization * 1000000)}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Employees</Text>
            <Text style={styles.infoValue}>
              {company.employeeTotal ? formatLargeNumber(company.employeeTotal) : 'N/A'}
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Country</Text>
            <Text style={styles.infoValue}>{company.country || 'N/A'}</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>IPO Date</Text>
            <Text style={styles.infoValue}>{company.ipo || 'N/A'}</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: '#0066cc',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e5e5',
  },
  symbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  companyName: {
    fontSize: 16,
    color: '#666',
    marginTop: 4,
  },
  exchange: {
    fontSize: 14,
    color: '#888',
    marginTop: 2,
  },
  priceCard: {
    backgroundColor: '#fff',
    margin: 16,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  priceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  currentPrice: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
  },
  priceChange: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  positive: {
    color: '#22c55e',
  },
  negative: {
    color: '#ef4444',
  },
  priceChangeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 4,
  },
  timeframeButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  timeframeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
  },
  timeframeButtonActive: {
    backgroundColor: '#0066cc',
  },
  timeframeButtonText: {
    fontSize: 14,
    color: '#666',
  },
  timeframeButtonTextActive: {
    color: '#fff',
  },
  chartContainer: {
    alignItems: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  statsCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  statItem: {
    width: '50%',
    padding: 8,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  companyCard: {
    backgroundColor: '#fff',
    margin: 16,
    marginTop: 0,
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  companyInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -8,
  },
  infoItem: {
    width: '50%',
    padding: 8,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
});

export default StockDetailScreen; 