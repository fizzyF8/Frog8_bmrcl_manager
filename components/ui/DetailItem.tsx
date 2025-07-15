import React, { ComponentType } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LucideProps } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { FONTS, SPACING } from '@/constants/theme';

interface DetailItemProps {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
}

const DetailItem = ({ icon: Icon, label, value }: DetailItemProps) => {
  const { theme } = useTheme();
  return (
    <View style={styles.container}>
      <Icon size={16} color={theme.secondaryText} style={styles.icon} />
      <Text style={[styles.label, { color: theme.secondaryText }]}>{label}: </Text>
      <Text style={[styles.value, { color: theme.text }]}>{value}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: SPACING.xs,
  },
  icon: {
    marginRight: SPACING.sm,
  },
  label: {
    fontFamily: FONTS.medium,
  },
  value: {
    fontFamily: FONTS.bold,
  },
});

export default DetailItem; 