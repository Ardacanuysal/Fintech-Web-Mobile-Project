import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Search, TrendingUp, TrendingDown, Star } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getSectorPerformance, getStockQuote, getCandles } from '../../services/finnhub';
import { LineChart } from 'react-native-chart-kit';
import { useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';

const categories = ['All', 'Tech', 'Finance', 'Healthcare', 'Energy', 'Consumer'];

const sectorMap: Record<string, string> = {
  Tech: 'Technology',
  Finance: 'Financials',
  Healthcare: 'Healthcare',
  Energy: 'Energy',
  Consumer: 'Consumer Discretionary',
  Industrials: 'Industrials',
  Utilities: 'Utilities',
  Materials: 'Materials',
};

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

export default function Markets() {
  const { theme } = useTheme();
  const [sectorData, setSectorData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSector, setSelectedSector] = useState<string | null>(null);
  const [chartData, setChartData] = useState<any>(null);
  const [chartLoading, setChartLoading] = useState(false);
  const window = useWindowDimensions();
  const router = useRouter();

  useEffect(() => {
    const fetchSectorData = async () => {
      setLoading(true);
      try {
        const promises = SECTORS.map(sector =>
          getStockQuote(sector.symbol)
            .then(data => ({ ...sector, quote: data }))
        );
        const results = await Promise.all(promises);
        setSectorData(results);
        if (!selectedSector && results.length > 0) {
          setSelectedSector(results[0].symbol);
        }
      } catch (error) {
        setSectorData([]);
      } finally {
        setLoading(false);
      }
    };
    fetchSectorData();
    const interval = setInterval(fetchSectorData, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (selectedSector) {
      fetchChartData(selectedSector);
    }
  }, [selectedSector]);

  const fetchChartData = async (symbol: string) => {
    setChartLoading(true);
    try {
      // 3 months ago to now, daily candles
      const now = Math.floor(Date.now() / 1000);
      const threeMonthsAgo = now - 60 * 60 * 24 * 90;
      const candles = await getCandles(symbol, 'D', threeMonthsAgo, now);
      setChartData(candles);
    } catch (e) {
      setChartData(null);
    } finally {
      setChartLoading(false);
    }
  };

  const selectedSectorData = sectorData.find(s => s.symbol === selectedSector);

  const handleStockPress = (symbol: string) => {
    router.push({
      pathname: "/stock/[symbol]",
      params: { symbol }
    } as any);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.background }]}>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Markets</Text>
        <Text style={[styles.headerSubtitle, { color: theme.subtitle }]}>Explore market sectors and global indices</Text>
      </View>

      {/* Sector Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesContainer} contentContainerStyle={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        {sectorData.map(sector => (
          <TouchableOpacity
            key={sector.symbol}
            onPress={() => {
              setSelectedSector(sector.symbol);
              handleStockPress(sector.symbol);
            }}
            style={[
              styles.categoryButton,
              selectedSector === sector.symbol && styles.categoryButtonActive,
            ]}
            activeOpacity={0.85}
          >
            <Text
              style={[
                styles.categoryText,
                selectedSector === sector.symbol && styles.categoryTextActive,
              ]}
            >
              {sector.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Sector Card */}
      {selectedSectorData && (
        <View style={[styles.sectorCard, { backgroundColor: theme.card, borderColor: theme.border }]}> 
          <View style={{ marginBottom: 12 }}>
            <Text style={[styles.sectorTitle, { color: theme.text }]} numberOfLines={1} ellipsizeMode="tail">{selectedSectorData.name}</Text>
            <Text style={[styles.sectorSubtitle, { color: theme.subtitle }]}>{selectedSectorData.description}</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 2 }}>
              {selectedSectorData.quote.dp >= 0 ? (
                <Text style={{ color: '#10b981', fontSize: 16, fontWeight: 'bold', marginRight: 3 }}>▲</Text>
              ) : (
                <Text style={{ color: '#ef4444', fontSize: 16, fontWeight: 'bold', marginRight: 3 }}>▼</Text>
              )}
              <Text style={{ color: selectedSectorData.quote.dp >= 0 ? '#10b981' : '#ef4444', fontWeight: 'bold', fontSize: 16, marginRight: 8 }}>
                {Math.abs(selectedSectorData.quote.dp).toFixed(2)}%
              </Text>
              <Text style={[styles.sectorPrice, { color: theme.text }]} numberOfLines={1}>${selectedSectorData.quote.c.toFixed(2)}</Text>
        </View>
      </View>
          <View>
            {chartLoading ? (
              <ActivityIndicator size="large" color={theme.primary} style={{ marginVertical: 32 }} />
            ) : chartData && chartData.c && chartData.t ? (
              <LineChart
                data={{
                  labels: chartData.t.map((ts: number, i: number) => i % 20 === 0 ? new Date(ts * 1000).toLocaleDateString() : ''),
                  datasets: [
                    {
                      data: chartData.c,
                      color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                      strokeWidth: 3,
                    },
                  ],
                }}
                width={window.width - 40}
                height={180}
                chartConfig={{
                  backgroundColor: theme.card,
                  backgroundGradientFrom: theme.card,
                  backgroundGradientTo: theme.card,
                  decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(59, 130, 246, ${opacity})`,
                  labelColor: (opacity = 1) => theme.subtitle,
                  style: {
                    borderRadius: 16,
                  },
                  propsForLabels: {
                    fontSize: 10,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
                  },
                }}
                bezier
                style={{ marginVertical: 8, borderRadius: 16, backgroundColor: theme.card }}
              />
            ) : (
              <Text style={{ color: theme.subtitle, textAlign: 'center', marginVertical: 32 }}>No chart data available.</Text>
            )}
          </View>
          <View style={styles.sectorStatsRowLight}>
            <View style={styles.sectorStatBoxLight}>
              <Text style={styles.sectorStatLabelLight}>Open</Text>
              <Text style={styles.sectorStatValueLight}>${selectedSectorData.quote.o.toFixed(2)}</Text>
              </View>
            <View style={styles.sectorStatBoxLight}>
              <Text style={styles.sectorStatLabelLight}>High</Text>
              <Text style={styles.sectorStatValueLight}>${selectedSectorData.quote.h.toFixed(2)}</Text>
            </View>
            <View style={styles.sectorStatBoxLight}>
              <Text style={styles.sectorStatLabelLight}>Low</Text>
              <Text style={styles.sectorStatValueLight}>${selectedSectorData.quote.l.toFixed(2)}</Text>
              </View>
            <View style={styles.sectorStatBoxLight}>
              <Text style={styles.sectorStatLabelLight}>Prev Close</Text>
              <Text style={styles.sectorStatValueLight}>${selectedSectorData.quote.pc.toFixed(2)}</Text>
            </View>
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
  categoriesContainer: {
    marginVertical: 8,
    flexGrow: 0,
  },
  categoryButton: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    elevation: 1,
  },
  categoryButtonActive: {
    backgroundColor: '#3b82f6',
    borderColor: '#3b82f6',
    elevation: 3,
  },
  categoryText: {
    fontSize: 15,
    color: '#374151',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  sectorCard: {
    marginHorizontal: 20,
    marginBottom: 20,
    marginTop: 0,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  sectorTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  sectorSubtitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  sectorPrice: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  sectorStatsRowLight: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 8,
  },
  sectorStatBoxLight: {
    flexGrow: 1,
    flexBasis: '45%',
    minWidth: 100,
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 10,
    alignItems: 'stretch',
    marginHorizontal: 2,
    marginBottom: 8,
  },
  sectorStatLabelLight: {
    fontSize: 12,
    color: '#495057',
    marginBottom: 4,
    fontWeight: '500',
    letterSpacing: 0.05,
    textAlign: 'left',
  },
  sectorStatValueLight: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#212529',
    letterSpacing: 0.05,
    textAlign: 'left',
  },
});