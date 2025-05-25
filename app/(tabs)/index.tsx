import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, ViewStyle, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import SyncStatus from '@/components/ui/SyncStatus';
import { Bell, ChevronRight, ArrowUp, ArrowDown } from 'lucide-react-native';
import { useAuth } from '@/context/auth';
import api, { TVMsResponse, TVM, tvmApi } from '@/utils/api';
import { useTheme } from '@/context/theme';
import { getTimeElapsedString } from '@/utils/time';
import { router, useRouter } from 'expo-router';

// Mock data
const tvmStats = {
  operational: 42,
  maintenance: 5,
  error: 2,
  offline: 1,
};

const tasks = {
  pending: 12,
  inProgress: 5,
  completed: 28,
};

const alerts = [
  {
    id: '1',
    title: 'TVM-123 Out of Service',
    description: 'TVM at Baiyappanahalli Station is reporting errors',
    priority: 'HIGH',
    time: '10 min ago',
  },
  {
    id: '2',
    title: 'New Task Assigned',
    description: 'Routine maintenance for TVM-456',
    priority: 'MEDIUM',
    time: '30 min ago',
  },
  {
    id: '3',
    title: 'Shift Change',
    description: 'Your shift starts in 1 hour',
    priority: 'LOW',
    time: '50 min ago',
  },
];

const performanceMetrics = [
  { label: 'Tasks Completed', value: 28, change: 5, up: true },
  { label: 'Avg Response Time', value: '4.2 min', change: 0.3, up: false },
  { label: 'Customer Satisfaction', value: '4.8/5', change: 0.2, up: true },
];

interface User {
  name: string;
  // Add other user properties as needed
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerTitle: {
    fontSize: FONT_SIZES['2xl'],
    fontFamily: FONTS.bold,
  },
  notificationButton: {
    padding: SPACING.xs,
    position: 'relative',
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  greeting: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginBottom: SPACING.xs / 2,
  },
  name: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
  },
  notificationBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    backgroundColor: COLORS.error.light,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCount: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
  scrollView: {
    flex: 1,
  },
  section: {
    marginVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  sectionTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.primary.light,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  statCard: {
    width: '48%',
    marginBottom: SPACING.sm,
    padding: SPACING.sm,
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['2xl'],
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginVertical: SPACING.xs,
  },
  taskStatsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.md,
    marginHorizontal: -SPACING.xs / 2,
  },
  taskStatCard: {
    flex: 1,
    marginHorizontal: SPACING.xs / 2,
    padding: SPACING.md,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 100,
  },
  taskStatValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES['2xl'],
    marginBottom: SPACING.xs,
    textAlign: 'center',
  },
  taskStatLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    textAlign: 'center',
  },
  performanceCard: {
    marginTop: SPACING.xs,
  },
  performanceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  borderBottom: {
    borderBottomWidth: 1,
  },
  performanceLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
  },
  performanceValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    marginRight: SPACING.sm,
  },
  changeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xs,
    paddingVertical: 2,
    borderRadius: 4,
  },
  changeText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    marginLeft: SPACING.xs / 2,
  },
  alertCard: {
    marginBottom: SPACING.md,
  },
  alertHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  alertTitle: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    flex: 1,
    marginRight: SPACING.sm,
  },
  alertDescription: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  alertTime: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral[500],
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.sm,
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
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
    color: COLORS.error.light,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    backgroundColor: COLORS.primary.light,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
  },
});

const getTimeBasedGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

export default function Dashboard() {
  const { theme } = useTheme();
  const { user } = useAuth() as { user: User | null };
  const router = useRouter();
  const [tvmStats, setTvmStats] = useState({
    operational: 0,
    maintenance: 0,
    error: 0,
    offline: 0,
    total: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      setSyncState('syncing');
      const response = await tvmApi.getTVMs();
      const tvmResponse = response.data;

      if (tvmResponse.status === 'true' && tvmResponse.devices) {
        const operational = tvmResponse.devices.filter((tvm: TVM) => tvm.status === '1').length;
        const maintenance = tvmResponse.devices.filter((tvm: TVM) => tvm.status === '2').length;
        const errorCount = tvmResponse.devices.filter((tvm: TVM) => tvm.status === '3').length;
        const offline = tvmResponse.devices.filter((tvm: TVM) => tvm.status === '0').length;
        const total = tvmResponse.devices.length;

        const newTvmStats = {
          operational,
          maintenance,
          error: errorCount,
          offline,
          total,
        };
        setTvmStats(newTvmStats);

        setSyncState('synced');
        setLastSyncTime(new Date());
      } else {
        const errorMessage = tvmResponse.message || 'Failed to fetch TVM stats';
        setError(errorMessage);
        setSyncState('error');
        console.error('Failed to fetch TVM stats:', errorMessage);
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch dashboard data. Please try again.';
      setError(errorMessage);
      console.error('Error fetching dashboard data:', err);
      setSyncState('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case '1':
        return 'Operational';
      case '2':
        return 'Maintenance';
      case '3':
        return 'Error';
      case '0':
        return 'Offline';
      default:
        return 'Unknown';
    }
  };

  const getStatusType = (status: string): 'success' | 'warning' | 'error' | 'info' | 'default' => {
    switch (status) {
      case '1': return 'success';
      case '2': return 'warning';
      case '3': return 'warning';
      case '4': return 'error';
      default: return 'warning';
    }
  };

  if (!user) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card }]}>
          <View>
            <Text style={[styles.greeting, { color: theme.secondaryText }]}>Welcome back,</Text>
            <Text style={[styles.name, { color: theme.text }]}>User</Text>
          </View>
          <View style={styles.headerRight}>
            <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime || new Date())} />
            <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
              <Bell size={24} color={theme.text} />
            </TouchableOpacity>
          </View>
        </View>
        <View style={styles.loadingContainer}>
          {loading ? (
            <ActivityIndicator size="large" color={COLORS.primary.light} />
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
              <TouchableOpacity onPress={fetchDashboardData} style={styles.retryButton}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <Text style={{ color: theme.text }}>Loading dashboard...</Text>
          )}
        </View>
      </SafeAreaView>
    );
  }

  const cardStyle = (baseStyle: ViewStyle): ViewStyle => ({
    ...baseStyle,
    backgroundColor: theme.card,
  });

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View>
          <Text style={[styles.greeting, { color: theme.secondaryText }]}>{getTimeBasedGreeting()},</Text>
          <Text style={[styles.name, { color: theme.text }]}>{user?.name || 'User'}</Text>
        </View>
        <View style={styles.headerRight}>
          <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime || new Date())} />
          <TouchableOpacity style={styles.notificationButton} onPress={() => router.push('/notifications')}>
            <Bell size={24} color={theme.text} />
            {alerts.length > 0 && (
              <View style={styles.notificationBadge}>
                <Text style={styles.notificationCount}>{alerts.length}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.light} />
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[COLORS.primary.light]}
              tintColor={COLORS.primary.light}
            />
          }
        >
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>TVM Status</Text>
              <TouchableOpacity 
                style={styles.viewAllButton}
                onPress={() => router.push('/(tabs)/tvms')}
              >
                <Text style={[styles.viewAllText, { color: COLORS.primary.light }]}>View All</Text>
                <ChevronRight size={16} color={COLORS.primary.light} />
              </TouchableOpacity>
            </View>
            <View style={styles.statsContainer}>
              <Card variant="elevated" style={cardStyle(styles.statCard)}>
                <Text style={[styles.statValue, { color: theme.text }]}>{tvmStats.operational}</Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}></Text>
                <StatusBadge label="Operational" type="success" size="sm" />
              </Card>
              <Card variant="elevated" style={cardStyle(styles.statCard)}>
                <Text style={[styles.statValue, { color: theme.text }]}>{tvmStats.maintenance}</Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}></Text>
                <StatusBadge label="Maintenance" type="warning" size="sm" />
              </Card>
              <Card variant="elevated" style={cardStyle(styles.statCard)}>
                <Text style={[styles.statValue, { color: theme.text }]}>{tvmStats.error}</Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}></Text>
                <StatusBadge label="Critical" type="error" size="sm" />
              </Card>
              <Card variant="elevated" style={cardStyle(styles.statCard)}>
                <Text style={[styles.statValue, { color: theme.text }]}>{tvmStats.offline}</Text>
                <Text style={[styles.statLabel, { color: theme.secondaryText }]}></Text>
                <StatusBadge label="Offline" type="default" size="sm" />
              </Card>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Tasks Overview</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={[styles.viewAllText, { color: COLORS.primary.light }]}>View All</Text>
                <ChevronRight size={16} color={COLORS.primary.light} />
              </TouchableOpacity>
            </View>
            <View style={styles.taskStatsContainer}>
              <Card variant="elevated" style={cardStyle(styles.taskStatCard)}>
                <Text style={[styles.taskStatValue, { color: theme.text }]}>{tasks.pending}</Text>
                <Text style={[styles.taskStatLabel, { color: theme.secondaryText }]}>Pending</Text>
              </Card>
              <Card variant="elevated" style={cardStyle(styles.taskStatCard)}>
                <Text style={[styles.taskStatValue, { color: theme.text }]}>{tasks.inProgress}</Text>
                <Text style={[styles.taskStatLabel, { color: theme.secondaryText }]}>Progress</Text>
              </Card>
              <Card variant="elevated" style={cardStyle(styles.taskStatCard)}>
                <Text style={[styles.taskStatValue, { color: theme.text }]}>{tasks.completed}</Text>
                <Text style={[styles.taskStatLabel, { color: theme.secondaryText }]}>Complete</Text>
              </Card>
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Performance Metrics</Text>
            </View>
            <Card variant="elevated" style={cardStyle(styles.performanceCard)}>
              {performanceMetrics.map((metric, index) => (
                <View
                  key={metric.label}
                  style={[
                    styles.performanceItem,
                    index < performanceMetrics.length - 1 && { ...styles.borderBottom, borderBottomColor: theme.border },
                  ]}
                >
                  <Text style={[styles.performanceLabel, { color: theme.text }]}>{metric.label}</Text>
                  <View style={styles.performanceValueContainer}>
                    <Text style={[styles.performanceValue, { color: theme.text }]}>{metric.value}</Text>
                    <View style={[styles.changeContainer, { backgroundColor: metric.up ? COLORS.success.light + '20' : COLORS.error.light + '20' }]}>
                      {metric.up ? (
                        <ArrowUp size={12} color={COLORS.success.light} />
                      ) : (
                        <ArrowDown size={12} color={COLORS.error.light} />
                      )}
                      <Text style={[styles.changeText, { color: metric.up ? COLORS.success.light : COLORS.error.light }]}>
                        {metric.change}%
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </Card>
          </View>

          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Alerts</Text>
              <TouchableOpacity style={styles.viewAllButton}>
                <Text style={[styles.viewAllText, { color: COLORS.primary.light }]}>View All</Text>
                <ChevronRight size={16} color={COLORS.primary.light} />
              </TouchableOpacity>
            </View>
            {alerts.map((alert) => (
              <Card key={alert.id} variant="elevated" style={cardStyle(styles.alertCard)}>
                <View style={styles.alertHeader}>
                  <Text style={[styles.alertTitle, { color: theme.text }]}>{alert.title}</Text>
                  <StatusBadge
                    label={alert.priority}
                    type={alert.priority === 'HIGH' ? 'error' : alert.priority === 'MEDIUM' ? 'warning' : 'info'}
                    size="sm"
                  />
                </View>
                <Text style={[styles.alertDescription, { color: theme.secondaryText }]}>{alert.description}</Text>
                <Text style={[styles.alertTime, { color: theme.secondaryText }]}>{alert.time}</Text>
              </Card>
            ))}
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}