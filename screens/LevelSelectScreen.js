import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  Dimensions,
  Platform,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const TOTAL_LEVELS = 30;

export default function LevelSelectScreen() {
  const [unlockedLevels, setUnlockedLevels] = useState(1);
  const navigation = useNavigation();
  const route = useRoute();

  const { game, mode } = route.params || {};
  const MODE_KEY = game ? `${game.id}_${mode}` : mode || 'easy';

  useEffect(() => {
    const loadProgress = async () => {
      const stored = await AsyncStorage.getItem(`@${MODE_KEY}_progress`);
      if (stored) {
        setUnlockedLevels(parseInt(stored));
      }
    };
    const unsubscribe = navigation.addListener('focus', loadProgress);
    return unsubscribe;
  }, [navigation, MODE_KEY]);

  const handleLevelPress = (level) => {
    if (level > unlockedLevels) {
      Alert.alert('Locked', 'Complete previous levels to unlock this one!');
      return;
    }
    
    // Navigate to the appropriate game screen based on game ID
    const gameScreenName = getGameScreenName(game?.id);
    navigation.navigate(gameScreenName, { level, mode, game });
  };

  const getGameScreenName = (gameId) => {
    const gameScreens = {
      1: 'TouchCatGame', // Touch the Cat
      2: 'TicTacToeGame', // Tic Tac Toe
      3: 'MemoryMatchGame', // Memory Match
      4: 'ColorTapGame', // Color Tap
      5: 'NumberPuzzleGame', // Number Puzzle
      6: 'WordSearchGame', // Word Search
      7: 'SpeedTapGame', // Speed Tap
      8: 'PatternMatchGame', // Pattern Match
    };
    return gameScreens[gameId] || 'TouchCatGame';
  };

  const renderItem = ({ item }) => {
    const isUnlocked = item <= unlockedLevels;
    return (
      <TouchableOpacity
        style={[
          styles.levelButton,
          isUnlocked ? styles.levelButtonUnlocked : styles.levelButtonLocked,
        ]}
        onPress={() => handleLevelPress(item)}
        disabled={!isUnlocked}
        activeOpacity={isUnlocked ? 0.7 : 1}
      >
        <Text style={[styles.levelText, !isUnlocked && styles.levelTextLocked]}>{item}</Text>
        {!isUnlocked && (
          <View style={styles.lockOverlay}>
            <View style={styles.lockCircle}>
              <Ionicons name="lock-closed" size={22} color="#fff" style={{ opacity: 0.85 }} />
            </View>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const levels = Array.from({ length: TOTAL_LEVELS }, (_, i) => i + 1);

  return (
    <View style={styles.container}>
      {/* Gradient background */}
      <View style={styles.gradientBg} pointerEvents="none" />
      <Text style={styles.title}>
        {game ? `${game.name} - ${mode.charAt(0).toUpperCase() + mode.slice(1)}` : `${mode.charAt(0).toUpperCase() + mode.slice(1)} Levels`}
      </Text>
      <View style={styles.levelGridCard}>
        <FlatList
          data={levels}
          renderItem={renderItem}
          keyExtractor={(item) => item.toString()}
          numColumns={5}
          contentContainerStyle={styles.levelGrid}
        />
      </View>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.replace('ModeSelection', { game })}
      >
        <Text style={styles.backButtonText}>← Back to Modes</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    justifyContent: 'flex-start',
  },
  gradientBg: {
    ...StyleSheet.absoluteFillObject,
    zIndex: -1,
    backgroundColor: 'linear-gradient(135deg, #f0fff0 0%, #e0eafc 100%)',
    // fallback for React Native: use a soft color
    background: Platform.OS === 'web' ? 'linear-gradient(135deg, #f0fff0 0%, #e0eafc 100%)' : undefined,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 28,
    marginTop: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
    color: '#2563eb',
    letterSpacing: 1.2,
    textShadowColor: 'rgba(44, 62, 80, 0.18)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 12,
    elevation: 2,
    backgroundColor: 'transparent',
  },
  levelGrid: {
    alignItems: 'center',
    paddingBottom: 20,
    paddingTop: 10,
    paddingHorizontal: 8,
  },
  levelGridCard: {
    backgroundColor: '#f8fafc',
    borderRadius: 28,
    paddingVertical: 20,
    paddingHorizontal: 10,
    marginBottom: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 12,
    elevation: 5,
    width: Math.min(Dimensions.get('window').width - 32, 370),
    alignSelf: 'center',
    borderWidth: 1.5,
    borderColor: '#e0eafc',
  },
  levelButton: {
    width: 52,
    height: 52,
    margin: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 2,
  },
  levelButtonUnlocked: {
    backgroundColor: '#3CB371',
    borderColor: '#2e8b57',
    transform: [{ scale: 1 }],
  },
  levelButtonLocked: {
    backgroundColor: '#bbb',
    borderColor: '#888',
    opacity: 0.7,
    transform: [{ scale: 1 }],
  },
  levelText: {
    fontSize: 18,
    color: 'white',
    fontWeight: 'bold',
    textShadowColor: 'rgba(0,0,0,0.2)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  levelTextLocked: {
    color: '#eee',
    opacity: 0.7,
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(44,44,44,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButton: {
    marginTop: 16,
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
    borderColor: '#3CB371',
  },
  backButtonText: {
    color: '#3CB371',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
});
