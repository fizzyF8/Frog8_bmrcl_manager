import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES } from '@/constants/theme';
import { LayoutDashboard, Ticket, CircleCheck as CheckCircle, Users, User, FileText } from 'lucide-react-native';
import { useTheme } from '@/context/theme';

const styles = StyleSheet.create({
  tabBar: {
    borderTopWidth: 1,
    height: 70,
  },
  tabBarLabel: {
    fontFamily: FONTS.medium,
    fontSize: FONT_SIZES.xs,
    marginBottom: 5,
  },
});

export default function TabLayout() {
  const { theme } = useTheme();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary.light,
        tabBarInactiveTintColor: theme.secondaryText,
        tabBarStyle: [styles.tabBar, { 
          backgroundColor: theme.card,
          borderTopColor: theme.border 
        }],
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ color, size }) => (
            <LayoutDashboard size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tvms"
        options={{
          title: 'TVMs',
          tabBarIcon: ({ color, size }) => (
            <Ticket size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <CheckCircle size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="notes"
        options={{
          title: 'Notes',
          tabBarIcon: ({ color, size }) => (
            <FileText size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <User size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}