import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import GameSelectionScreen from './screens/GameSelectionScreen';
import ModeSelectionScreen from './screens/ModeSelectionScreen';
import LevelSelectScreen from './screens/LevelSelectScreen';
import TouchCatGame from './screens/TouchCatGame';
import TicTacToeGame from './screens/TicTacToeGame';
import MemoryMatchGame from './screens/MemoryMatchGame';
import ColorTapGame from './screens/ColorTapGame';
import NumberPuzzleGame from './screens/NumberPuzzleGame';
import WordSearchGame from './screens/WordSearchGame';
import SpeedTapGame from './screens/SpeedTapGame';
import PatternMatchGame from './screens/PatternMatchGame';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="GameSelection" screenOptions={{ headerShown: false }}>
        <Stack.Screen name="GameSelection" component={GameSelectionScreen} />
        <Stack.Screen name="ModeSelection" component={ModeSelectionScreen} />
        <Stack.Screen name="LevelSelect" component={LevelSelectScreen} />
        
        {/* Game Screens */}
        <Stack.Screen name="TouchCatGame" component={TouchCatGame} />
        <Stack.Screen name="TicTacToeGame" component={TicTacToeGame} />
        <Stack.Screen name="MemoryMatchGame" component={MemoryMatchGame} />
        <Stack.Screen name="ColorTapGame" component={ColorTapGame} />
        <Stack.Screen name="NumberPuzzleGame" component={NumberPuzzleGame} />
        <Stack.Screen name="WordSearchGame" component={WordSearchGame} />
        <Stack.Screen name="SpeedTapGame" component={SpeedTapGame} />
        <Stack.Screen name="PatternMatchGame" component={PatternMatchGame} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
