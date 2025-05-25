import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, SPACING, FONTS, FONT_SIZES, BORDER_RADIUS } from '@/constants/theme';
import { WifiOff, Check, RefreshCcw } from 'lucide-react-native';
import { useTheme } from '@/context/theme';

type SyncState = 'offline' | 'syncing' | 'synced' | 'error';

interface SyncStatusProps {
  state: SyncState;
  lastSynced?: string;
  pendingChanges?: number;
}

const SyncStatus: React.FC<SyncStatusProps> = ({
  state,
  lastSynced,
  pendingChanges = 0,
}) => {
  const { theme } = useTheme();

  const getIcon = () => {
    switch (state) {
      case 'offline':
        return <WifiOff size={16} color={theme.secondaryText} />;
      case 'syncing':
        return <RefreshCcw size={16} color={COLORS.primary.light} />;
      case 'synced':
        return <Check size={16} color={COLORS.success.light} />;
      case 'error':
        return <WifiOff size={16} color={COLORS.error.light} />;
      default:
        return null;
    }
  };

  const getMessage = () => {
    switch (state) {
      case 'offline':
        return 'Working Offline';
      case 'syncing':
        return 'Syncing...';
      case 'synced':
        return `Synced ${lastSynced ? lastSynced : ''}`;
      case 'error':
        return 'Sync Failed';
      default:
        return '';
    }
  };

  const getBackgroundColor = () => {
    switch (state) {
      case 'offline':
        return theme.border;
      case 'syncing':
        return COLORS.primary.light + '20'; // 20% opacity
      case 'synced':
        return COLORS.success.light + '20'; // 20% opacity
      case 'error':
        return COLORS.error.light + '20'; // 20% opacity
      default:
        return theme.border;
    }
  };

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: getBackgroundColor() },
      ]}
    >
      {getIcon()}
      <Text style={[styles.text, { color: theme.secondaryText }]}>{getMessage()}</Text>
      {pendingChanges > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pendingChanges}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xs,
    paddingHorizontal: SPACING.sm,
    borderRadius: BORDER_RADIUS.full,
    marginVertical: SPACING.xs,
  },
  text: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    marginLeft: SPACING.xs,
  },
  badge: {
    backgroundColor: COLORS.error.light,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: SPACING.xs,
  },
  badgeText: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.xs,
    color: COLORS.white,
  },
});

export default SyncStatus;