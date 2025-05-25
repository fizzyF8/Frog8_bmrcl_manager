import { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { Redirect } from 'expo-router';

export default function App() {
  // Redirect to auth or tabs based on authentication status
  // For now, we'll redirect to login
  return <Redirect href="/auth/login" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});