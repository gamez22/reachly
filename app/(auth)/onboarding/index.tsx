import { useEffect } from 'react';
import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '../../../providers/AuthProvider';

export default function OnboardingIndex() {
  const { userType, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (userType === 'creator') {
      router.replace('/(auth)/onboarding-creator');
    } else if (userType === 'brand') {
      router.replace('/(auth)/onboarding-brand');
    }
  }, [userType, loading]);

  return <View style={{ flex: 1, backgroundColor: '#0D0614' }} />;
}
