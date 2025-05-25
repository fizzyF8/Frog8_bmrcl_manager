import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import Card from '@/components/ui/Card';
import StatusBadge from '@/components/ui/StatusBadge';
import { MapPin, CircleAlert as AlertCircle } from 'lucide-react-native';
import { TVM, TVMStatus } from '@/types';

interface TVMCardProps {
  tvm: TVM;
  onPress?: () => void;
}

const TVMCard: React.FC<TVMCardProps> = ({ tvm, onPress }) => {
  const getStatusType = (status: TVMStatus) => {
    switch (status) {
      case TVMStatus.OPERATIONAL:
        return 'success';
      case TVMStatus.MAINTENANCE:
        return 'warning';
      case TVMStatus.ERROR:
        return 'error';
      case TVMStatus.OFFLINE:
        return 'default';
      default:
        return 'default';
    }
  };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <Card variant="outlined" style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.tvmId}>{tvm.id}</Text>
          <StatusBadge 
            label={tvm.status} 
            type={getStatusType(tvm.status)}
            size="sm"
          />
        </View>
        
        <View style={styles.location}>
          <MapPin size={16} color={COLORS.neutral[500]} />
          <Text style={styles.stationName}>{tvm.stationName}</Text>
        </View>
        <Text style={styles.locationDetail}>{tvm.location}</Text>
        
        <View style={styles.stats}>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Uptime</Text>
            <Text style={styles.statValue}>{tvm.uptime}%</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statLabel}>Today's Transactions</Text>
            <Text style={styles.statValue}>{tvm.transactionsToday}</Text>
          </View>
        </View>
        
        {tvm.currentIssues.length > 0 && (
          <View style={styles.issuesContainer}>
            <View style={styles.issuesHeader}>
              <AlertCircle size={16} color={COLORS.error.light} />
              <Text style={styles.issuesTitle}>Current Issues:</Text>
            </View>
            {tvm.currentIssues.map((issue, index) => (
              <Text key={index} style={styles.issueItem}>• {issue}</Text>
            ))}
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  tvmId: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
    color: COLORS.neutral[900],
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  stationName: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral[700],
    marginLeft: SPACING.xs,
  },
  locationDetail: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[600],
    marginBottom: SPACING.sm,
  },
  stats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.sm,
  },
  statItem: {
    alignItems: 'flex-start',
  },
  statLabel: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.xs,
    color: COLORS.neutral[500],
    marginBottom: 2,
  },
  statValue: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.md,
    color: COLORS.neutral[900],
  },
  issuesContainer: {
    backgroundColor: COLORS.error.light + '10', // 10% opacity
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    marginTop: SPACING.xs,
  },
  issuesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  issuesTitle: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
    color: COLORS.error.light,
    marginLeft: SPACING.xs,
  },
  issueItem: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    color: COLORS.neutral[700],
    marginBottom: 2,
  },
});

export default TVMCard;