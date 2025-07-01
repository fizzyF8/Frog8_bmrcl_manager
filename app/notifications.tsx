import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, SPACING, FONTS, FONT_SIZES, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { useTheme } from '@/context/theme';
import { Bell, CheckCircle, AlertCircle, Info, Clock, ArrowLeft, Check } from 'lucide-react-native';
import Card from '@/components/ui/Card';
import { useRouter } from 'expo-router';
import { notificationApi, Notification } from '@/utils/api';
// import { usePermissions } from '@/hooks/usePermissions';
import { useNotificationContext } from '@/context/taskContext';

const getNotificationIcon = (event: string) => {
  // You can customize icons based on event type
  switch (event) {
    case 'approve_leave':
      return <CheckCircle size={24} color={COLORS.success.light} />;
    case 'remove_leave':
      return <AlertCircle size={24} color={COLORS.warning.light} />;
    case 'task_assignment':
      return <Info size={24} color={COLORS.accent.light} />;
    case 'shift_assignment':
      return <Info size={24} color={COLORS.accent.light} />;
    default:
      return <Bell size={24} color={COLORS.primary.light} />;
  }
};

const formatTimestamp = (timestamp: string | null) => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) {
    if (mins === 0) return `${diffHours}h ago`;
    return `${diffHours}h ${mins}m ago`;
  }
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const NotificationsScreen = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [markingAll, setMarkingAll] = useState(false);
  // const { hasPermission } = usePermissions();
  const { refreshUnread } = useNotificationContext();

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await notificationApi.getAllNotifications();
      setNotifications(res.notifications.data);
    } catch (e) {
      setError('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationApi.markNotificationRead(id);
      setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read_at: new Date().toISOString() } : n));
      await refreshUnread();
    } catch (e) {
      Alert.alert('Error', 'Failed to mark notification as read');
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    try {
      await notificationApi.markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read_at: new Date().toISOString() })));
      await refreshUnread();
    } catch (e) {
      Alert.alert('Error', 'Failed to mark all as read');
    } finally {
      setMarkingAll(false);
    }
  };

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
    headerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    backButton: {
      marginRight: SPACING.sm,
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
        opacity: item.read_at ? 0.7 : 1,
        ...SHADOWS.sm,
      }}
    >
      <TouchableOpacity 
        style={styles.notificationContent}
        onPress={async () => {
          if (!item.read_at) {
            await handleMarkAsRead(item.id);
          }
        }}
      >
        <View style={styles.iconContainer}>
          {getNotificationIcon(item.data.event)}
        </View>
        <View style={styles.textContainer}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{item.data.title}</Text>
            {!item.read_at && <View style={styles.unreadIndicator} />}
          </View>
          <Text style={styles.message}>{item.data.message.replace(/<[^>]+>/g, '')}</Text>
          <View style={styles.timestampContainer}>
            <Clock size={14} color={theme.secondaryText} />
            <Text style={styles.timestamp}>
              {formatTimestamp(item.read_at)}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Card>
  );

  // if (!hasPermission('notifications.view')) {
  //   return (
  //     <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
  //       <Text style={{ color: theme.text, fontSize: FONT_SIZES.lg, fontFamily: FONTS.bold }}>
  //         You do not have permission to view notifications.
  //       </Text>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView edges={['top']} style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <TouchableOpacity 
          style={styles.markAllButton}
          onPress={handleMarkAllAsRead}
          disabled={markingAll}
        >
          {markingAll ? <ActivityIndicator size={18} color={COLORS.primary.light} /> : <Check size={20} color={COLORS.primary.light} />}
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color={COLORS.primary.light} />
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : (
        <FlatList
          data={notifications}
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
      )}
    </SafeAreaView>
  );
};

export default NotificationsScreen; 