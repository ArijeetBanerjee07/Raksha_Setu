import axios from 'axios';

const API_KEY = process.env.EXPO_PUBLIC_SPOONACULAR_API_KEY;
const BASE_URL = 'https://api.spoonacular.com/recipes';

const spoonacularClient = axios.create({
  baseURL: BASE_URL,
  params: {
    apiKey: API_KEY,
  },
});

// Mock data for our generated special recipes AND fallback when API limit is reached
const MOCK_RECIPES = {
  f1: {
    id: 'f1',
    title: 'Nano Banana Delight',
    image: require('../assets/recipes/nano_banana.png'),
    readyInMinutes: 15,
    servings: 2,
    summary: 'A delightful gourmet dessert made with miniature bananas and honey.',
    instructions: '1. Peel the miniature bananas. 2. Drizzle honey over them in a pan. 3. Sauté lightly for 2 mins. 4. Garnish with mint and edible flowers.',
    extendedIngredients: [
      { id: 1, original: '4 miniature bananas' },
      { id: 2, original: '2 tbsp Organic Honey' },
      { id: 3, original: 'Fresh Mint leaves' }
    ],
    spoonacularScore: 95
  },
  f2: {
    id: 'f2',
    title: 'Premium Palak Paneer',
    image: require('../assets/recipes/palak_paneer.png'),
    readyInMinutes: 40,
    servings: 4,
    summary: 'Classic Indian spinach gravy with fresh cottage cheese.',
    instructions: '1. Blanch spinach. 2. Grind into a fine paste. 3. Sauté onions and spices. 4. Add spinach paste and paneer cubes. 5. Simmer for 10 mins.',
    extendedIngredients: [
      { id: 4, original: '250g Fresh Paneer' },
      { id: 5, original: '500g Spinach' },
      { id: 6, original: 'Cream and Spices' }
    ],
    spoonacularScore: 92
  },
  f3: {
    id: 'f3',
    title: 'Royal Mutton Biryani',
    image: require('../assets/recipes/biryani.png'),
    readyInMinutes: 60,
    servings: 4,
    summary: 'A majestic royal biryani with long grain basmati rice and tender chunks of meat.',
    instructions: '1. Marinate meat in yogurt and spices. 2. Parboil basmati rice. 3. Layer rice and meat in a heavy pot. 4. Cook on low heat (Dum) for 45 mins.',
    extendedIngredients: [
      { id: 7, original: '500g Premium Basmati Rice' },
      { id: 8, original: '500g Lamb mutton' },
      { id: 9, original: 'Saffron and Fried Onions' }
    ],
    spoonacularScore: 98
  },
  'm1': {
    id: 'm1',
    title: 'Veggie Stir Fry',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=300&auto=format&fit=crop',
    readyInMinutes: 20,
    servings: 2,
    summary: 'A quick and healthy vegetable stir fry.',
    instructions: '1. Chop veggies. 2. Sauté in a wok. 3. Add soy sauce and ginger.',
    extendedIngredients: [{ id: 10, original: 'Mixed Vegetables' }],
    spoonacularScore: 88
  },
  'm2': {
    id: 'm2',
    title: 'Classic Margherita Pizza',
    image: 'https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?q=80&w=300&auto=format&fit=crop',
    readyInMinutes: 30,
    servings: 2,
    summary: 'Fresh basil, mozzarella, and tomato sauce.',
    instructions: '1. Roll dough. 2. Add toppings. 3. Bake at 250C.',
    extendedIngredients: [{ id: 11, original: 'Pizza Dough' }],
    spoonacularScore: 94
  },
  'm3': {
    id: 'm3',
    title: 'Avocado Toast',
    image: 'https://images.unsplash.com/photo-1525351484163-7529414344d8?q=80&w=300&auto=format&fit=crop',
    readyInMinutes: 10,
    servings: 1,
    summary: 'Creamy avocado on sourdough bread.',
    instructions: '1. Toast bread. 2. Mash avocado. 3. Season with salt and pepper.',
    extendedIngredients: [{ id: 12, original: 'Avocado' }],
    spoonacularScore: 91
  },
  'm4': {
    id: 'm4',
    title: 'Grilled Salmon',
    image: 'https://images.unsplash.com/photo-1467003909585-2f8a72700288?q=80&w=300&auto=format&fit=crop',
    readyInMinutes: 25,
    servings: 2,
    summary: 'Perfectly grilled salmon with lemon butter.',
    instructions: '1. Season salmon. 2. Grill both sides. 3. Drizzle lemon butter.',
    extendedIngredients: [{ id: 13, original: 'Salmon Fillet' }],
    spoonacularScore: 96
  },
  'm5': {
    id: 'm5',
    title: 'Butter Chicken',
    image: 'https://images.unsplash.com/photo-1603894584373-5ac82b2ae398?q=80&w=300&auto=format&fit=crop',
    readyInMinutes: 45,
    servings: 3,
    summary: 'Creamy and rich tomato-based chicken curry.',
    instructions: '1. Marinate chicken. 2. Cook in tandoor. 3. Sauté in tomato sauce.',
    extendedIngredients: [{ id: 14, original: 'Chicken' }],
    spoonacularScore: 97
  },
  'm6': {
    id: 'm6',
    title: 'Classic Caesar Salad',
    image: 'https://images.unsplash.com/photo-1550304943-4f24f54ddde9?q=80&w=300&auto=format&fit=crop',
    readyInMinutes: 15,
    servings: 2,
    summary: 'Fresh romaine lettuce with parmesan and croutons.',
    instructions: '1. Chop lettuce. 2. Toss with dressing. 3. Add croutons.',
    extendedIngredients: [{ id: 15, original: 'Romaine Lettuce' }],
    spoonacularScore: 89
  },
  'm7': {
    id: 'm7',
    title: 'Garlic Butter Shrimp',
    image: 'https://images.unsplash.com/photo-1551248429-40975aa4de74?q=80&w=300&auto=format&fit=crop',
    readyInMinutes: 15,
    servings: 2,
    summary: 'Juicy shrimp sautéed in garlic and butter.',
    instructions: '1. Peel shrimp. 2. Sauté with garlic. 3. Finish with parsley.',
    extendedIngredients: [{ id: 16, original: 'Tiger Shrimp' }],
    spoonacularScore: 95
  },
  'm8': {
    id: 'm8',
    title: 'Truffle Mushroom Pasta',
    image: 'https://images.unsplash.com/photo-1473093226795-af9932fe5856?q=80&w=300&auto=format&fit=crop',
    readyInMinutes: 30,
    servings: 2,
    summary: 'Earthy mushrooms and truffle oil pasta.',
    instructions: '1. Boil pasta. 2. Sauté mushrooms. 3. Add cream and truffle oil.',
    extendedIngredients: [{ id: 17, original: 'Penne Pasta' }],
    spoonacularScore: 93
  }
};

const FALLBACK_RECIPES = Object.values(MOCK_RECIPES);

export const searchRecipes = async (query) => {
  try {
    const response = await spoonacularClient.get('/complexSearch', {
      params: {
        query,
        addRecipeInformation: true,
        fillIngredients: true,
        number: 10,
      },
    });
    return response.data.results;
  } catch (error) {
    if (error.response && error.response.status === 402) {
      console.warn('Spoonacular API quota exceeded (402). Using local mock data fallback.');
      return FALLBACK_RECIPES.filter(r => 
        r.title.toLowerCase().includes(query.toLowerCase()) || 
        r.summary.toLowerCase().includes(query.toLowerCase())
      );
    }
    console.error('Error searching recipes:', error);
    return [];
  }
};

export const getRandomRecipes = async (number = 10) => {
  try {
    const response = await spoonacularClient.get('/random', {
      params: {
        number,
      },
    });
    return response.data.recipes;
  } catch (error) {
    if (error.response && error.response.status === 402) {
      console.warn('Spoonacular API quota exceeded (402). Using local mock data fallback.');
      return FALLBACK_RECIPES.slice(0, number);
    }
    console.error('Error fetching random recipes:', error);
    return [];
  }
};

export const getRecipeDetails = async (id) => {
  if (MOCK_RECIPES[id]) return MOCK_RECIPES[id];
  try {
    const response = await spoonacularClient.get(`/${id}/information`);
    return response.data;
  } catch (error) {
    if (error.response && error.response.status === 402) {
      console.warn('Spoonacular API quota exceeded (402). Returning fallback item.');
      return MOCK_RECIPES['f1']; // Generic fallback
    }
    console.error('Error fetching recipe details:', error);
    return null;
  }
};

