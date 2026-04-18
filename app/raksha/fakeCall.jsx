import { View, StyleSheet } from 'react-native';
import FakeCallTab from '../../components/FakeCallTab';
import { useLocalSearchParams } from 'expo-router';

export default function FakeCallScreen() {
  const { auto } = useLocalSearchParams();
  
  return (
    <View style={styles.container}>
      <FakeCallTab autoStart={auto === 'true'} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
});

