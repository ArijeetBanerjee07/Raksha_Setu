import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function TabBarIcon({ emoji }) {
  return <Text style={{ fontSize: 24 }}>{emoji}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: '#E8855A' }}>
      <Tabs.Screen 
        name="index" 
        options={{ title: 'Home', tabBarIcon: () => <TabBarIcon emoji="🏠" /> }} 
      />
      <Tabs.Screen 
        name="saved" 
        options={{ title: 'Saved', tabBarIcon: () => <TabBarIcon emoji="❤️" /> }} 
      />
      <Tabs.Screen 
        name="explore" 
        options={{ title: 'Explore', tabBarIcon: () => <TabBarIcon emoji="🔍" /> }} 
      />
      <Tabs.Screen 
        name="profile" 
        options={{ title: 'Profile', tabBarIcon: () => <TabBarIcon emoji="👤" /> }} 
      />
    </Tabs>
  );
}
