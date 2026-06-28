import { Tabs } from 'expo-router';
import { brandTheme, brandColors, fonts } from '../../lib/theme';

const t = brandTheme.colors;

export default function BrandLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: t.surface,
          borderTopColor: t.border,
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: brandColors.primary,
        tabBarInactiveTintColor: t.textMuted,
        tabBarLabelStyle: { fontFamily: fonts.headline, fontSize: 11 },
      }}
    />
  );
}
