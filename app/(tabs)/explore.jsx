import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { getRandomRecipes } from '../../services/spoonacular';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');
const COLUMN_WIDTH = (width - 45) / 2;

export default function ExploreScreen() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadExploreRecipes();
  }, []);

  const loadExploreRecipes = async () => {
    setLoading(true);
    const data = await getRandomRecipes(24);
    setRecipes(data);
    setLoading(false);
  };

  const navigateToRecipe = (id) => {
    router.push({
      pathname: '/recipe/[id]',
      params: { id: id.toString() }
    });
  };

  const renderExploreItem = (recipe, index) => {
    const height = index % 3 === 0 ? 250 : 180;
    
    return (
      <Pressable key={recipe.id} style={[styles.exploreItem, { height }]} onPress={() => navigateToRecipe(recipe.id)}>
        <Image source={typeof recipe.image === 'string' ? { uri: recipe.image } : recipe.image} style={styles.image} />
        <View style={styles.overlay}>
          <Text style={styles.recipeTitle} numberOfLines={2}>{recipe.title}</Text>
          <View style={styles.actions}>
            <View style={styles.stat}>
              <Ionicons name="heart-outline" size={14} color="#fff" />
              <Text style={styles.statText}>{Math.floor(Math.random() * 500) + 100}</Text>
            </View>
            <Ionicons name="bookmark-outline" size={14} color="#fff" />
          </View>
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Explore</Text>
        <Text style={styles.headerSubtitle}>Discover new flavors from around the world</Text>
      </View>

      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator size="large" color="#E8855A" />
        </View>
      ) : (
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.masonryGrid}>
            <View style={styles.column}>
              {recipes.filter((_, i) => i % 2 === 0).map((recipe, i) => renderExploreItem(recipe, i))}
            </View>
            <View style={styles.column}>
              {recipes.filter((_, i) => i % 2 !== 0).map((recipe, i) => renderExploreItem(recipe, i))}
            </View>
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 4,
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 15,
  },
  masonryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  column: {
    width: COLUMN_WIDTH,
  },
  exploreItem: {
    width: '100%',
    borderRadius: 20,
    marginBottom: 15,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  overlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  recipeTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
  },
});
