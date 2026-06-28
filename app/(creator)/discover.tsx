import { View, Text, StyleSheet } from 'react-native';
import { creatorTheme, fonts } from '../../lib/theme';

const t = creatorTheme.colors;

export default function CreatorDiscover() {
  return (
    <View style={styles.container}>
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
});
