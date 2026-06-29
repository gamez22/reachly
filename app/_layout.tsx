import { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import {
  useFonts,
  Archivo_300Light,
  Archivo_700Bold,
  Archivo_900Black,
} from '@expo-google-fonts/archivo';
import { AuthProvider, useAuth } from '../providers/AuthProvider';

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const { session, profile, userType, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    if (!session) {
      router.replace('/(auth)/welcome');
    } else if (!profile?.onboarding_completed) {
      router.replace('/(auth)/onboarding');
    } else if (userType === 'creator') {
      router.replace('/(creator)/discover');
    } else if (userType === 'brand') {
      router.replace('/(brand)/discover');
    }
  }, [session, profile, userType, loading]);

  if (loading) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(auth)" />
      <Stack.Screen name="(creator)" />
      <Stack.Screen name="(brand)" />
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Archivo-Light': Archivo_300Light,
    'Archivo-Bold': Archivo_700Bold,
    'Archivo-Black': Archivo_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AuthProvider>
        <RootNavigator />
      </AuthProvider>
    </GestureHandlerRootView>
  );
}
