import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const TOTAL_LEVELS = 30;

export default function PatternMatchGame({ route, navigation }) {
  const { level, mode, game } = route.params;
  const [timeLeft, setTimeLeft] = useState(() => {
    if (level <= 10) return 30;
    if (level <= 20) return 25;
    return 20;
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const latestScore = useRef(0);

  useEffect(() => {
    let timerInterval = null;

    if (!gameOver) {
      timerInterval = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerInterval);
            triggerGameOver('Time\'s up!');
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }

    return () => {
      clearInterval(timerInterval);
    };
  }, [gameOver]);

  const unlockNextLevel = async () => {
    const progressKey = game ? `@${game.id}_${mode}_progress` : `@${mode}_progress`;
    const stored = await AsyncStorage.getItem(progressKey);
    const unlocked = stored ? parseInt(stored) : 1;

    if (unlocked === level && level < TOTAL_LEVELS) {
      await AsyncStorage.setItem(progressKey, (level + 1).toString());
    }

    if (level === TOTAL_LEVELS) {
      const nextModeKey = game ? `@${game.id}_${getNextMode(mode)}_unlocked` : `@${getNextMode(mode)}_mode_unlocked`;
      await AsyncStorage.setItem(nextModeKey, 'true');
    }
  };

  const getNextMode = (currentMode) => {
    const modes = ['easy', 'medium', 'hard'];
    const currentIndex = modes.indexOf(currentMode);
    return currentIndex < modes.length - 1 ? modes[currentIndex + 1] : currentMode;
  };

  const triggerGameOver = (message) => {
    setGameOver(true);
    Alert.alert(
      message,
      `You scored ${latestScore.current} points`,
      [
        {
          text: 'Back to Levels',
          onPress: () => navigation.replace('LevelSelect', { game, mode }),
        },
      ],
      { cancelable: false }
    );
  };

  const triggerWin = () => {
    setGameOver(true);
    unlockNextLevel();
    Alert.alert(
      'You Win!',
      `You scored ${latestScore.current} points`,
      [
        {
          text: 'Back to Levels',
          onPress: () => navigation.replace('LevelSelect', { game, mode }),
        },
      ],
      { cancelable: false }
    );
  };

  const handleWin = () => {
    const newScore = score + 10;
    setScore(newScore);
    latestScore.current = newScore;
    triggerWin();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.level}>Pattern Match - Level {level}</Text>
      <Text style={styles.timer}>Time Left: {timeLeft}s</Text>
      <Text style={styles.mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)} Mode</Text>
      
      <View style={styles.gameArea}>
        <Text style={styles.placeholder}>Pattern Match Game</Text>
        <Text style={styles.placeholder}>Coming Soon!</Text>
        <TouchableOpacity style={styles.winButton} onPress={handleWin}>
          <Text style={styles.winButtonText}>Win Level (Test)</Text>
        </TouchableOpacity>
      </View>
      
      <Text style={styles.score}>Score: {score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ECEFF1',
    alignItems: 'center',
    paddingTop: 30,
  },
  level: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  timer: {
    fontSize: 18,
    marginBottom: 10,
  },
  mode: {
    fontSize: 16,
    marginBottom: 20,
    color: '#666',
  },
  gameArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  placeholder: {
    fontSize: 20,
    marginBottom: 10,
    color: '#666',
  },
  winButton: {
    backgroundColor: '#607D8B',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  winButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
}); 