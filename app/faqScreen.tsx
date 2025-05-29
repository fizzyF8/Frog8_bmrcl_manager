import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, FONTS, FONT_SIZES, SPACING, BORDER_RADIUS } from '@/constants/theme';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { useRouter } from 'expo-router';

interface FAQItem {
  question: string;
  answer: string;
}

const faqItems: FAQItem[] = [
  {
    question: "What is BMRCL Manager?",
    answer: "BMRCL Manager is a comprehensive management application designed to help users manage tasks, notes, and other work-related activities efficiently."
  },
  {
    question: "How do I sync my data?",
    answer: "Your data is automatically synced when you're online. You can also manually sync by pulling down to refresh on most screens."
  },
  {
    question: "How do I create a new task?",
    answer: "You can create a new task by navigating to the Tasks screen and tapping the '+' button in the top right corner."
  },
  {
    question: "Can I use the app offline?",
    answer: "Yes, the app works offline. Your changes will be synced automatically when you're back online."
  },
  {
    question: "How do I change my profile information?",
    answer: "You can update your profile information by going to the Profile screen and tapping on the relevant fields."
  }
];

export default function FAQScreen() {
  const { theme } = useTheme();
  const router = useRouter();
  const [expandedItems, setExpandedItems] = React.useState<number[]>([]);

  const toggleItem = (index: number) => {
    setExpandedItems(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index)
        : [...prev, index]
    );
  };

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: theme.background }}>
      <View style={[styles.header, { backgroundColor: theme.card, borderBottomColor: theme.border }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <ArrowLeft size={24} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.text }]}>FAQ</Text>
        </View>
      </View>

      <ScrollView 
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {faqItems.map((item, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.faqItem, { backgroundColor: theme.card }]}
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
              <Text style={[styles.answer, { color: theme.secondaryText }]}>{item.answer}</Text>
            )}
          </TouchableOpacity>
        ))}
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
}); 