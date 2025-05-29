import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { COLORS, FONTS, FONT_SIZES } from '@/constants/theme';
import { LayoutDashboard, CircleCheck as CheckCircle, Users, User, FileText, Trophy } from 'lucide-react-native';
import { useTheme } from '@/context/theme';
import { useRoleAccess } from '@/hooks/useRoleAccess';

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
  const { 
    canAccessDashboard,
    canAccessTasks,
    canAccessAttendance,
    canAccessLeaderboard
  } = useRoleAccess();

  console.log('canAccessAttendance in TabLayout (using hook value): ', canAccessAttendance);

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
      {canAccessDashboard && (
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <LayoutDashboard size={size} color={color} />
            ),
          }}
        />
      )}
      
      {canAccessTasks && (
        <Tabs.Screen
          name="tasks"
          options={{
            title: 'Tasks',
            tabBarIcon: ({ color, size }) => (
              <CheckCircle size={size} color={color} />
            ),
          }}
        />
      )}
      
      {/* Conditionally render Attendance tab or hide its button */}
      <Tabs.Screen
        name="attendance"
        options={{
          title: 'Attendance',
          tabBarIcon: ({ color, size }) => (
            <Users size={size} color={color} />
          ),
          tabBarButton: canAccessAttendance ? undefined : () => <View style={{ width: 0, height: 0 }} />,
          // You can also hide the whole screen if preferred:
          // headerShown: !canAccessAttendance,
          // tabBarStyle: canAccessAttendance ? [styles.tabBar, { backgroundColor: theme.card, borderTopColor: theme.border }] : { display: 'none' },
          // tabBarShowLabel: canAccessAttendance,
          // tabBarIcon: canAccessAttendance ? ({ color, size }) => (<Users size={size} color={color} />) : () => null,
        }}
      />
      
      {canAccessLeaderboard && (
        <Tabs.Screen
          name="leaderboard"
          options={{
            title: 'Leaderboard',
            tabBarIcon: ({ color, size }) => (
              <Trophy size={size} color={color} />
            ),
          }}
        />
      )}
    </Tabs>
  );
}