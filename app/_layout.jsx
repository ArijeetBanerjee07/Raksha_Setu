import { Stack } from 'expo-router';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { View, Animated, Dimensions } from 'react-native';
import { useEffect, useRef } from 'react';
import RakshaMode from '../components/RakshaMode';
import useVolumeHoldTrigger from '../hooks/useVolumeHoldTrigger';

export default function RootLayout() {
  const { isRakshaMode, isHolding } = useVolumeHoldTrigger();
  const progressAnim = useRef(new Animated.Value(0)).current;
  const { width } = Dimensions.get('window');

  useEffect(() => {
    if (isHolding) {
      Animated.timing(progressAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: false,
      }).start();
    } else {
      progressAnim.stopAnimation();
      progressAnim.setValue(0);
    }
  }, [isHolding]);

  if (isRakshaMode) {
    return (
      <SafeAreaProvider>
        <RakshaMode />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <View style={{ flex: 1 }}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
        </Stack>
        {isHolding && (
          <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, backgroundColor: 'transparent' }}>
            <Animated.View 
              style={{ 
                height: '100%', 
                backgroundColor: '#DC2626', 
                width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: [0, width] }) 
              }} 
            />
          </View>
        )}
      </View>
    </SafeAreaProvider>
  );
}
