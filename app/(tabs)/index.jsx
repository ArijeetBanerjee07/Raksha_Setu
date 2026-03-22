import { View, Text, StyleSheet, Pressable, ScrollView, DeviceEventEmitter } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recipes } from '../../constants/recipes';

export default function Home() {
  const handleHeaderTap = () => {
    DeviceEventEmitter.emit('HEADER_TAP');
  };

  const handleHeaderPressIn = () => {
    DeviceEventEmitter.emit('HEADER_HOLD_START');
  };

  const handleHeaderPressOut = () => {
    DeviceEventEmitter.emit('HEADER_HOLD_END');
  };

  return (
    <SafeAreaView style={styles.container}>
      <Pressable 
        style={styles.header}
        onPress={handleHeaderTap}
        onPressIn={handleHeaderPressIn}
        onPressOut={handleHeaderPressOut}
      >
        <Text style={styles.headerTitle}>What's cooking today? 🍳</Text>
        <View style={styles.searchBar}>
          <Text style={styles.searchText}>🔍 Search recipes...</Text>
        </View>
      </Pressable>

      <ScrollView contentContainerStyle={styles.grid}>
        {recipes.map((recipe) => (
          <View key={recipe.id} style={styles.card}>
            <Text style={styles.emoji}>{recipe.emoji}</Text>
            <Text style={styles.recipeTitle}>{recipe.title}</Text>
            <Text style={styles.time}>⏱️ {recipe.time}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    backgroundColor: '#E8855A',
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  searchBar: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    opacity: 0.9,
  },
  searchText: {
    color: '#666',
  },
  grid: {
    padding: 15,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#f9f9f9',
    padding: 15,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 10,
  },
  recipeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 5,
  },
  time: {
    fontSize: 12,
    color: '#888',
  },
});
