import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { FavoritesProvider } from './src/context/FavoritesContext';
import DetailScreen from './src/screens/DetailScreen';
import ListScreen from './src/screens/ListScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <FavoritesProvider>
        <NavigationContainer>
          <StatusBar style="dark" />
          <Stack.Navigator
            screenOptions={{
              headerStyle: { backgroundColor: '#FFFFFF' },
              headerTintColor: '#111827',
              headerTitleStyle: { fontWeight: '700' },
              contentStyle: { backgroundColor: '#F3F4F6' },
            }}
          >
            <Stack.Screen
              name="List"
              component={ListScreen}
              options={{ title: 'Crypto Watchlist' }}
            />
            <Stack.Screen
              name="Detail"
              component={DetailScreen}
              options={({ route }) => ({
                title: route.params?.coin?.name ?? 'Coin details',
              })}
            />
          </Stack.Navigator>
        </NavigationContainer>
      </FavoritesProvider>
    </SafeAreaProvider>
  );
}
