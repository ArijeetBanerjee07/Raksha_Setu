import { View, Text, StyleSheet, Image, ScrollView, Pressable, ActivityIndicator, Dimensions } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useState, useEffect } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getRecipeDetails } from '../../services/spoonacular';
import { saveRecipe, isRecipeSaved } from '../../services/savedRecipes';

const { width } = Dimensions.get('window');

export default function RecipeDetail() {
  const { id } = useLocalSearchParams();
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadRecipe();
    checkSavedStatus();
  }, [id]);

  const loadRecipe = async () => {
    setLoading(true);
    const data = await getRecipeDetails(id);
    setRecipe(data);
    setLoading(false);
  };

  const checkSavedStatus = async () => {
    const status = await isRecipeSaved(id);
    setSaved(status);
  };

  const handleSave = async () => {
    const newStatus = await saveRecipe(recipe);
    setSaved(newStatus);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color="#E8855A" />
      </View>
    );
  }

  if (!recipe) {
    return (
      <View style={styles.loader}>
        <Text>Recipe not found</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageContainer}>
          <Image source={typeof recipe.image === 'string' ? { uri: recipe.image } : recipe.image} style={styles.image} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Ionicons name="chevron-back" size={24} color="#000" />
          </Pressable>
          <Pressable style={styles.saveButton} onPress={handleSave}>
            <Ionicons name={saved ? "heart" : "heart-outline"} size={24} color={saved ? "#FF4B4B" : "#000"} />
          </Pressable>
        </View>

        <View style={styles.content}>
          <Text style={styles.title}>{recipe.title}</Text>
          
          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="timer-outline" size={20} color="#E8855A" />
              <Text style={styles.statText}>{recipe.readyInMinutes} mins</Text>
            </View>
            <View style={styles.statItem}>
              <MaterialCommunityIcons name="account-group-outline" size={20} color="#E8855A" />
              <Text style={styles.statText}>{recipe.servings} portions</Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Ingredients</Text>
            {recipe.extendedIngredients?.map((ing, idx) => (
              <View key={idx} style={styles.ingredientRow}>
                <View style={styles.dot} />
                <Text style={styles.ingredientText}>{ing.original}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preparation</Text>
            <Text style={styles.instructions}>
              {recipe.instructions?.replace(/<[^>]*>?/gm, '') || 'Follow the standard preparation steps.'}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  loader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageContainer: {
    width: '100%',
    height: 350,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 20,
  },
  saveButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255,255,255,0.8)',
    padding: 10,
    borderRadius: 20,
  },
  content: {
    padding: 24,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    marginTop: -40,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1A1A',
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 30,
    backgroundColor: '#FBFBFC',
    padding: 15,
    borderRadius: 20,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 25,
  },
  statText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '600',
    color: '#636E72',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 15,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E8855A',
    marginRight: 12,
  },
  ingredientText: {
    fontSize: 16,
    color: '#2D3436',
    flex: 1,
  },
  instructions: {
    fontSize: 16,
    lineHeight: 26,
    color: '#2D3436',
    textAlign: 'justify',
  },
});
