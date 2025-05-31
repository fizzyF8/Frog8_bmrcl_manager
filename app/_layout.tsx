import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_700Bold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { AuthProvider, useAuth } from '@/context/auth';
import { ThemeProvider } from '@/context/theme';
import ErrorBoundary from '@/components/ui/ErrorBoundary';
import { View, ActivityIndicator, Platform, Text } from 'react-native';
import { COLORS } from '@/constants/theme';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch(() => {
  /* ignore error */
});

function RootLayoutNav() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.white,
        ...Platform.select({
          ios: {
            paddingTop: 50
          }
        })
      }}>
        <ActivityIndicator size="large" color={COLORS.primary.light} />
      </View>
    );
  }

  return (
    <Stack screenOptions={{ 
      headerShown: false,
      animation: 'none',
      contentStyle: { backgroundColor: COLORS.white }
    }}>
      {isAuthenticated ? (
        <Stack.Screen 
          name="(tabs)" 
          options={{
            animation: 'none',
            contentStyle: { backgroundColor: COLORS.white }
          }}
        />
      ) : (
        <Stack.Screen 
          name="auth" 
          options={{
            animation: 'none',
            contentStyle: { backgroundColor: COLORS.white }
          }}
        />
      )}
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

export default function RootLayout() {
  useFrameworkReady();
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const [fontsLoaded, fontError] = useFonts({
    'Inter-Regular': Inter_400Regular,
    'Inter-Medium': Inter_500Medium,
    'Inter-Bold': Inter_700Bold,
  });

  useEffect(() => {
    let mounted = true;

    async function prepare() {
      try {
        // Wait for fonts to load
        if (!fontsLoaded && !fontError) {
          return;
        }

        // For iOS first initialization, we need to ensure the splash screen stays visible
        // until we're absolutely ready to show the app
        if (Platform.OS === 'ios') {
          // Keep splash screen visible while we prepare
          await new Promise(resolve => setTimeout(resolve, 500));
        }

        // Now hide the splash screen
        await SplashScreen.hideAsync();

        // Small delay after hiding splash screen
        await new Promise(resolve => setTimeout(resolve, 100));

        if (mounted) {
          setIsReady(true);
        }
      } catch (e) {
        console.error('Error preparing app:', e);
        if (mounted) {
          setError(e instanceof Error ? e : new Error('Failed to prepare app'));
          setIsReady(true);
        }
      }
    }

    prepare();

    return () => {
      mounted = false;
    };
  }, [fontsLoaded, fontError]);

  // Show nothing while loading
  if (!isReady || (!fontsLoaded && !fontError)) {
    return null;
  }

  // Show error if there is one
  if (error) {
    return (
      <View style={{ 
        flex: 1, 
        justifyContent: 'center', 
        alignItems: 'center', 
        backgroundColor: COLORS.white,
        padding: 20
      }}>
        <Text style={{ color: 'red', textAlign: 'center', marginBottom: 10 }}>
          Initialization Error
        </Text>
        <Text style={{ color: COLORS.primary.dark, textAlign: 'center', fontSize: 12 }}>
          {error.message}
        </Text>
      </View>
    );
  }

  // Show the app
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
          <StatusBar style="auto" />
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}