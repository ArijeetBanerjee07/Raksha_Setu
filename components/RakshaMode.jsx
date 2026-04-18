import { View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useEffect, useRef } from 'react';

export default function RakshaMode({ onCancel }) {
  const scale = useRef(new Animated.Value(1)).current;
  const lastTapRef = useRef(0);

  const handlePress = () => {
    const now = Date.now();
    // If the gap between two taps is less than 350ms, intercept as a Double Tap!
    if (now - lastTapRef.current < 350) {
      if (onCancel) onCancel();
    }
    lastTapRef.current = now;
  };

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.4,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [scale]);

  return (
    <Pressable style={styles.container} onPress={handlePress}>
      <Animated.View style={[styles.circle, { transform: [{ scale }] }]} />
      <Text style={styles.title}>Raksha Initiated</Text>
      <Text style={styles.subtitle}>Protection Active</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#DC2626',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circle: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  title: {
    color: '#fff',
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 10,
    zIndex: 1,
  },
  subtitle: {
    color: '#fff',
    fontSize: 18,
    opacity: 0.8,
    zIndex: 1,
  },
});
