import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, ViewStyle, Image, Alert, Dimensions, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import SyncStatus from '@/components/ui/SyncStatus';
import { ArrowLeft, Settings, RefreshCw, MapPin, Activity, CreditCard, Building2, Monitor, User, Clock } from 'lucide-react-native';
import { tvmApi, TVM } from '@/utils/api';
import { useTheme } from '@/context/theme';

export default function TVMDetailsScreen() {
  const { theme } = useTheme();
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [tvm, setTVM] = useState<TVM | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncState, setSyncState] = useState<'offline' | 'syncing' | 'synced' | 'error'>('synced');
  const [showFullScreenImage, setShowFullScreenImage] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchTVMDetails();
    }
  }, [id]);

  const fetchTVMDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tvmApi.getTVM(Number(id));
      
      if (response.status === 'true' && response.device) {
        setTVM(response.device);
      } else {
        const apiMessage = response.message || 'Failed to fetch TVM details';
        setError(apiMessage);
      }
    } catch (err: any) {
      const apiMessage = err?.response?.data?.message || err?.message || 'Unknown error';
      setError(apiMessage);
    } finally {
      setLoading(false);
    }
  };

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

  const cardStyle = (baseStyle: ViewStyle): ViewStyle => ({
    ...baseStyle,
    backgroundColor: theme.card,
  });

  const handleSerialNumberPress = () => {
    Alert.alert(
      "Device Information",
      `S/N Number: ${tvm?.serial_number}`,
      [{ text: "OK" }]
    );
  };

  const handleImagePress = (imageUrl: string | null) => {
    if (imageUrl) {
      setFullScreenImageUrl(imageUrl);
      setShowFullScreenImage(true);
    }
  };

  if (loading) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>TVM Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.light} />
          <Text style={[styles.loadingText, { color: theme.secondaryText }]}>Loading TVM details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !tvm) {
    return (
      <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>TVM Details</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error || 'TVM not found'}</Text>
          <TouchableOpacity style={[styles.retryButton, { backgroundColor: COLORS.primary.light }]} onPress={fetchTVMDetails}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.text }]}>TVM Details</Text>
        <View style={styles.headerRight}>
          <SyncStatus state={syncState} lastSynced="a min ago" />
          <TouchableOpacity style={styles.refreshButton} onPress={fetchTVMDetails}>
            <RefreshCw size={20} color={theme.secondaryText} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.settingsButton}>
            <Settings size={20} color={theme.secondaryText} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content}>
        <Card style={cardStyle(styles.statusCard)}>
          <View style={styles.statusHeader}>
            <View>
              <TouchableOpacity onPress={handleSerialNumberPress}>
                <Text style={[styles.serialNumber, { color: theme.text }]}>
                  S/N: {tvm.serial_number}
                </Text>
              </TouchableOpacity>
              <Text style={[styles.modelText, { color: theme.secondaryText }]}>Model: {tvm.model_number}</Text>
            </View>
            <StatusBadge 
              label={getStatusLabel(tvm.status)} 
              type={getStatusType(tvm.status)} 
              size="md" 
            />
          </View>
        </Card>

        {tvm.location_details && (
          <>
            <Card style={cardStyle(styles.detailsCard)}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Location Images</Text>
              <View style={styles.imagesSection}>
                <View style={styles.imageContainer}>
                  <Text style={[styles.imageLabel, { color: theme.secondaryText }]}>Station</Text>
                  {tvm.location_details?.station_image_url ? (
                    <TouchableOpacity 
                      style={styles.imageWrapper}
                      onPress={() => {
                        const stationImageUrl = tvm.location_details?.station_image_url ?? null;
                        handleImagePress(stationImageUrl);
                      }}
                    >
                      <Image 
                        source={{ uri: tvm.location_details.station_image_url }} 
                        style={styles.locationImage}
                        resizeMode="cover"
                        onError={(e) => console.error('Error loading station image:', e.nativeEvent.error)}
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
                  {tvm.device_image_url ? (
                    <TouchableOpacity 
                      style={styles.imageWrapper}
                      onPress={() => handleImagePress(tvm.device_image_url)}
                    >
                      <Image 
                        source={{ uri: tvm.device_image_url }} 
                        style={styles.locationImage}
                        resizeMode="cover"
                        onError={(e) => console.error('Error loading device image:', e.nativeEvent.error)}
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
            </Card>

            <Card style={cardStyle(styles.detailsCard)}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Location Information</Text>
              <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Station</Text>
                <View style={styles.locationValue}>
                  <MapPin size={16} color={theme.secondaryText} />
                  <Text style={[styles.detailValue, { color: theme.text }]}>{tvm.location_details.station}</Text>
                </View>
              </View>
              <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Gate</Text>
                <Text style={[styles.detailValue, { color: theme.text }]}>Gate {tvm.location_details.gate} ({tvm.location_details.gate_type})</Text>
              </View>
              <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Uptime</Text>
                <View style={styles.locationValue}>
                  <Activity size={16} color={theme.secondaryText} />
                  <Text style={[styles.detailValue, { color: theme.text }]}>{tvm.location_details.uptime}%</Text>
                </View>
              </View>
              <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
                <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Transactions</Text>
                <View style={styles.locationValue}>
                  <CreditCard size={16} color={theme.secondaryText} />
                  <Text style={[styles.detailValue, { color: theme.text }]}>{tvm.location_details.transaction}</Text>
                </View>
              </View>
            </Card>

            <Card style={cardStyle(styles.detailsCard)}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Assigned Staff</Text>
              <View style={styles.staffContainer}>
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
                <View style={styles.staffRow}>
                  <View style={styles.staffInfo}>
                    <View style={styles.staffProfile}>
                      <View style={[styles.profileImagePlaceholder, { backgroundColor: COLORS.neutral[100] }]}>
                        <User size={24} color={COLORS.neutral[400]} />
                      </View>
                      <View>
                        <Text style={[styles.staffName, { color: theme.text }]}>-</Text>
                        <Text style={[styles.staffRole, { color: theme.secondaryText }]}>Gate Operator</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.staffShift}>
                    <Clock size={14} color={theme.secondaryText} />
                    <Text style={[styles.staffShiftText, { color: theme.secondaryText }]}>Evening Shift</Text>
                  </View>
                </View>
              </View>
            </Card>
          </>
        )}

        <Card style={cardStyle(styles.detailsCard)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Device Information</Text>
          
          <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Type</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{tvm.type}</Text>
          </View>
          {tvm.ip_address && (
            <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>IP Address</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{tvm.ip_address}</Text>
            </View>
          )}
          {tvm.mac_address && (
            <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
              <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>MAC Address</Text>
              <Text style={[styles.detailValue, { color: theme.text }]}>{tvm.mac_address}</Text>
            </View>
          )}
        </Card>

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
                onError={(e) => console.error('Error loading full screen image:', e.nativeEvent.error)}
              />
            )}
          </TouchableOpacity>
        </Modal>
      </ScrollView>
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
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  refreshButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  settingsButton: {
    padding: SPACING.xs,
    marginLeft: SPACING.sm,
  },
  title: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.neutral[900],
  },
  content: {
    padding: SPACING.md,
  },
  statusCard: {
    marginBottom: SPACING.md,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.xs,
  },
  serialNumber: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.bold,
    marginBottom: SPACING.xs,
  },
  modelText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
  },
  detailsCard: {
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: FONT_SIZES.lg,
    fontFamily: FONTS.bold,
    color: COLORS.neutral[900],
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
  },
  detailLabel: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
    color: COLORS.neutral[700],
  },
  detailValue: {
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.regular,
    color: COLORS.neutral[900],
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
    color: COLORS.neutral[600],
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
    fontSize: FONT_SIZES.md,
    fontFamily: FONTS.medium,
  },
  locationValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  imagesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.md,
    gap: SPACING.md,
  },
  imageContainer: {
    flex: 1,
    gap: SPACING.xs,
  },
  imageLabel: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
    marginBottom: SPACING.xs,
  },
  imageWrapper: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    overflow: 'hidden',
    backgroundColor: COLORS.neutral[100],
  },
  locationImage: {
    width: '100%',
    height: '100%',
    backgroundColor: COLORS.neutral[100],
  },
  placeholderImage: {
    width: '100%',
    height: 200,
    borderRadius: BORDER_RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.xs,
    backgroundColor: COLORS.neutral[100],
  },
  placeholderText: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.medium,
  },
  staffContainer: {
    marginTop: SPACING.sm,
  },
  staffRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.neutral[200],
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