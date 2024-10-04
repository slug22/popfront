import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import BarsClubsScreen from './screens/BarsClubsScreen';
import VenueScreen from './screens/VenueScreen';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen 
          name="BarsClubs" 
          component={BarsClubsScreen} 
          options={{ headerShown: false }}
        />
        <Stack.Screen 
          name="Venue" 
          component={VenueScreen}
          options={({ route }) => ({ title: `Venue ${route.params.id}` })}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}