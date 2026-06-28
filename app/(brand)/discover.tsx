import { View, Text, StyleSheet } from 'react-native';
import { brandTheme, fonts } from '../../lib/theme';

const t = brandTheme.colors;

export default function BrandDiscover() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Brand Discover coming soon</Text>
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
