import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import SyncStatus from '@/components/ui/SyncStatus';
import { ArrowLeft, Settings, RefreshCw, MapPin, Activity, CreditCard } from 'lucide-react-native';
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

  useEffect(() => {
    fetchTVMDetails();
  }, [id]);

  const fetchTVMDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await tvmApi.getTVM(Number(id));
      if (response.status === 'true') {
        setTVM(response.device);
      } else {
        setError(response.message || 'Failed to fetch TVM details');
      }
    } catch (err) {
      setError('Failed to fetch TVM details. Please try again.');
      console.error('Error fetching TVM details:', err);
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

      <ScrollView contentContainerStyle={styles.content}>
        <Card style={cardStyle(styles.statusCard)}>
          <View style={styles.statusHeader}>
            <Text style={[styles.tvmName, { color: theme.text }]}>{tvm.name}</Text>
            <StatusBadge 
              label={getStatusLabel(tvm.status)} 
              type={getStatusType(tvm.status)} 
              size="md" 
            />
          </View>
          <Text style={[styles.serialNumber, { color: theme.secondaryText }]}>Serial Number: {tvm.serial_number}</Text>
        </Card>

        <Card style={cardStyle(styles.detailsCard)}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Device Information</Text>
          <View style={[styles.detailItem, { borderBottomColor: theme.border }]}>
            <Text style={[styles.detailLabel, { color: theme.secondaryText }]}>Model Number</Text>
            <Text style={[styles.detailValue, { color: theme.text }]}>{tvm.model_number}</Text>
          </View>
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

        {tvm.location_details && (
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
        )}
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
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tvmName: {
    fontSize: FONT_SIZES.xl,
    fontFamily: FONTS.bold,
    color: COLORS.neutral[900],
  },
  serialNumber: {
    fontSize: FONT_SIZES.sm,
    fontFamily: FONTS.regular,
    color: COLORS.neutral[600],
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
}); 