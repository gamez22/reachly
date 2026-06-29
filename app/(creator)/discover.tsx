import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { creatorTheme, fonts, spacing } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

const t = creatorTheme.colors;

export default function CreatorDiscover() {
  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.signOut} onPress={() => supabase.auth.signOut()}>
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
      <Text style={styles.text}>Creator Discover coming soon</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: t.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: { fontFamily: fonts.body, fontSize: 16, color: t.text },
  signOut: {
    position: 'absolute',
    top: 60,
    right: spacing.xxl,
  },
  signOutText: {
    fontFamily: fonts.body,
    fontSize: 14,
    color: t.textMuted,
  },
});
