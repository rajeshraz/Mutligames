import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const GRID_SIZE = 3;
const TOTAL_LEVELS = 30;

export default function EasyGameScreen({ route, navigation }) {
  const { level } = route.params;
  const [timeLeft, setTimeLeft] = useState(() => {
    if (level <= 10) return 20;
    if (level <= 20) return 30;
    return 35;
  });
  const [catPosition, setCatPosition] = useState(null);
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const catMissed = useRef(false);
  const currentCatTapped = useRef(true);
  const latestScore = useRef(0); // ✅ Track live score for alert

  const catChangeSpeed = Math.max(1000 - level * 20, 300);
  const totalCatsToShow = Math.floor((timeLeft * 1000) / catChangeSpeed);
  const catShownCount = useRef(0);

  useEffect(() => {
    let timerInterval = null;
    let catInterval = null;

    if (!gameOver) {
      timerInterval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);

      catInterval = setInterval(() => {
        if (!currentCatTapped.current && route.params.mode === 'easy') {
          catMissed.current = true;
          clearInterval(catInterval);
          clearInterval(timerInterval);
          triggerGameOver('Missed the Cat!');
          return;
        }

        currentCatTapped.current = false;
        catShownCount.current++;

        if (catShownCount.current >= totalCatsToShow) {
          clearInterval(catInterval);
          clearInterval(timerInterval);
          triggerWin();
        } else {
          setCatPosition(Math.floor(Math.random() * (GRID_SIZE * GRID_SIZE)));
        }
      }, catChangeSpeed);
    }

    return () => {
      clearInterval(timerInterval);
      clearInterval(catInterval);
    };
  }, [gameOver]);

  const handlePress = (index) => {
    if (index === catPosition && !gameOver) {
      const newScore = score + 1;
      setScore(newScore);
      latestScore.current = newScore; // ✅ Update the latest score
      setCatPosition(null);
      currentCatTapped.current = true;
    }
  };

  const unlockNextLevel = async () => {
    const progressKey = '@easy_progress';
    const stored = await AsyncStorage.getItem(progressKey);
    const unlocked = stored ? parseInt(stored) : 1;

    if (unlocked === level && level < TOTAL_LEVELS) {
      await AsyncStorage.setItem(progressKey, (level + 1).toString());
    }

    if (level === TOTAL_LEVELS) {
      await AsyncStorage.setItem('@medium_mode_unlocked', 'true');
    }
  };

  const triggerGameOver = (message) => {
    setGameOver(true);
    Alert.alert(
      message,
      `You scored ${latestScore.current} points`,
      [
        {
          text: 'Back to Levels',
          onPress: () => navigation.replace('LevelSelect', { mode: 'easy' }),
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
          onPress: () => navigation.replace('LevelSelect', { mode: 'easy' }),
        },
      ],
      { cancelable: false }
    );
  };

  const renderGrid = () => {
    const buttons = [];

    for (let i = 0; i < GRID_SIZE * GRID_SIZE; i++) {
      const isCat = i === catPosition;
      buttons.push(
        <TouchableOpacity
          key={i}
          style={styles.box}
          onPress={() => handlePress(i)}
          activeOpacity={0.8}
        >
          {isCat ? (
            <Image
              source={require('../assets/images/cat.png')}
              style={styles.catImage}
              resizeMode="contain"
            />
          ) : null}
        </TouchableOpacity>
      );
    }

    return <View style={styles.grid}>{buttons}</View>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.level}>Level {level}</Text>
      <Text style={styles.timer}>Time Left: {timeLeft}s</Text>
      {renderGrid()}
      <Text style={styles.score}>Score: {score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0FFFF',
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
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    width: '90%',
    marginVertical: 30,
  },
  box: {
    width: 90,
    height: 90,
    margin: 8,
    backgroundColor: '#87CEFA', // ✅ Blue color restored
    borderRadius: 10, // ✅ Circular
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5, // Optional: adds shadow for Android
  },
  catImage: {
    width: 70,
    height: 70,
  },
  score: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
