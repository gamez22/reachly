import { View, ActivityIndicator } from 'react-native';

export default function Index() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0D0614', justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color="#4E00BF" />
    </View>
  );
}
