import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions, TouchableOpacity, ActivityIndicator, Image, Linking, Modal, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { TrendingUp, TrendingDown, Search, Bell, ExternalLink } from 'lucide-react-native';
import { useTheme } from '../context/ThemeContext';
import { getMarketOverview, getTopGainersLosers, getMarketNews, MarketData, NewsItem } from '../../services/finnhub';
import { useWindowDimensions } from 'react-native';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useRouter } from 'expo-router';

const screenWidth = Dimensions.get('window').width;

const news = [
  {
    title: "Circle's buzzy IPO was a big hit. Now comes the hard part.",
    time: '2 hours ago',
  },
  {
    title: 'Fed signals potential rate cuts amid inflation concerns',
    time: '4 hours ago',
  },
  {
    title: 'Tech earnings season kicks off with strong expectations',
    time: '6 hours ago',
  },
];

const chartData = {
  labels: ['May 10', '', 'May 20', '', 'May 30', 'Jun 04'],
  datasets: [
    {
      data: [150, 149.5, 149, 145, 142, 141.5],
      color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
      strokeWidth: 3,
    },
  ],
};

export default function Dashboard() {
  const { theme } = useTheme();
  const router = useRouter();
  const [selectedTimeframe, setSelectedTimeframe] = useState('1M');
  const [marketData, setMarketData] = useState<MarketData[]>([]);
  const [topGainers, setTopGainers] = useState<MarketData[]>([]);
  const [topLosers, setTopLosers] = useState<MarketData[]>([]);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const timeframes = ['1D', '1W', '1M', '3M', '1Y'];
  const [chartModalVisible, setChartModalVisible] = useState(false);
  const window = useWindowDimensions();

  useEffect(() => {
    fetchMarketData();
    // Refresh data every 5 minutes
    const interval = setInterval(fetchMarketData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Handle orientation change for chart modal
  useEffect(() => {
    const setLandscape = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
    };
    const setPortrait = async () => {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
    };
    if (chartModalVisible) {
      setLandscape();
    } else {
      setPortrait();
    }
    // Clean up: always set portrait on unmount
    return () => {
      setPortrait();
    };
  }, [chartModalVisible]);

  const fetchMarketData = async () => {
    try {
      setLoading(true);
      console.log('Fetching market data...');
      const [marketOverview, gainersLosers, marketNews] = await Promise.all([
        getMarketOverview(),
        getTopGainersLosers(),
        getMarketNews()
      ]);
      console.log('Market news received:', marketNews);
      setMarketData(marketOverview);
      setTopGainers(gainersLosers.gainers);
      setTopLosers(gainersLosers.losers);
      setNews(marketNews);
    } catch (error) {
      console.error('Error fetching market data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStockPress = (symbol: string) => {
    router.push({
      pathname: "/stock/[symbol]",
      params: { symbol }
    } as any);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading market data...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const cardHorizontalPadding = 20; // matches styles.section paddingHorizontal
  const chartCardBorderWidth = 1; // matches styles.section borderWidth if any
  const chartCardInnerPadding = 20; // extra padding if needed
  const chartWidth = screenWidth - cardHorizontalPadding * 2 - chartCardBorderWidth * 2 - chartCardInnerPadding;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.background }]}>
          <View>
            <Text style={[styles.headerTitle, { color: theme.text }]}>UNIX</Text>
            <Text style={[styles.headerSubtitle, { color: theme.text }]}>{'Market Dashboard'}</Text>
            <Text style={[styles.headerDescription, { color: theme.subtitle }]}>Track your investments and market performance</Text>
          </View>
          <View style={styles.headerIcons}>
            <TouchableOpacity style={styles.iconButton}>
              <Search size={24} color={theme.subtitle} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconButton}>
              <Bell size={24} color={theme.subtitle} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Market Performance Chart */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border, borderRadius: 16, overflow: 'hidden', paddingBottom: 20 }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Market Performance</Text>
          <Pressable onPress={() => setChartModalVisible(true)}>
            <View style={{ borderRadius: 16, overflow: 'hidden', backgroundColor: theme.card }}>
          <LineChart
            data={chartData}
                width={chartWidth}
            height={220}
            chartConfig={{
              backgroundColor: theme.card,
              backgroundGradientFrom: theme.card,
              backgroundGradientTo: theme.card,
              decimalPlaces: 2,
                  color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                  labelColor: (opacity = 1) => theme.subtitle,
              style: {
                borderRadius: 16,
              },
                  propsForLabels: {
                    fontSize: 10,
                    rotation: 30,
                    dx: 10,
                  },
                  propsForBackgroundLines: {
                    strokeDasharray: '',
              },
            }}
            bezier
                style={{
                  marginVertical: 8,
                  borderRadius: 16,
                  backgroundColor: theme.card,
                }}
          />
            </View>
          </Pressable>
          <View style={styles.timeframeContainer}>
            {timeframes.map((tf) => (
              <TouchableOpacity
                key={tf}
                style={[styles.timeframeButton, selectedTimeframe === tf && styles.timeframeButtonActive]}
                onPress={() => setSelectedTimeframe(tf)}
              >
                <Text style={[styles.timeframeText, selectedTimeframe === tf && { color: '#fff' }]}>{tf}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Chart Fullscreen Modal */}
        <Modal
          visible={chartModalVisible}
          animationType="slide"
          onRequestClose={() => setChartModalVisible(false)}
          supportedOrientations={["landscape", "portrait"]}
          transparent={false}
        >
          <View style={{ flex: 1, backgroundColor: theme.background, justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
            <TouchableOpacity
              style={{ position: 'absolute', top: 40, right: 40, zIndex: 10, backgroundColor: '#fff', borderRadius: 20, padding: 8, elevation: 4 }}
              onPress={() => setChartModalVisible(false)}
            >
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#333' }}>✕</Text>
            </TouchableOpacity>
            <LineChart
              data={chartData}
              width={window.width - 40}
              height={window.height - 160}
              chartConfig={{
                backgroundColor: theme.card,
                backgroundGradientFrom: theme.card,
                backgroundGradientTo: theme.card,
                decimalPlaces: 2,
                color: (opacity = 1) => `rgba(239, 68, 68, ${opacity})`,
                labelColor: (opacity = 1) => theme.subtitle,
                style: {
                  borderRadius: 24,
                },
                propsForLabels: {
                  fontSize: 14,
                  rotation: 0,
                  dx: 0,
                },
                propsForBackgroundLines: {
                  strokeDasharray: '',
                },
              }}
              bezier
              style={{
                borderRadius: 24,
                backgroundColor: theme.card,
              }}
            />
            <View style={[styles.timeframeContainer, { marginTop: 16, marginBottom: 0, justifyContent: 'center' }]}> 
              {timeframes.map((tf) => (
                <TouchableOpacity
                  key={tf}
                  style={[styles.timeframeButton, selectedTimeframe === tf && styles.timeframeButtonActive]}
                  onPress={() => setSelectedTimeframe(tf)}
                >
                  <Text style={[styles.timeframeText, selectedTimeframe === tf && { color: '#fff' }]}>{tf}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </Modal>

        {/* Market Overview */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text },{marginTop: 20}]}>Market Overview</Text>
          <View style={styles.marketGrid}>
            {marketData.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.marketItem, { backgroundColor: theme.card, borderColor: theme.border }]}
                onPress={() => handleStockPress(item.symbol)}
              >
                <Text style={[styles.marketName, { color: theme.text }]}>{item.name}</Text>
                <Text style={[styles.marketSymbol, { color: theme.subtitle }]}>{item.symbol}</Text>
                <Text style={[styles.marketChange, { color: item.positive ? '#10b981' : '#ef4444' }]}>
                  {item.change}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Top Gainers and Losers */}
        <View style={[styles.gainersLosersContainer, { backgroundColor: theme.background }]}>
          <View style={[styles.gainersLosersSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <TrendingUp size={20} color="#10b981" />
              <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Top Gainers</Text>
            </View>
            {topGainers.map((stock, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stockItem}
                onPress={() => handleStockPress(stock.symbol)}
              >
                <Text style={[styles.stockSymbol, { color: theme.text }]}>{stock.symbol}</Text>
                <View style={styles.stockRight}>
                  <Text style={[styles.stockPrice, { color: theme.text }]}>${stock.price.toFixed(2)}</Text>
                  <Text style={styles.gainText}>{stock.change}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={[styles.gainersLosersSection, { backgroundColor: theme.card, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <TrendingDown size={20} color="#ef4444" />
              <Text style={[styles.sectionTitle, { color: theme.text, marginLeft: 8 }]}>Top Losers</Text>
            </View>
            {topLosers.map((stock, index) => (
              <TouchableOpacity
                key={index}
                style={styles.stockItem}
                onPress={() => handleStockPress(stock.symbol)}
              >
                <Text style={[styles.stockSymbol, { color: theme.text }]}>{stock.symbol}</Text>
                <View style={styles.stockRight}>
                  <Text style={[styles.stockPrice, { color: theme.text }]}>${stock.price.toFixed(2)}</Text>
                  <Text style={styles.lossText}>{stock.change}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Market News */}
        <View style={[styles.section, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Text style={[styles.sectionTitle, { color: theme.text },{marginTop: 20}]}>Market News</Text>
          {news && news.length > 0 ? (
            news.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={[styles.newsCard, { backgroundColor: theme.card, borderColor: theme.border }]}
                activeOpacity={0.8}
                onPress={() => Linking.openURL(item.url)}
              >
                <View style={styles.newsRow}>
                  <Image
                    source={{ uri: item.image }}
                    style={styles.newsImage}
                    resizeMode="cover"
                  />
                  <View style={styles.newsContent}>
                    <Text style={[styles.newsHeadline, { color: theme.text }]} numberOfLines={2}>{item.headline}</Text>
                    <Text style={[styles.newsSummary, { color: theme.subtitle }]} numberOfLines={2}>{item.summary}</Text>
                    <View style={styles.newsMetaRow}>
                      <Text style={[styles.newsSource, { color: theme.subtitle }]}>{item.source}</Text>
                      <Text style={[styles.newsTime, { color: theme.subtitle }]}>• {new Date(item.datetime * 1000).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</Text>
                      <ExternalLink size={16} color={theme.subtitle} style={{ marginLeft: 4 }} />
                    </View>
                  </View>
                </View>
            </TouchableOpacity>
            ))
          ) : (
            <View style={styles.emptyNewsContainer}>
              <Text style={[styles.emptyNewsText, { color: theme.subtitle }]}>No news available at the moment</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
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
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 4,
  },
  headerDescription: {
    fontSize: 14,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 16,
  },
  iconButton: {
    padding: 8,
  },
  chartContainer: {
    margin: 20,
    marginTop: 10,
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  timeframeContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    gap: 8,
  },
  timeframeButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  timeframeButtonActive: {
    backgroundColor: '#3b82f6',
  },
  timeframeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  marketGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  marketItem: {
    borderRadius: 12,
    padding: 16,
    width: (screenWidth - 64) / 2,
    borderWidth: 1,
  },
  marketName: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  marketSymbol: {
    fontSize: 12,
    marginBottom: 8,
  },
  marketChange: {
    fontSize: 16,
    fontWeight: '600',
  },
  gainersLosersContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  gainersLosersSection: {
    flex: 1,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginTop: 20,
  },
  stockItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  stockSymbol: {
    fontSize: 14,
    fontWeight: '600',
  },
  stockRight: {
    alignItems: 'flex-end',
  },
  stockPrice: {
    fontSize: 12,
    marginBottom: 2,
  },
  gainText: {
    fontSize: 12,
    color: '#10b981',
    fontWeight: '500',
  },
  lossText: {
    fontSize: 12,
    color: '#ef4444',
    fontWeight: '500',
  },
  newsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    alignItems: 'flex-start',
  },
  newsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  newsImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#eee',
  },
  newsContent: {
    flex: 1,
    flexDirection: 'column',
  },
  newsHeadline: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  newsSummary: {
    fontSize: 13,
    marginBottom: 8,
    lineHeight: 18,
  },
  newsMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  newsSource: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  newsTime: {
    fontSize: 12,
    marginLeft: 4,
  },
  emptyNewsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyNewsText: {
    fontSize: 14,
    textAlign: 'center',
  },
});
