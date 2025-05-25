import React, { useMemo } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/theme';
import { Bell, CheckCircle, AlertCircle, Info, Clock, ArrowLeft, Check } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import { router } from 'expo-router';

type NotificationType = 'success' | 'warning' | 'info' | 'error';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  read: boolean;
}

// Mock data for notifications
const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'Task Completed',
    message: 'The TVM maintenance task has been completed successfully.',
    type: 'success',
    timestamp: '2024-03-20T10:30:00',
    read: false,
  },
  {
    id: '2',
    title: 'System Update',
    message: 'A new system update is available. Please update when convenient.',
    type: 'info',
    timestamp: '2024-03-20T09:15:00',
    read: true,
  },
  {
    id: '3',
    title: 'Warning',
    message: 'Low battery detected on TVM #1234. Please check soon.',
    type: 'warning',
    timestamp: '2024-03-19T16:45:00',
    read: false,
  },
  {
    id: '4',
    title: 'Error Detected',
    message: 'Connection lost with TVM #5678. Please investigate.',
    type: 'error',
    timestamp: '2024-03-19T14:20:00',
    read: true,
  },
];

const getNotificationIcon = (type: NotificationType) => {
  switch (type) {
    case 'success':
      return <CheckCircle size={24} color={COLORS.success.light} />;
    case 'warning':
      return <AlertCircle size={24} color={COLORS.warning.light} />;
    case 'error':
      return <AlertCircle size={24} color={COLORS.error.light} />;
    case 'info':
      return <Info size={24} color={COLORS.accent.light} />;
  }
};

const formatTimestamp = (timestamp: string) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

  if (diffInHours < 24) {
    return `${diffInHours}h ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
};

const NotificationsScreen = () => {
  const { theme } = useTheme();

  const styles = useMemo(() => StyleSheet.create({
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
      backgroundColor: theme.card,
      borderBottomColor: theme.border,
      ...SHADOWS.sm,
    },
    backButton: {
      padding: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
    },
    headerTitle: {
      fontSize: FONT_SIZES.lg,
      fontFamily: FONTS.bold,
      color: theme.text,
    },
    markAllButton: {
      padding: SPACING.xs,
      borderRadius: BORDER_RADIUS.full,
      backgroundColor: theme.background,
    },
    listContent: {
      padding: SPACING.lg,
    },
    notificationContent: {
      flexDirection: 'row',
      padding: SPACING.md,
    },
    iconContainer: {
      marginRight: SPACING.md,
      width: 44,
      height: 44,
      borderRadius: BORDER_RADIUS.full,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.background,
      ...SHADOWS.sm,
    },
    textContainer: {
      flex: 1,
      justifyContent: 'center',
    },
    titleContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: SPACING.xs,
    },
    title: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      flex: 1,
      color: theme.text,
    },
    unreadIndicator: {
      width: 8,
      height: 8,
      borderRadius: BORDER_RADIUS.full,
      marginLeft: SPACING.xs,
      backgroundColor: COLORS.primary.light,
    },
    message: {
      fontSize: FONT_SIZES.sm,
      fontFamily: FONTS.regular,
      marginBottom: SPACING.xs,
      lineHeight: FONT_SIZES.md * 1.5,
      color: theme.secondaryText,
    },
    timestampContainer: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    timestamp: {
      fontSize: FONT_SIZES.xs,
      fontFamily: FONTS.regular,
      marginLeft: SPACING.xs,
      color: theme.secondaryText,
    },
    emptyContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: SPACING.xl * 2,
    },
    emptyIconContainer: {
      width: 96,
      height: 96,
      borderRadius: BORDER_RADIUS.full,
      justifyContent: 'center',
      alignItems: 'center',
      marginBottom: SPACING.lg,
      backgroundColor: theme.card,
      ...SHADOWS.sm,
    },
    emptyText: {
      fontSize: FONT_SIZES.md,
      fontFamily: FONTS.medium,
      textAlign: 'center',
      color: theme.secondaryText,
    },
  }), [theme]);

  const renderNotification = ({ item }: { item: Notification }) => (
    <Card
      variant="elevated"
      style={{
        marginBottom: SPACING.md,
        borderRadius: BORDER_RADIUS.lg,
        backgroundColor: theme.card,
        opacity: item.read ? 0.7 : 1,
        ...SHADOWS.sm,
      }}
    >
      <TouchableOpacity 
        style={styles.notificationContent}
        onPress={() => {
          // Handle notification press
        }}
      >
        <View style={styles.iconContainer}>
          {getNotificationIcon(item.type)}
        </View>
        <View style={styles.textContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{item.title}</Text>
            {!item.read && <View style={styles.unreadIndicator} />}
          </View>
          <Text style={styles.message}>{item.message}</Text>
          <View style={styles.timestampContainer}>
            <Clock size={14} color={theme.secondaryText} />
            <Text style={styles.timestamp}>
              {formatTimestamp(item.timestamp)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={() => {
            // Handle mark all as read
          }}
        >
          <Check size={20} color={COLORS.primary.light} />
        </TouchableOpacity>
      </View>
      <FlatList
        data={mockNotifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIconContainer}>
              <Bell size={48} color={theme.secondaryText} />
            </View>
            <Text style={styles.emptyText}>
              No notifications yet
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
};

export default NotificationsScreen; 