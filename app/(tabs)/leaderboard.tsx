import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Image,
  RefreshControl,
} from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, SHADOWS, BORDER_RADIUS } from '@/constants/theme';
import { useTheme } from '@/context/theme';
import { Trophy, Calendar, TrendingUp, MapPin, Ticket, User } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { attendanceApi } from '@/utils/api';
import { useAuth } from '@/context/auth';
import SyncStatus from '@/components/ui/SyncStatus';
import { getTimeElapsedString } from '@/utils/time';
import ErrorBoundary from '@/components/ui/ErrorBoundary';

const OPERATORS = [
  { id: 1, name: 'Akash', image: 'https://ui-avatars.com/api/?name=Akash&background=2ECC71&color=fff' },
  { id: 2, name: 'Arvind', image: 'https://ui-avatars.com/api/?name=Arvind&background=2ECC71&color=fff' },
  { id: 3, name: 'Dinesh', image: 'https://ui-avatars.com/api/?name=Dinesh&background=2ECC71&color=fff' },
  { id: 4, name: 'Pavan', image: 'https://ui-avatars.com/api/?name=Pavan&background=2ECC71&color=fff' },
  { id: 5, name: 'Ranjit', image: 'https://ui-avatars.com/api/?name=Ranjit&background=2ECC71&color=fff' },
  { id: 6, name: 'Samuel', image: 'https://ui-avatars.com/api/?name=Samuel&background=2ECC71&color=fff' },
  { id: 7, name: 'Subhash', image: 'https://ui-avatars.com/api/?name=Subhash&background=2ECC71&color=fff' },
  { id: 8, name: 'Suman', image: 'https://ui-avatars.com/api/?name=Suman&background=2ECC71&color=fff' },
  { id: 9, name: 'Tarun', image: 'https://ui-avatars.com/api/?name=Tarun&background=2ECC71&color=fff' },
  { id: 10, name: 'Kiran', image: 'https://ui-avatars.com/api/?name=Kiran&background=2ECC71&color=fff' },
];

interface SalesData {
  id: number;
  name: string;
  station: string;
  gate: string;
  sales: number;
  rank: number;
  shift: string;
  image: string;
}

export default function LeaderboardScreen() {
  const { theme } = useTheme();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly'>('daily');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [syncState, setSyncState] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [salesData, setSalesData] = useState<{
    daily: SalesData[];
    weekly: SalesData[];
    monthly: SalesData[];
  }>({
    daily: [],
    weekly: [],
    monthly: [],
  });

  useEffect(() => {
    fetchSalesData();
  }, []);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      setSyncState('syncing');
      
      // Fetch stations and gates data
      const [stationsResponse, gatesResponse] = await Promise.all([
        attendanceApi.getStations(),
        attendanceApi.getGates()
      ]);

      // Generate sales data based on stations, gates, and operators
      const generateSalesData = (period: 'daily' | 'weekly' | 'monthly') => {
        const multiplier = period === 'daily' ? 1 : period === 'weekly' ? 7 : 30;
        return OPERATORS.map(operator => {
          const station = stationsResponse.stations[Math.floor(Math.random() * stationsResponse.stations.length)];
          const gate = gatesResponse.gates.find(g => g.station_id === station.id) || gatesResponse.gates[0];
          
          return {
            id: operator.id,
            name: operator.name,
            image: operator.image,
            station: station.name,
            gate: gate.name,
            sales: Math.floor(Math.random() * 100 * multiplier),
            rank: 0,
            shift: ['Morning', 'General', 'Evening'][Math.floor(Math.random() * 3)]
          };
        })
        .sort((a, b) => b.sales - a.sales)
        .map((item, index) => ({ ...item, rank: index + 1 }))
        .slice(0, 10);
      };

      setSalesData({
        daily: generateSalesData('daily'),
        weekly: generateSalesData('weekly'),
        monthly: generateSalesData('monthly')
      });

      setSyncState('synced');
      setLastSyncTime(new Date());
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError('Failed to fetch sales data. Please try again.');
      setSyncState('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchSalesData();
  };

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return '#FFD700'; // Gold
      case 2:
        return '#C0C0C0'; // Silver
      case 3:
        return '#CD7F32'; // Bronze
      default:
        return theme.secondaryText;
    }
  };

  const LeaderboardItem = ({ item }: { item: SalesData }) => {
    const [imageError, setImageError] = useState(false);

    return (
      <View style={[styles.leaderboardItem, { backgroundColor: theme.card }]}>
        <View style={styles.rankContainer}>
          {item.rank <= 3 ? (
            <Trophy size={24} color={getMedalColor(item.rank)} />
          ) : (
            <Text style={[styles.rankText, { color: theme.secondaryText }]}>
              #{item.rank}
            </Text>
          )}
        </View>
        <View style={[styles.profileImageContainer, { backgroundColor: theme.card }]}>
          {!imageError ? (
            <Image
              source={{ uri: item.image }}
              style={styles.profileImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <User size={24} color={theme.secondaryText} />
          )}
        </View>
        <View style={styles.detailsContainer}>
          <Text style={[styles.nameText, { color: theme.text }]}>{item.name}</Text>
          <View style={styles.locationContainer}>
            <MapPin size={14} color={theme.secondaryText} />
            <Text style={[styles.locationText, { color: theme.secondaryText }]}>
              {item.station} - {item.gate}
            </Text>
          </View>
          <Text style={[styles.shiftText, { color: theme.secondaryText }]}>
            {item.shift} Shift
          </Text>
        </View>
        <View style={styles.salesContainer}>
          <Ticket size={20} color={COLORS.primary.light} />
          <Text style={[styles.salesText, { color: COLORS.primary.light }]}>
            {item.sales}
          </Text>
        </View>
      </View>
    );
  };

  const PeriodSelector = () => (
    <View style={[styles.periodSelector, { backgroundColor: theme.card }]}>
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'daily' && { backgroundColor: COLORS.primary.light },
        ]}
        onPress={() => setSelectedPeriod('daily')}
      >
        <Calendar size={20} color={selectedPeriod === 'daily' ? COLORS.white : theme.text} />
        <Text
          style={[
            styles.periodText,
            { color: selectedPeriod === 'daily' ? COLORS.white : theme.text },
          ]}
        >
          Daily
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'weekly' && { backgroundColor: COLORS.primary.light },
        ]}
        onPress={() => setSelectedPeriod('weekly')}
      >
        <Calendar size={20} color={selectedPeriod === 'weekly' ? COLORS.white : theme.text} />
        <Text
          style={[
            styles.periodText,
            { color: selectedPeriod === 'weekly' ? COLORS.white : theme.text },
          ]}
        >
          Weekly
        </Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.periodButton,
          selectedPeriod === 'monthly' && { backgroundColor: COLORS.primary.light },
        ]}
        onPress={() => setSelectedPeriod('monthly')}
      >
        <Calendar size={20} color={selectedPeriod === 'monthly' ? COLORS.white : theme.text} />
        <Text
          style={[
            styles.periodText,
            { color: selectedPeriod === 'monthly' ? COLORS.white : theme.text },
          ]}
        >
          Monthly
        </Text>
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Sales Leaderboard</Text>
          {lastSyncTime && (
            <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.light} />
          <Text style={[styles.loadingText, { color: theme.secondaryText }]}>
            Loading sales data...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Sales Leaderboard</Text>
          {lastSyncTime && (
            <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
          )}
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.primary.light }]} onPress={fetchSalesData}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>Sales Leaderboard</Text>
          {lastSyncTime && (
            <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
          )}
        </View>
        
        <PeriodSelector />
        
        <ScrollView 
          style={styles.leaderboardContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary.light]}
              tintColor={COLORS.primary.light}
            />
          }
        >
          {salesData[selectedPeriod].map((item) => (
            <LeaderboardItem key={item.id} item={item} />
          ))}
        </ScrollView>
      </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['2xl'],
  },
  periodSelector: {
    flexDirection: 'row',
    padding: SPACING.sm,
    marginHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  periodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    marginHorizontal: SPACING.xs,
  },
  periodText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  leaderboardContainer: {
    flex: 1,
    padding: SPACING.lg,
  },
  leaderboardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.sm,
  },
  rankContainer: {
    width: 40,
    alignItems: 'center',
  },
  rankText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginLeft: SPACING.sm,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: SPACING.md,
  },
  nameText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    marginBottom: SPACING.xs,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginLeft: SPACING.xs,
  },
  shiftText: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
  },
  salesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: SPACING.md,
  },
  salesText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    marginLeft: SPACING.xs,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.white,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    marginTop: SPACING.md,
  },
}); 