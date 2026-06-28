import { Tabs } from 'expo-router';
import { creatorTheme, brandColors, fonts } from '../../lib/theme';

const t = creatorTheme.colors;

export default function CreatorLayout() {
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
