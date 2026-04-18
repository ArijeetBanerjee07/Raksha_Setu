import AsyncStorage from '@react-native-async-storage/async-storage';

const SAVED_RECIPES_KEY = '@saved_recipes';

export const saveRecipe = async (recipe) => {
  try {
    const saved = await getSavedRecipes();
    const isAlreadySaved = saved.find(r => r.id === recipe.id);
    
    if (isAlreadySaved) {
      const updated = saved.filter(r => r.id !== recipe.id);
      await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updated));
      return false; // Unsaved
    } else {
      const updated = [...saved, recipe];
      await AsyncStorage.setItem(SAVED_RECIPES_KEY, JSON.stringify(updated));
      return true; // Saved
    }
  } catch (e) {
    console.error('Error saving recipe:', e);
    return false;
  }
};

export const getSavedRecipes = async () => {
  try {
    const jsonValue = await AsyncStorage.getItem(SAVED_RECIPES_KEY);
    return jsonValue != null ? JSON.parse(jsonValue) : [];
  } catch (e) {
    console.error('Error getting saved recipes:', e);
    return [];
  }
};

export const isRecipeSaved = async (id) => {
  const saved = await getSavedRecipes();
  return saved.some(r => r.id === id);
};
