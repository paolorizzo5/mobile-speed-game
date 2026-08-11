import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { RootStackParamList } from './src/navigation/types';
import HomeScreen from './src/screens/HomeScreen';
import Round1TargetsScreen from './src/screens/Round1TargetsScreen';
import Round2MatchScreen from './src/screens/Round2MatchScreen';
import Round3ScrollScreen from './src/screens/Round3ScrollScreen';
import ResultsScreen from './src/screens/ResultsScreen';
import { theme } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navigationTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: theme.bg,
    card: theme.bgAlt,
    text: theme.text,
    border: theme.border,
    primary: theme.primary,
  },
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer theme={navigationTheme}>
          <StatusBar style="light" />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="Round1" component={Round1TargetsScreen} />
            <Stack.Screen name="Round2" component={Round2MatchScreen} />
            <Stack.Screen name="Round3" component={Round3ScrollScreen} />
            <Stack.Screen name="Results" component={ResultsScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
