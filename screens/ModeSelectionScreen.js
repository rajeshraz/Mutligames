import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useRoute } from '@react-navigation/native';

export default function ModeSelectionScreen({ navigation }) {
  const [unlockedModes, setUnlockedModes] = useState({ easy: true, medium: false, hard: false });
  const route = useRoute();
  const { game } = route.params;

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      // Check for completion keys
      const easyCompleted = await AsyncStorage.getItem(`@${game.id}_easy_completed`);
      const mediumCompleted = await AsyncStorage.getItem(`@${game.id}_medium_completed`);
      // Progress for showing if at least level 1 is unlocked
      const easyProgress = await AsyncStorage.getItem(`@${game.id}_easy_progress`);
      const mediumProgress = await AsyncStorage.getItem(`@${game.id}_medium_progress`);
      const hardProgress = await AsyncStorage.getItem(`@${game.id}_hard_progress`);

      setUnlockedModes({
        easy: true,
        medium: !!easyCompleted,
        hard: !!mediumCompleted,
      });
    } catch (error) {
      console.log('Error loading progress:', error);
    }
  };

  const handleModePress = (mode) => {
    if (!unlockedModes[mode]) {
      Alert.alert('Locked', `Complete ${mode === 'medium' ? 'Easy' : 'Medium'} mode first!`);
      return;
    }
    navigation.navigate('LevelSelect', { game, mode });
  };

  const getModeColor = (mode) => {
    const colors = {
      easy: '#4CAF50',
      medium: '#FF9800',
      hard: '#F44336'
    };
    return unlockedModes[mode] ? colors[mode] : '#ccc';
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{game.name}</Text>
      <Text style={styles.subtitle}>Select Difficulty</Text>

      <TouchableOpacity
        style={[styles.modeButton, { backgroundColor: getModeColor('easy') }]}
        onPress={() => handleModePress('easy')}
      >
        <Text style={styles.modeIcon}>🌱</Text>
        <Text style={styles.modeText}>Easy</Text>
        <Text style={styles.modeDescription}>30 levels</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modeButton, { backgroundColor: getModeColor('medium') }]}
        onPress={() => handleModePress('medium')}
      >
        <Text style={styles.modeIcon}>🔥</Text>
        <Text style={styles.modeText}>Medium</Text>
        <Text style={styles.modeDescription}>30 levels</Text>
        {!unlockedModes.medium && <Text style={styles.lockedText}>Complete Easy first</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.modeButton, { backgroundColor: getModeColor('hard') }]}
        onPress={() => handleModePress('hard')}
      >
        <Text style={styles.modeIcon}>💎</Text>
        <Text style={styles.modeText}>Hard</Text>
        <Text style={styles.modeDescription}>30 levels</Text>
        {!unlockedModes.hard && <Text style={styles.lockedText}>Complete Medium first</Text>}
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.replace('GameSelection')}
      >
        <Text style={styles.backButtonText}>← Back to Games</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 18,
    marginBottom: 40,
    color: '#666',
  },
  modeButton: {
    width: '80%',
    padding: 20,
    marginVertical: 10,
    borderRadius: 15,
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modeIcon: {
    fontSize: 30,
    marginBottom: 10,
  },
  modeText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 5,
  },
  modeDescription: {
    fontSize: 14,
    color: 'white',
    opacity: 0.9,
  },
  lockedText: {
    fontSize: 12,
    color: 'white',
    opacity: 0.7,
    marginTop: 5,
    fontStyle: 'italic',
  },
  backButton: {
    marginTop: 24,
    marginBottom: 24,
    paddingVertical: 14,
    paddingHorizontal: 32,
    backgroundColor: '#fff',
    borderRadius: 24,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 2,
    borderColor: '#4CAF50',
  },
  backButtonText: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
}); 