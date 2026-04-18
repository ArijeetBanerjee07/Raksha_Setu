import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function RakshaLayout() {
  return (
    <Tabs 
      screenOptions={{ 
        headerShown: false, 
        tabBarActiveTintColor: '#E8855A',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: '#1E293B',
          borderTopColor: '#334155',
          height: 65,
          paddingBottom: 10,
          paddingTop: 8
        }
      }}
    >
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Dashboard', 
          tabBarIcon: ({ color, size }) => <Ionicons name="grid" color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="map" 
        options={{ 
          title: 'Safe Map', 
          tabBarIcon: ({ color, size }) => <Ionicons name="map" color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="fakeCall" 
        options={{ 
          title: 'Fake Call', 
          tabBarIcon: ({ color, size }) => <Ionicons name="call" color={color} size={size} /> 
        }} 
      />
      <Tabs.Screen 
        name="chat" 
        options={{ 
          title: 'Chat', 
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbox" color={color} size={size} /> 
        }} 
      />
    </Tabs>
  );
}
