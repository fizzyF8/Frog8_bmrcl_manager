import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ViewStyle, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import SyncStatus from '@/components/ui/SyncStatus';
import { Search, Filter, MapPin, Activity, CreditCard } from 'lucide-react-native';
import { tvmApi } from '@/utils/api';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/theme';
import { getTimeElapsedString } from '@/utils/time';

interface LocationDetails {
  station: string;
  gate: string;
  gate_type: string;
  uptime: string;
  transaction: string;
}

interface TVM {
  id: number;
  name: string;
  type: string;
  model_number: string;
  serial_number: string;
  ip_address: string | null;
  mac_address: string | null;
  organization_id: number;
  status: string;
  location_details?: LocationDetails;
}

export default function TVMsScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [tvms, setTVMs] = useState<TVM[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showSearch, setShowSearch] = useState(true);
  const lastScrollY = useRef(0);
  const searchBarHeight = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearchFocused = useRef(false);

  useEffect(() => {
    fetchTVMs();
  }, []);

  const fetchTVMs = async () => {
    try {
      setLoading(true);
      setRefreshing(true);
      setError(null);
      setSyncState('syncing');
      const response = await tvmApi.getTVMs();
      const tvmResponse = response.data;

      if (tvmResponse.status === 'true' && tvmResponse.devices) {
        setTVMs(tvmResponse.devices);
        setSyncState('synced');
        setLastSyncTime(new Date());
      } else {
        const errorMessage = tvmResponse.message || 'Failed to fetch TVMs';
        setError(errorMessage);
        setSyncState('error');
      }
    } catch (err) {
      const errorMessage = 'Failed to fetch TVMs. Please try again.';
      setError(errorMessage);
      setSyncState('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const filteredTVMs = tvms.filter((tvm) => {
    const matchesSearch = tvm.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         tvm.serial_number.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus ? tvm.status === filterStatus : true;
    return matchesSearch && matchesFilter;
  });

  const getStatusType = (status: string) => {
    switch (status) {
      case '1': // Assuming 1 means operational
        return 'success';
      case '2': // Assuming 2 means maintenance
        return 'warning';
      case '3': // Assuming 3 means error
        return 'error';
      case '0': // Assuming 0 means offline
        return 'default';
      default:
        return 'default';
    }
  };

  const getStatusLabel = (status: string) => {
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

  const handleTVMPress = (tvm: TVM) => {
    router.push({
      pathname: "/tvm/[id]",
      params: { id: tvm.id }
    });
  };

  const renderItem = ({ item }: { item: TVM }) => (
    <TouchableOpacity onPress={() => handleTVMPress(item)}>
      <Card 
        variant="outlined" 
        style={{
          ...styles.tvmCard,
          backgroundColor: theme.card
        }}
      >
        <View style={styles.tvmHeader}>
          <View>
            <Text style={[styles.tvmName, { color: theme.text }]}>{item.name}</Text>
            <Text style={[styles.tvmSerial, { color: theme.secondaryText }]}>S/N: {item.serial_number}</Text>
          </View>
          <StatusBadge 
            label={getStatusLabel(item.status)} 
            type={getStatusType(item.status)} 
            size="sm" 
          />
        </View>
        <View style={styles.tvmDetails}>
          <Text style={[styles.tvmDetail, { color: theme.secondaryText }]}>Model: {item.model_number}</Text>
          {item.ip_address && <Text style={[styles.tvmDetail, { color: theme.secondaryText }]}>IP: {item.ip_address}</Text>}
          {item.mac_address && <Text style={[styles.tvmDetail, { color: theme.secondaryText }]}>MAC: {item.mac_address}</Text>}
          
          {item.location_details && (
            <View style={styles.locationDetails}>
              <View style={styles.locationRow}>
                <MapPin size={16} color={theme.secondaryText} />
                <Text style={[styles.locationText, { color: theme.secondaryText }]}>
                  {item.location_details.station} - Gate {item.location_details.gate} ({item.location_details.gate_type})
                </Text>
              </View>
              <View style={styles.metricsRow}>
                <View style={styles.metric}>
                  <Activity size={16} color={theme.secondaryText} />
                  <Text style={[styles.metricText, { color: theme.secondaryText }]}>
                    Uptime: {item.location_details.uptime}%
                  </Text>
                </View>
                <View style={styles.metric}>
                  <CreditCard size={16} color={theme.secondaryText} />
                  <Text style={[styles.metricText, { color: theme.secondaryText }]}>
                    Transactions: {item.location_details.transaction}
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>
      </Card>
    </TouchableOpacity>
  );

  const startHideTimer = () => {
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    
    if (!searchQuery && !isSearchFocused.current) {
      hideTimer.current = setTimeout(() => {
        if (!searchQuery && !isSearchFocused.current) {
          Animated.timing(searchBarHeight, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }).start(() => setShowSearch(false));
        }
      }, 3000);
    }
  };

  const handleSearchFocus = () => {
    isSearchFocused.current = true;
    if (hideTimer.current) {
      clearTimeout(hideTimer.current);
    }
    if (!showSearch) {
      setShowSearch(true);
      Animated.timing(searchBarHeight, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  };

  const handleSearchBlur = () => {
    isSearchFocused.current = false;
    startHideTimer();
  };

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    if (text) {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
      if (!showSearch) {
        setShowSearch(true);
        Animated.timing(searchBarHeight, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } else {
      startHideTimer();
    }
  };

  useEffect(() => {
    startHideTimer();
    return () => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [searchQuery]);

  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const isScrollingDown = currentScrollY > lastScrollY.current;
    const isScrollingUp = currentScrollY < lastScrollY.current;
    
    // Only trigger if we've scrolled more than 10 pixels
    if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
      if (isScrollingDown && showSearch && !searchQuery && !isSearchFocused.current) {
        // Hide search bar
        Animated.timing(searchBarHeight, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start(() => setShowSearch(false));
      } else if (isScrollingUp && !showSearch) {
        // Show search bar
        setShowSearch(true);
        Animated.timing(searchBarHeight, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    }
    
    lastScrollY.current = currentScrollY;
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>TVMs</Text>
          {lastSyncTime && (
            <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
          )}
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.light} />
          <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading TVMs...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <Text style={[styles.title, { color: theme.text }]}>TVMs</Text>
          {lastSyncTime && (
            <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
          )}
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.primary.light }]} onPress={fetchTVMs}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <Text style={[styles.title, { color: theme.text }]}>TVMs</Text>
        {lastSyncTime && (
          <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastSyncTime)} />
        )}
      </View>

      <Animated.View 
        style={[
          styles.searchContainer,
          {
            transform: [{
              translateY: searchBarHeight.interpolate({
                inputRange: [0, 1],
                outputRange: [-80, 0]
              })
            }],
            opacity: searchBarHeight,
            maxHeight: 80,
            overflow: 'hidden',
            backgroundColor: theme.background
          }
        ]}
      >
        <View style={[styles.searchInput, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <Search size={20} color={theme.secondaryText} />
          <TextInput
            style={[styles.searchTextInput, { color: theme.text }]}
            placeholder="Search TVMs..."
            placeholderTextColor={theme.secondaryText}
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
          />
        </View>
        <TouchableOpacity 
          style={[styles.filterButton, { backgroundColor: theme.card, borderColor: theme.border }]}
          onPress={() => {
            handleSearchFocus(); // Keep search visible when filter is pressed
            /* TODO: Implement filter functionality */
          }}
        >
          <Filter size={20} color={theme.secondaryText} />
        </TouchableOpacity>
      </Animated.View>

      <FlatList
        data={filteredTVMs}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingTop: 80 }]}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={fetchTVMs}
            colors={[COLORS.primary.light]}
            tintColor={COLORS.primary.light}
          />
        }
      />
    </SafeAreaView>
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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    gap: SPACING.sm,
    position: 'absolute',
    top: 56,
    left: 0,
    right: 0,
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    paddingHorizontal: SPACING.md,
    height: 48,
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  searchTextInput: {
    flex: 1,
    marginLeft: SPACING.sm,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    height: '100%',
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.lg,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...SHADOWS.sm,
  },
  listContent: {
    padding: SPACING.md,
  },
  tvmCard: {
    marginBottom: SPACING.md,
  },
  tvmHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.sm,
  },
  tvmName: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  tvmSerial: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  tvmDetails: {
    marginTop: SPACING.sm,
  },
  tvmDetail: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginBottom: SPACING.xs,
  },
  locationDetails: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.primary.light,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  locationText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: SPACING.xs,
  },
  metric: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    marginLeft: SPACING.xs,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
  },
  errorText: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
});