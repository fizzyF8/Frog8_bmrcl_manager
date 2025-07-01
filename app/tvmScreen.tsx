import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, ViewStyle, Animated, FlatList, RefreshControl, TextInput, Modal, Alert, Image, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import SyncStatus from '@/components/ui/SyncStatus';
import { Search, Filter, Building2, Monitor, User, Clock, ArrowLeft } from 'lucide-react-native';
import { TVM, tvmApi, LocationDetails } from '@/utils/api';
import { useTheme } from '@/context/theme';
import { getTimeElapsedString } from '@/utils/time';
import { router, useRouter } from 'expo-router';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
// import { usePermissions } from '@/hooks/usePermissions';

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
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

  const handleSerialNumberPress = () => {
    const commonPrefix = "F8TVM200025032025";
    const kioskNumber = item.serial_number.replace(commonPrefix, "");
    Alert.alert(
      "Device Information",
      `S/N Number: ${item.serial_number}`,
      [{ text: "OK" }]
    );
  };

  const handleImagePress = (imageUrl: string | null) => {
    if (imageUrl) {
      setFullScreenImageUrl(imageUrl);
      setShowFullScreenImage(true);
    }
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
          <View style={styles.tvmInfo}>
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
          <View style={styles.locationImages}>
            <View style={styles.imageContainer}>
              <Text style={[styles.imageLabel, { color: theme.secondaryText }]}>Station</Text>
              {item.location_details.station_image_url ? (
                <TouchableOpacity 
                  style={styles.imageWrapper}
                  onPress={() => {
                    const stationImageUrl = item.location_details?.station_image_url ?? null;
                    handleImagePress(stationImageUrl);
                  }}
                >
                  <Image 
                    source={{ uri: item.location_details.station_image_url }} 
                    style={styles.locationImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : (
                <View style={[styles.placeholderImage, { backgroundColor: COLORS.neutral[100] }]}>
                  <Building2 size={32} color={COLORS.neutral[400]} />
                  <Text style={[styles.placeholderText, { color: COLORS.neutral[400] }]}>Station Image</Text>
                </View>
              )}
            </View>
            <View style={styles.imageContainer}>
              <Text style={[styles.imageLabel, { color: theme.secondaryText }]}>Device</Text>
              {item.device_image_url ? (
                <TouchableOpacity 
                  style={styles.imageWrapper}
                  onPress={() => handleImagePress(item.device_image_url)}
                >
                  <Image 
                    source={{ uri: item.device_image_url }} 
                    style={styles.locationImage}
                    resizeMode="cover"
                  />
                </TouchableOpacity>
              ) : (
                <View style={[styles.placeholderImage, { backgroundColor: COLORS.neutral[100] }]}>
                  <Monitor size={32} color={COLORS.neutral[400]} />
                  <Text style={[styles.placeholderText, { color: COLORS.neutral[400] }]}>Device Image</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Full Screen Image Modal */}
        <Modal
          visible={showFullScreenImage}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowFullScreenImage(false)}
        >
          <TouchableOpacity 
            style={styles.fullScreenImageContainer} 
            activeOpacity={1} 
            onPress={() => setShowFullScreenImage(false)}
          >
            {fullScreenImageUrl && (
              <Image 
                source={{ uri: fullScreenImageUrl }} 
                style={styles.fullScreenImage}
                resizeMode="contain"
              />
            )}
          </TouchableOpacity>
        </Modal>

        {item.location_details && (
          <>
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
  const [showFilterModal, setShowFilterModal] = useState(false);
  // const { hasPermission } = usePermissions();

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
        const apiMessage = tvmResponse.message || 'Failed to fetch TVMs';
        setError(apiMessage);
        setSyncState('error');
      }
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || error?.message || 'Unknown error';
      setError(apiMessage);
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
    
    // Don't hide search bar if any filters are applied
    const hasActiveFilters = !showAllMachines || selectedStation || selectedGate || searchQuery;
    
    if (!searchQuery && !isSearchFocused.current && !hasActiveFilters) {
      hideTimer.current = setTimeout(() => {
        if (!searchQuery && !isSearchFocused.current && !hasActiveFilters) {
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
    
    // Check if any filters are applied
    const hasActiveFilters = !showAllMachines || selectedStation || selectedGate || searchQuery;
    
    // Only trigger if we've scrolled more than 10 pixels
    if (Math.abs(currentScrollY - lastScrollY.current) > 10) {
      if (isScrollingDown && showSearch && !searchQuery && !isSearchFocused.current && !hasActiveFilters) {
        // Hide search bar only if no filters are applied
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

  // if (!hasPermission('tvm.view')) {
  //   return (
  //     <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
  //       <Text style={{ color: theme.text, fontSize: FONT_SIZES.lg, fontFamily: FONTS.bold }}>
  //         You do not have permission to view TVMs.
  //       </Text>
  //     </SafeAreaView>
  //   );
  // }

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>TVMs</Text>
          </View>
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
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>TVMs</Text>
          </View>
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
    <ErrorBoundary>
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            <Text style={[styles.title, { color: theme.text }]}>TVMs</Text>
          </View>
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
            onPress={() => setShowFilterModal(true)}
          >
            <Filter size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </Animated.View>

        <Modal
          visible={showFilterModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowFilterModal(false)}
        >
          <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.7)' }]}>
            <View style={[styles.modalContent, { backgroundColor: theme.card }]}>
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: theme.text }]}>Filter TVMs</Text>
                <TouchableOpacity onPress={() => setShowFilterModal(false)}>
                  <Text style={[styles.closeButton, { color: theme.text }]}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView style={styles.modalBody}>
                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Show</Text>
                  <View style={styles.filterRow}>
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
                </View>

                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Station</Text>
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
                  <View style={styles.filterSection}>
                    <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Gate</Text>
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
                            {gate}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}

                <View style={styles.filterSection}>
                  <Text style={[styles.filterSectionTitle, { color: theme.text }]}>Status</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
                    {['1', '2', '3', '0', null].map((statusValue) => {
                      const label = statusValue === '1' ? 'Operational' : statusValue === '2' ? 'Maintenance' : statusValue === '3' ? 'Error' : statusValue === '0' ? 'Offline' : 'All';
                      return (
                        <TouchableOpacity
                          key={statusValue}
                          style={[
                            styles.filterOption,
                            filterStatus === statusValue && { backgroundColor: COLORS.primary.light }
                          ]}
                          onPress={() => setFilterStatus(statusValue)}
                        >
                          <Text style={[styles.filterOptionText, { color: filterStatus === statusValue ? COLORS.white : theme.text }]}>
                            {label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              </ScrollView>

              <TouchableOpacity 
                style={[styles.applyFilterButton, { backgroundColor: COLORS.primary.light }]} 
                onPress={() => setShowFilterModal(false)}
              >
                <Text style={styles.applyFilterButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

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
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: SPACING.sm,
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
    top: 110,
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
  tvmInfo: {
    flex: 1,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.md,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
    borderBottomWidth: 1,
    paddingBottom: SPACING.sm,
    borderColor: COLORS.neutral[300],
  },
  modalTitle: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
  },
  closeButton: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.medium,
  },
  modalBody: {
    flexGrow: 1,
  },
  filterSection: {
    marginBottom: SPACING.md,
  },
  filterSectionTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.sm,
  },
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  filterOption: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.neutral[100],
    borderWidth: 1,
    borderColor: COLORS.neutral[300],
  },
  filterOptionText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  applyFilterButton: {
    marginTop: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
  },
  applyFilterButtonText: {
    color: COLORS.white,
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  locationImages: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    gap: 16,
  },
  imageContainer: {
    flex: 1,
    gap: 8,
  },
  imageLabel: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  imageWrapper: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: COLORS.neutral[100],
  },
  locationImage: {
    width: '100%',
    height: '100%',
  },
  placeholderImage: {
    width: '100%',
    height: 120,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  placeholderText: {
    fontSize: 12,
    fontFamily: FONTS.medium,
  },
  staffContainer: {
    marginTop: SPACING.sm,
    paddingTop: SPACING.sm,
    borderTopWidth: 1,
    borderTopColor: COLORS.neutral[200],
  },
  staffTitle: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.sm,
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  staffInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffProfile: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  profileImagePlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.sm,
  },
  staffName: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  staffRole: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.neutral[600],
  },
  staffShift: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  staffShiftText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginLeft: SPACING.xs,
  },
  filterScroll: {
    flex: 1,
  },
  deviceImageContainer: {
    marginTop: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.neutral[100],
  },
  deviceImage: {
    width: '100%',
    height: 150,
    backgroundColor: COLORS.neutral[100],
  },
  fullScreenImageContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
}); 