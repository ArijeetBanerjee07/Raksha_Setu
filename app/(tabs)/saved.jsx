import { View, Text, StyleSheet, ScrollView, Image, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useCallback } from 'react';
import { useFocusEffect, router } from 'expo-router';
import { getSavedRecipes } from '../../services/savedRecipes';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function SavedScreen() {
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      loadSaved();
    }, [])
  );

  const loadSaved = async () => {
    setLoading(true);
    const data = await getSavedRecipes();
    setRecipes(data);
    setLoading(false);
  };

  const navigateToRecipe = (id) => {
    router.push({
      pathname: '/recipe/[id]',
      params: { id: id.toString() }
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Saved Recipes</Text>
        <Text style={styles.headerSubtitle}>{recipes.length} recipes in your collection</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#E8855A" />
        </View>
      ) : recipes.length === 0 ? (
        <View style={styles.center}>
          <Ionicons name="heart-outline" size={60} color="#E0E0E0" />
          <Text style={styles.emptyText}>No recipes saved yet.</Text>
          <Pressable style={styles.exploreBtn} onPress={() => router.push('/explore')}>
            <Text style={styles.exploreBtnText}>Explore Recipes</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.grid}>
            {recipes.map((recipe) => (
              <Pressable key={recipe.id} style={styles.card} onPress={() => navigateToRecipe(recipe.id)}>
                <Image source={typeof recipe.image === 'string' ? { uri: recipe.image } : recipe.image} style={styles.cardImage} />
                <View style={styles.cardContent}>
                  <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
                  <View style={styles.cardFooter}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="timer-outline" size={14} color="#E8855A" />
                      <Text style={styles.timeText}>{recipe.readyInMinutes}m</Text>
                    </View>
                    <Ionicons name="heart" size={18} color="#FF4B4B" />
                  </View>
                </View>
              </Pressable>
            ))}
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
    padding: 24,
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
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    marginTop: 20,
    fontSize: 18,
    color: '#999',
    textAlign: 'center',
  },
  exploreBtn: {
    marginTop: 24,
    backgroundColor: '#E8855A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  exploreBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 16,
  },
  scrollContent: {
    padding: 20,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#fff',
    borderRadius: 22,
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 10,
  },
  cardImage: {
    width: '100%',
    height: 120,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
    fontWeight: '600',
  },
});
