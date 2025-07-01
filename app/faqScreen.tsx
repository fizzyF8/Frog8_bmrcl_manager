import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '@/constants/theme';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SyncStatus from '@/components/ui/SyncStatus';
import { getTimeElapsedString } from '@/utils/time';
import { faqApi } from '@/utils/api';
// import { usePermissions } from '@/hooks/usePermissions';

interface FAQItem {
  id: number;
  question: string;
  answer: string;
  description?: string;
  remark?: string;
  category?: string;
  priority?: string;
  status?: string;
  added_by?: number;
}

interface FAQResponse {
  status: string;
  message: string;
  faq: FAQItem[];
}

export default function FAQScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = React.useState<number[]>([]);
  const [faqItems, setFaqItems] = React.useState<FAQItem[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [syncState, setSyncState] = useState<'syncing' | 'synced' | 'error' | 'offline'>('synced');
  const [lastRefreshTime, setLastRefreshTime] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  // const { hasPermission } = usePermissions();

  const fetchFAQs = async () => {
    try {
      if (!refreshing) {
        setLoading(true);
      }
      setError(null);
      setSyncState('syncing');
      const response = await faqApi.getFAQs();
      if (response.status === 'true' && Array.isArray(response.faq)) {
        setFaqItems(response.faq);
        setSyncState('synced');
        setLastRefreshTime(new Date());
      } else {
        setError('Invalid FAQ data received');
        setSyncState('error');
      }
    } catch (err) {
      console.error('Error fetching FAQs:', err);
      setError('Failed to fetch FAQs. Please try again later.');
      setSyncState('error');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  React.useEffect(() => {
    fetchFAQs();
  }, []);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    fetchFAQs();
  }, []);

  const toggleItem = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const renderContent = () => {
    if (loading && !refreshing) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      );
    }

    if (error && !refreshing) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.error }]}>{error}</Text>
          <TouchableOpacity 
            style={[styles.retryButton, { backgroundColor: theme.primary }]}
            onPress={fetchFAQs}
          >
            <Text style={[styles.retryText, { color: theme.card }]}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (!faqItems.length && !loading) {
      return (
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: theme.secondaryText }]}>No FAQs available</Text>
        </View>
      );
    }

    return faqItems.map((item, index) => (
      <TouchableOpacity
        key={item.id}
        style={[styles.faqItem, { backgroundColor: theme.card }, SHADOWS.sm]}
        onPress={() => toggleItem(index)}
      >
        <View style={styles.questionContainer}>
          <Text style={[styles.question, { color: theme.text }]}>{item.question}</Text>
          {expandedItems.includes(index) ? (
            <ChevronUp size={24} color={theme.secondaryText} />
          ) : (
            <ChevronDown size={24} color={theme.secondaryText} />
          )}
        </View>
        {expandedItems.includes(index) && (
          <View>
            <Text style={[styles.answer, { color: theme.secondaryText }]}>{item.answer}</Text>
            {item.description && (
              <Text style={[styles.description, { color: theme.secondaryText }]}>
                {item.description}
              </Text>
            )}
            {item.remark && (
              <Text style={[styles.remark, { color: theme.error }]}>
                Note: {item.remark}
              </Text>
            )}
          </View>
        )}
      </TouchableOpacity>
    ));
  };

  // if (!hasPermission('faq.view')) {
  //   return (
  //     <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.background }}>
  //       <Text style={{ color: theme.text, fontSize: FONT_SIZES.lg, fontFamily: FONTS.bold }}>
  //         You do not have permission to view the FAQ.
  //       </Text>
  //     </SafeAreaView>
  //   );
  // }

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }, SHADOWS.sm]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>FAQ</Text>
        </View>
        <SyncStatus state={syncState} lastSynced={getTimeElapsedString(lastRefreshTime || new Date())} />
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[COLORS.primary.light]}
            tintColor={COLORS.primary.light}
          />
        }
      >
        {renderContent()}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: SPACING.xs,
    marginRight: SPACING.sm,
  },
  title: {
    fontFamily: FONTS.bold,
    fontSize: FONT_SIZES.lg,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: SPACING.md,
  },
  faqItem: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  questionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  question: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    flex: 1,
    marginRight: SPACING.sm,
  },
  answer: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  description: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.sm,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  remark: {
    fontFamily: FONTS.regular,
    fontSize: FONT_SIZES.sm,
    marginTop: SPACING.sm,
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.xl,
  },
  errorText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.md,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  retryButton: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },
  retryText: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.sm,
  },
}); 