import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';

const games = [
  { id: 1, name: 'Touch the Cat', icon: '🐱', color: '#FF69B4' },
  { id: 2, name: 'Tic Tac Toe', icon: '⭕', color: '#4CAF50' },
  { id: 3, name: 'Memory Match', icon: '🧠', color: '#2196F3' },
  { id: 4, name: 'Color Tap', icon: '🎨', color: '#FF9800' },
  { id: 5, name: 'Number Puzzle', icon: '🔢', color: '#9C27B0' },
  { id: 6, name: 'Word Search', icon: '📝', color: '#795548' },
  { id: 7, name: 'Speed Tap', icon: '⚡', color: '#F44336' },
  { id: 8, name: 'Pattern Match', icon: '🔶', color: '#607D8B' },
];

export default function GameSelectionScreen({ navigation }) {
  const handleGamePress = (game) => {
    navigation.navigate('ModeSelection', { game });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>🎮 Mini Games Collection</Text>
      <Text style={styles.subtitle}>Choose your game!</Text>
      
      <View style={styles.gamesGrid}>
        {games.map((game) => (
          <TouchableOpacity
            key={game.id}
            style={[styles.gameBox, { backgroundColor: game.color }]}
            onPress={() => handleGamePress(game)}
          >
            <Text style={styles.gameIcon}>{game.icon}</Text>
            <Text style={styles.gameName}>{game.name}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 40,
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 30,
    color: '#666',
  },
  gamesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
  },
  gameBox: {
    width: '48%',
    aspectRatio: 1,
    marginBottom: 20,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  gameIcon: {
    fontSize: 40,
    marginBottom: 10,
  },
  gameName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 5,
  },
}); 