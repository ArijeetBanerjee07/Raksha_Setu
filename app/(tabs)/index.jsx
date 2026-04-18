import { View, Text, StyleSheet, Pressable, ScrollView, DeviceEventEmitter, TextInput, Image, ActivityIndicator, ImageBackground } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect } from 'react';
import { router } from 'expo-router';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { getRandomRecipes, searchRecipes } from '../../services/spoonacular';
import MonitoringToggle from '../../components/MonitoringToggle';
// Static featured images
const FEATURED = [
  { id: 'f1', title: 'Nano Banana Delight', image: require('../../assets/recipes/nano_banana.png'), time: '15m', rating: '4.9' },
  { id: 'f2', title: 'Premium Palak Paneer', image: require('../../assets/recipes/palak_paneer.png'), time: '40m', rating: '4.8' },
  { id: 'f3', title: 'Royal Mutton Biryani', image: require('../../assets/recipes/biryani.png'), time: '60m', rating: '5.0' },
];

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const [recommendations, setRecommendations] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    setLoading(true);
    const recipes = await getRandomRecipes(8);
    setRecommendations(recipes);
    setLoading(false);
  };

  const handleHeaderTap = () => DeviceEventEmitter.emit('HEADER_TAP');
  const handleHeaderPressIn = () => DeviceEventEmitter.emit('HEADER_HOLD_START');
  const handleHeaderPressOut = () => DeviceEventEmitter.emit('HEADER_HOLD_END');

  const handleSearchChange = async (text) => {
    setSearchQuery(text);
    if (text.trim().toLowerCase() === 'raksha') {
      setSearchQuery('');
      router.push('/raksha');
      return;
    }

    if (text.trim().toLowerCase() === 'call') {
      setSearchQuery('');
      router.push({
        pathname: '/raksha/fakeCall',
        params: { auto: 'true' }
      });
      return;
    }

    if (text.length > 2) {
      setIsSearching(true);
      const results = await searchRecipes(text);
      setSearchResults(results);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  };

  const navigateToRecipe = (id) => {
    router.push({
      pathname: '/recipe/[id]',
      params: { id: id.toString() }
    });
  };

  const renderRecipeCard = (recipe) => (
    <Pressable key={recipe.id} style={styles.card} onPress={() => navigateToRecipe(recipe.id)}>
      <Image source={typeof recipe.image === 'string' ? { uri: recipe.image } : recipe.image} style={styles.cardImage} />
      <View style={styles.cardContent}>
        <Text style={styles.recipeTitle} numberOfLines={1}>{recipe.title}</Text>
        <View style={styles.cardFooter}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="timer-outline" size={14} color="#E8855A" />
            <Text style={styles.timeText}>{recipe.readyInMinutes || '30'}m</Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="star" size={14} color="#FFD700" />
            <Text style={styles.ratingText}>{(recipe.spoonacularScore / 20 || 4.5).toFixed(1)}</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );

  return (
    <SafeAreaView style={styles.container}>
      <Pressable
        style={styles.header}
        onPress={handleHeaderTap}
        onPressIn={handleHeaderPressIn}
        onPressOut={handleHeaderPressOut}
      >
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>Dish It Up</Text>
          {/* <MonitoringToggle /> */}
          <Pressable style={styles.profileCircle} onPress={() => router.push('/profile')}>
            <Ionicons name="person-circle-outline" size={40} color="#E8855A" />
          </Pressable>
        </View>
        <View style={styles.searchBarWrapper}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search for amazing recipes..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearchChange}
          />
        </View>
      </Pressable>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="large" color="#E8855A" style={{ marginTop: 50 }} />
        ) : isSearching ? (
          <View>
            <Text style={styles.sectionTitle}>Search Results</Text>
            <View style={styles.grid}>
              {searchResults.length > 0 ? searchResults.map(renderRecipeCard) : (
                <Text style={styles.noResults}>No recipes found for "{searchQuery}"</Text>
              )}
            </View>
          </View>
        ) : (
          <>
            <View style={styles.featuredHeader}>
              <MaterialCommunityIcons name="trophy-outline" size={20} color="#E8855A" />
              <Text style={styles.sectionTitle}>Today's Specials</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.featuredList}>
              {FEATURED.map((item) => (
                <Pressable key={item.id} style={styles.featuredCard} onPress={() => navigateToRecipe(item.id)}>
                  <Image source={item.image} style={styles.featuredImg} />
                  <View style={styles.featuredOverlay}>
                    <Text style={styles.featuredTitle}>{item.title}</Text>
                    <View style={styles.featuredDetails}>
                      <View style={styles.infoRow}>
                        <MaterialCommunityIcons name="timer-outline" size={12} color="#fff" />
                        <Text style={styles.featuredDetailText}>{item.time}</Text>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="star" size={12} color="#FFD700" />
                        <Text style={styles.featuredDetailText}>{item.rating}</Text>
                      </View>
                    </View>
                  </View>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.sectionHeader}>
              <Ionicons name="flame" size={20} color="#FF4500" />
              <Text style={styles.sectionTitle}>Recommended for You</Text>
            </View>
            <View style={styles.grid}>
              {recommendations.map(renderRecipeCard)}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFBFC',
  },
  header: {
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 25,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '900',
    color: '#1A1A1A',
    letterSpacing: -1,
  },
  profileCircle: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F3F5',
    paddingHorizontal: 15,
    paddingVertical: 14,
    borderRadius: 18,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    color: '#333',
    fontSize: 16,
    fontWeight: '500',
  },
  scrollContent: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    marginTop: 10,
  },
  featuredHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1A1A1A',
    marginLeft: 8,
  },
  featuredList: {
    marginBottom: 30,
    marginHorizontal: -20,
    paddingLeft: 20,
  },
  featuredCard: {
    width: 300,
    height: 200,
    marginRight: 15,
    borderRadius: 25,
    overflow: 'hidden',
    backgroundColor: '#E0E0E0',
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
  },
  featuredImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  featuredOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 15,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  featuredTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
  },
  featuredDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featuredDetailText: {
    color: '#fff',
    fontSize: 12,
    marginLeft: 4,
    fontWeight: '600',
    marginRight: 12,
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
    shadowOpacity: 0.08,
    shadowRadius: 10,
  },
  cardImage: {
    width: '100%',
    height: 140,
    resizeMode: 'cover',
  },
  cardContent: {
    padding: 12,
  },
  recipeTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#2D3436',
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
    color: '#636E72',
    marginLeft: 4,
    fontWeight: '600',
  },
  ratingText: {
    fontSize: 12,
    color: '#636E72',
    marginLeft: 4,
    fontWeight: '700',
  },
  noResults: {
    width: '100%',
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#666',
  },
});
