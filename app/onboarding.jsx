import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity, Animated, SafeAreaView, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';

const { width, height } = Dimensions.get('window');

const SLIDES = [
  {
    id: '1',
    title: "Welcome to Daily Recipes",
    description: "Discover thousands of quick, easy, and delicious recipes. Plan your meals and enjoy cooking!\n\nBut wait... there's a secret. 🤫",
    icon: "restaurant-outline",
    color: "#E8855A"
  },
  {
    id: '2',
    title: "The Raksha Secret",
    description: "Daily Recipes is actually Raksha, a stealth safety application designed to protect you without drawing attention.",
    icon: "shield-checkmark-outline",
    color: "#4A90E2"
  },
  {
    id: '3',
    title: "Volume SOS Trigger",
    description: "In an emergency, simply press and hold the Volume Down button for 4 seconds to secretly trigger an SOS.",
    icon: "hardware-chip-outline",
    color: "#E45757"
  },
  {
    id: '4',
    title: "The Target: Raksha",
    description: "Type 'raksha' into the recipe search bar to drop the facade and unlock the hidden safety map.",
    icon: "map-outline",
    color: "#50E3C2"
  },
  {
    id: '5',
    title: "Digital Assistant",
    description: "Need legal advice or safety tips? Access our secure AI Chatbot for instant assistance.",
    icon: "chatbubbles-outline",
    color: "#9013FE"
  },
  {
    id: '6',
    title: "Simulated Call",
    description: "Trigger a realistic fake incoming call directly from the dashboard to escape uncomfortable situations.",
    icon: "call-outline",
    color: "#F5A623"
  }
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef(null);
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setIsInitializing(false);
    });
    return () => unsubscribe();
  }, []);

  const completeOnboarding = () => {
    if (isInitializing) return; // Safety check
    if (user) {
      router.replace('/(tabs)');
    } else {
      router.replace('/signup');
    }
  };

  const nextSlide = () => {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    } else {
      completeOnboarding();
    }
  };

  const skipOnboarding = () => {
    completeOnboarding();
  };

  const renderItem = ({ item }) => {
    return (
      <View style={[styles.slide, { width }]}>
        <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
          <Ionicons name={item.icon} size={110} color={item.color} />
        </View>
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.description}>{item.description}</Text>
      </View>
    );
  };

  const Paginator = () => {
    return (
      <View style={styles.paginatorContainer}>
        {SLIDES.map((_, i) => {
          const inputRange = [(i - 1) * width, i * width, (i + 1) * width];
          const dotWidth = scrollX.interpolate({
            inputRange,
            outputRange: [10, 24, 10],
            extrapolate: 'clamp'
          });
          const opacity = scrollX.interpolate({
            inputRange,
            outputRange: [0.3, 1, 0.3],
            extrapolate: 'clamp'
          });
          return (
            <Animated.View 
              key={i.toString()} 
              style={[styles.dot, { width: dotWidth, opacity }]} 
            />
          );
        })}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity style={styles.skipButton} onPress={skipOnboarding}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>
      
      <Animated.FlatList 
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderItem}
        horizontal
        showsHorizontalScrollIndicator={false}
        pagingEnabled
        bounces={false}
        keyExtractor={(item) => item.id}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />
      
      <Paginator />
      
      <View style={styles.footer}>
        <TouchableOpacity style={styles.nextButton} onPress={nextSlide}>
          <Text style={styles.nextButtonText}>
            {currentIndex === SLIDES.length - 1 ? "Get Started" : "Next"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAF7F5',
  },
  skipButton: {
    alignSelf: 'flex-end',
    padding: 20,
    marginTop: 10,
    zIndex: 10,
  },
  skipText: {
    color: '#888',
    fontSize: 16,
    fontWeight: '600',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 40,
  },
  iconContainer: {
    width: 200,
    height: 200,
    borderRadius: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  description: {
    fontSize: 18,
    color: '#666',
    textAlign: 'center',
    lineHeight: 28,
  },
  paginatorContainer: {
    flexDirection: 'row',
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dot: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8855A',
    marginHorizontal: 8,
  },
  footer: {
    paddingHorizontal: 30,
    paddingBottom: 40,
    paddingTop: 10,
  },
  nextButton: {
    backgroundColor: '#E8855A',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#E8855A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  nextButtonText: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: '700',
  }
});
