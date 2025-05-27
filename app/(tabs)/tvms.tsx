import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, ActivityIndicator, ViewStyle, RefreshControl, Animated, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import SyncStatus from '@/components/ui/SyncStatus';
import { Search, Filter, MapPin, Activity, CreditCard, Clock, Building2, Monitor, User } from 'lucide-react-native';
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
  station_image?: string;
  kiosk_image?: string;
  assigned_staff?: {
    id: number;
    name: string;
    role: string;
    shift: string;
  }[];
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

// Helper functions
const getStatusType = (status: string) => {
  switch (status) {
    case '1':
      return 'success';
    case '2':
      return 'warning';
    case '3':
      return 'error';
    case '0':
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

// Create a memoized TVM card component
const TVMCard = React.memo(({ item, onPress, theme }: { item: TVM; onPress: () => void; theme: any }) => {
  const handleSerialNumberPress = () => {
    const commonPrefix = "F8TVM200025032025";
    const kioskNumber = item.serial_number.replace(commonPrefix, "");
    Alert.alert(
      "Device Information",
      `S/N Number: ${item.serial_number}`,
      [{ text: "OK" }]
    );
  };

  return (
    <TouchableOpacity onPress={onPress}>
      <Card 
        variant="outlined" 
        style={{
          ...styles.tvmCard,
          backgroundColor: theme.card
        }}
      >
        <View style={styles.tvmHeader}>
          <View>
            <TouchableOpacity onPress={handleSerialNumberPress}>
              <Text style={[styles.serialNumber, { color: theme.text, fontFamily: FONTS.bold }]}>
                Kiosk: {item.serial_number.replace("F8TVM200025032025", "")}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.modelText, { color: theme.secondaryText }]}>Model: {item.model_number}</Text>
          </View>
          <StatusBadge 
            label={getStatusLabel(item.status)} 
            type={getStatusType(item.status)} 
            size="sm" 
          />
        </View>

        {item.location_details && (
          <>
            <View style={styles.locationImages}>
              <View style={styles.imageContainer}>
                <Text style={[styles.imageLabel, { color: theme.secondaryText }]}>Station</Text>
                <View style={[styles.placeholderImage, { backgroundColor: COLORS.neutral[100] }]}>
                  <Building2 size={32} color={COLORS.neutral[400]} />
                  <Text style={[styles.placeholderText, { color: COLORS.neutral[400] }]}>Station Image</Text>
                </View>
              </View>
              <View style={styles.imageContainer}>
                <Text style={[styles.imageLabel, { color: theme.secondaryText }]}>Kiosk</Text>
                <View style={[styles.placeholderImage, { backgroundColor: COLORS.neutral[100] }]}>
                  <Monitor size={32} color={COLORS.neutral[400]} />
                  <Text style={[styles.placeholderText, { color: COLORS.neutral[400] }]}>Kiosk Image</Text>
                </View>
              </View>
            </View>

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

              <View style={styles.staffContainer}>
                <Text style={[styles.staffTitle, { color: theme.text }]}>Assigned Staff</Text>
                <View style={styles.staffRow}>
                  <View style={styles.staffInfo}>
                    <View style={styles.staffProfile}>
                      <View style={[styles.profileImagePlaceholder, { backgroundColor: COLORS.neutral[100] }]}>
                        <User size={24} color={COLORS.neutral[400]} />
                      </View>
                      <View>
                        <Text style={[styles.staffName, { color: theme.text }]}>Suman</Text>
                        <Text style={[styles.staffRole, { color: theme.secondaryText }]}>Station Supervisor</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.staffShift}>
                    <Clock size={14} color={theme.secondaryText} />
                    <Text style={[styles.staffShiftText, { color: theme.secondaryText }]}>Morning Shift</Text>
                  </View>
                </View>
                <View style={[styles.staffRow, { marginTop: SPACING.xs }]}>
                  <View style={styles.staffInfo}>
                    <View style={styles.staffProfile}>
                      <View style={[styles.profileImagePlaceholder, { backgroundColor: COLORS.neutral[100] }]}>
                        <User size={24} color={COLORS.neutral[400]} />
                      </View>
                      <View>
                        <Text style={[styles.staffName, { color: theme.text }]}>Ranjit</Text>
                        <Text style={[styles.staffRole, { color: theme.secondaryText }]}>Gate Supervisor</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.staffShift}>
                    <Clock size={14} color={theme.secondaryText} />
                    <Text style={[styles.staffShiftText, { color: theme.secondaryText }]}>Evening Shift</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        )}

        <View style={styles.tvmDetails}>
          {item.ip_address && <Text style={[styles.tvmDetail, { color: theme.secondaryText }]}>IP: {item.ip_address}</Text>}
          {item.mac_address && <Text style={[styles.tvmDetail, { color: theme.secondaryText }]}>MAC: {item.mac_address}</Text>}
        </View>
      </Card>
    </TouchableOpacity>
  );
});

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
  const [selectedStation, setSelectedStation] = useState<string | null>(null);
  const [selectedGate, setSelectedGate] = useState<string | null>(null);
  const [showAllMachines, setShowAllMachines] = useState(true);
  const lastScrollY = useRef(0);
  const searchBarHeight = useRef(new Animated.Value(1)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSearchFocused = useRef(false);

  // Get unique stations from TVMs
  const stations = useMemo(() => {
    const uniqueStations = new Set<string>();
    tvms.forEach(tvm => {
      if (tvm.location_details?.station) {
        uniqueStations.add(tvm.location_details.station);
      }
    });
    return Array.from(uniqueStations).sort();
  }, [tvms]);

  // Get unique gates for selected station
  const gates = useMemo(() => {
    if (!selectedStation) return [];
    const uniqueGates = new Set<string>();
    tvms.forEach(tvm => {
      if (tvm.location_details?.station === selectedStation && tvm.location_details?.gate) {
        uniqueGates.add(tvm.location_details.gate);
      }
    });
    return Array.from(uniqueGates).sort();
  }, [tvms, selectedStation]);

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
    const matchesStation = selectedStation ? tvm.location_details?.station === selectedStation : true;
    const matchesGate = selectedGate ? tvm.location_details?.gate === selectedGate : true;
    return matchesSearch && matchesFilter && matchesStation && matchesGate;
  });

  const handleTVMPress = useCallback((tvm: TVM) => {
    router.push({
      pathname: "/tvm/[id]",
      params: { id: tvm.id }
    });
  }, [router]);

  const renderItem = useCallback(({ item }: { item: TVM }) => (
    <TVMCard 
      item={item} 
      onPress={() => handleTVMPress(item)} 
      theme={theme}
    />
  ), [handleTVMPress, theme]);

  const keyExtractor = useCallback((item: TVM) => item.id.toString(), []);

  const getItemLayout = useCallback((data: ArrayLike<TVM> | null | undefined, index: number) => ({
    length: 300, // Approximate height of each item
    offset: 300 * index,
    index,
  }), []);

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
            handleSearchFocus();
          }}
        >
          <Filter size={20} color={theme.secondaryText} />
        </TouchableOpacity>
      </Animated.View>

      <View style={[styles.filterContainer, { backgroundColor: theme.card, borderColor: theme.border }]}>
        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Show:</Text>
          <TouchableOpacity
            style={[
              styles.filterOption,
              showAllMachines && { backgroundColor: COLORS.primary.light }
            ]}
            onPress={() => setShowAllMachines(true)}
          >
            <Text style={[styles.filterOptionText, { color: showAllMachines ? COLORS.white : theme.text }]}>
              All Machines
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.filterOption,
              !showAllMachines && { backgroundColor: COLORS.primary.light }
            ]}
            onPress={() => setShowAllMachines(false)}
          >
            <Text style={[styles.filterOptionText, { color: !showAllMachines ? COLORS.white : theme.text }]}>
              Selected
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.filterRow}>
          <Text style={[styles.filterLabel, { color: theme.text }]}>Station:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
            <TouchableOpacity
              style={[
                styles.filterOption,
                !selectedStation && { backgroundColor: COLORS.primary.light }
              ]}
              onPress={() => setSelectedStation(null)}
            >
              <Text style={[styles.filterOptionText, { color: !selectedStation ? COLORS.white : theme.text }]}>
                All
              </Text>
            </TouchableOpacity>
            {stations.map((station) => (
              <TouchableOpacity
                key={station}
                style={[
                  styles.filterOption,
                  selectedStation === station && { backgroundColor: COLORS.primary.light }
                ]}
                onPress={() => setSelectedStation(station)}
              >
                <Text style={[styles.filterOptionText, { color: selectedStation === station ? COLORS.white : theme.text }]}>
                  {station}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {selectedStation && (
          <View style={styles.filterRow}>
            <Text style={[styles.filterLabel, { color: theme.text }]}>Gate:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  !selectedGate && { backgroundColor: COLORS.primary.light }
                ]}
                onPress={() => setSelectedGate(null)}
              >
                <Text style={[styles.filterOptionText, { color: !selectedGate ? COLORS.white : theme.text }]}>
                  All
                </Text>
              </TouchableOpacity>
              {gates.map((gate) => (
                <TouchableOpacity
                  key={gate}
                  style={[
                    styles.filterOption,
                    selectedGate === gate && { backgroundColor: COLORS.primary.light }
                  ]}
                  onPress={() => setSelectedGate(gate)}
                >
                  <Text style={[styles.filterOptionText, { color: selectedGate === gate ? COLORS.white : theme.text }]}>
                    Gate {gate}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </View>

      <FlatList
        data={filteredTVMs}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        getItemLayout={getItemLayout}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={5}
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
  serialNumber: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  modelText: {
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
  filterContainer: {
    padding: SPACING.sm,
    borderBottomWidth: 1,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  filterLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginRight: SPACING.sm,
    minWidth: 60,
  },
  filterScroll: {
    flex: 1,
  },
  filterOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    marginRight: SPACING.xs,
    backgroundColor: COLORS.neutral[100],
  },
  filterOptionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  locationImages: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  imageContainer: {
    flex: 1,
  },
  imageLabel: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    borderRadius: BORDER_RADIUS.sm,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  placeholderText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.medium,
  },
  staffContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  staffTitle: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
  },
  staffInfo: {
    flex: 1,
  },
  staffProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  staffName: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  staffRole: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
  staffShift: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  staffShiftText: {
    fontSize: FONT_SIZES.xs,
    fontFamily: FONTS.regular,
  },
});