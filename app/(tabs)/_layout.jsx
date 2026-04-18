import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ 
      headerShown: false, 
      tabBarActiveTintColor: '#E8855A',
      tabBarInactiveTintColor: '#94A3B8'
    }}>
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home', 
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="saved" 
        options={{ 
          title: 'Saved', 
          tabBarIcon: ({ color, size }) => <Ionicons name="heart" color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ 
          title: 'Explore', 
          tabBarIcon: ({ color, size }) => <Ionicons name="search" color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ 
          title: 'Profile', 
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} /> 
        }} 
      />
    </Tabs>
  );
}
