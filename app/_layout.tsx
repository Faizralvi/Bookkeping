import AsyncStorage from '@react-native-async-storage/async-storage';
import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'nativewind';
import { NativeWindStyleSheet } from "nativewind";
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/useColorScheme';
import { LanguageProvider } from './contexts/LanguageContext';
import { RoleProvider } from './contexts/RoleContext';

NativeWindStyleSheet.setOutput({
  default: "native",
});

// Simple auth context
const useProtectedRoute = () => {
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    const inAuthScreen = segments[0] === 'login' || segments[0] === 'register';

    AsyncStorage.getItem('@auth_token').then((token) => {
      if (!token && !inAuthScreen) {
        // Redirect to login if not authenticated
        router.replace('/login');
      } else if (token && inAuthScreen) {
        // Redirect to home if authenticated
        router.replace('/(tabs)');
      }
    });
  }, [segments]);
};

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [loaded] = useFonts({
    'Poppins-Regular': require('../assets/fonts/Poppins-Regular.ttf'),
    'Poppins-Medium': require('../assets/fonts/Poppins-Medium.ttf'),
    'Poppins-SemiBold': require('../assets/fonts/Poppins-SemiBold.ttf'),
    'Poppins-Bold': require('../assets/fonts/Poppins-Bold.ttf'),
  });

  useProtectedRoute();

  if (!loaded) {
    // Async font loading only occurs in development.
    return null;
  }

  return (
    <LanguageProvider>
      <RoleProvider>
        <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
          <Stack>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="register" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
          <StatusBar style="auto" />
        </ThemeProvider>
      </RoleProvider>
    </LanguageProvider>
  );
}
