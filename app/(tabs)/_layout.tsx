import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES } from '@/constants/theme';
import { LayoutDashboard, CircleCheck as CheckCircle, Users, User, FileText, Trophy } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
// import { usePermissions } from '@/hooks/usePermissions';

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
  // const { hasPermission } = usePermissions();

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
      {/* {hasPermission('dashboard.view') && ( */}
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <LayoutDashboard size={size} color={color} />
            ),
          }}
        />
      {/* )} */}
      
      {/* {hasPermission('task.view') && ( */}
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size }) => (
              <CheckCircle size={size} color={color} />
            ),
          }}
        />
      {/* )} */}
      
      {/* {hasPermission('attendance.view') && ( */}
        <Tabs.Screen
          name="attendance"
          options={{
            title: 'Attendance',
            tabBarIcon: ({ color, size }) => (
              <Users size={size} color={color} />
            ),
          }}
        />
      {/* )} */}
      
      {/* {hasPermission('leaderboard.view') && ( */}
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Leaderboard',
            tabBarIcon: ({ color, size }) => (
              <Trophy size={size} color={color} />
            ),
          }}
        />
      {/* )} */}
    </Tabs>
  );
}