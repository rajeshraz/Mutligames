import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Image,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';
import { Audio } from 'expo-av';
// import { AdMobBanner, AdMobInterstitial } from 'expo-ads-admob';

const TOTAL_LEVELS = 30;

// const isAdMobAvailable = typeof AdMobBanner !== 'undefined' && typeof AdMobInterstitial !== 'undefined';
// const TEST_BANNER_ID = "ca-app-pub-3940256099942544/6300978111";
// const TEST_INTERSTITIAL_ID = "ca-app-pub-3940256099942544/1033173712";

const catTapSoundFile = require('../assets/sounds/cat-tap.mp3');
const winSoundFile = require('../assets/sounds/winning-sound.mp3');
const loseSoundFile = require('../assets/sounds/lose-sound.mp3');

export default function TouchCatGame({ route, navigation }) {
  const { level, mode, game } = route.params;

  // Set grid size based on mode
  let gridRows = 3;
  let gridCols = 3;
  if (mode === 'medium') { gridRows = 4; gridCols = 3; }
  if (mode === 'hard') { gridRows = 4; gridCols = 4; }

  // Responsive grid sizing
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;
  // Calculate max grid width/height (with padding)
  const maxGridWidth = Math.min(screenWidth, screenHeight * 0.7) * 0.95;
  const boxSize = Math.floor(maxGridWidth / Math.max(gridCols, gridRows));

  const [timeLeft, setTimeLeft] = useState(() => {
    if (level <= 10) return 20;
    if (level <= 20) return 30;
    return 35;
  });
  const [catPosition, setCatPosition] = useState(null);
  const [gameOver, setGameOver] = useState(false);
  const catMissed = useRef(false);
  const currentCatTapped = useRef(true);
  const [showWinAnim, setShowWinAnim] = useState(false);
  const [showLoseAnim, setShowLoseAnim] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);

  // Speed logic: levels 1-15 use current logic, 16-30 use speed of level 15
  const getCatChangeSpeed = () => {
    const effectiveLevel = level <= 15 ? level : 15;
    return Math.max(1000 - effectiveLevel * 20, 300);
  };
  const catChangeSpeed = getCatChangeSpeed();
  const totalCatsToShow = Math.floor((timeLeft * 1000) / catChangeSpeed);
  const catShownCount = useRef(0);

  const catTapSoundRef = useRef();
  const winSoundRef = useRef();
  const loseSoundRef = useRef();

  useEffect(() => {
    (async () => {
      try {
        const catTap = new Audio.Sound();
        await catTap.loadAsync(catTapSoundFile);
        catTapSoundRef.current = catTap;

        const winSound = new Audio.Sound();
        await winSound.loadAsync(winSoundFile);
        winSoundRef.current = winSound;

        const loseSound = new Audio.Sound();
        await loseSound.loadAsync(loseSoundFile);
        loseSoundRef.current = loseSound;
      } catch (e) {}
    })();
    return () => {
      if (catTapSoundRef.current) catTapSoundRef.current.unloadAsync();
      if (winSoundRef.current) winSoundRef.current.unloadAsync();
      if (loseSoundRef.current) loseSoundRef.current.unloadAsync();
    };
  }, []);

  useEffect(() => {
    let timerInterval = null;
    let catInterval = null;

    if (!gameOver) {
      timerInterval = setInterval(() => {
        setTimeLeft((t) => t - 1);
      }, 1000);

      catInterval = setInterval(() => {
        if (!currentCatTapped.current) {
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
          setCatPosition(Math.floor(Math.random() * (gridRows * gridCols)));
        }
      }, catChangeSpeed);
    }

    return () => {
      clearInterval(timerInterval);
      clearInterval(catInterval);
    };
  }, [gameOver, catChangeSpeed, gridRows, gridCols]);

  const playCatTapSound = async () => {
    try {
      if (catTapSoundRef.current) {
        await catTapSoundRef.current.playFromPositionAsync(0);
      }
    } catch (e) {}
  };

  const playWinSound = async () => {
    try {
      if (winSoundRef.current) {
        await winSoundRef.current.playFromPositionAsync(0);
      }
    } catch (e) {}
  };

  const playLoseSound = async () => {
    try {
      if (loseSoundRef.current) {
        await loseSoundRef.current.playFromPositionAsync(0);
      }
    } catch (e) {}
  };

  const handlePress = (index) => {
    if (index === catPosition && !gameOver) {
      playCatTapSound();
      setCatPosition(null);
      currentCatTapped.current = true;
    }
  };

  const unlockNextLevel = async () => {
    const progressKey = game ? `@${game.id}_${mode}_progress` : `@${mode}_progress`;
    const stored = await AsyncStorage.getItem(progressKey);
    const unlocked = stored ? parseInt(stored) : 1;

    if (unlocked === level && level < TOTAL_LEVELS) {
      await AsyncStorage.setItem(progressKey, (level + 1).toString());
    }

    // Only unlock the next mode if the user just completed level 30 by playing it
    if (level === TOTAL_LEVELS) {
      const nextMode = getNextMode(mode);
      if (nextMode !== mode) {
        const nextModeProgressKey = game ? `@${game.id}_${nextMode}_progress` : `@${nextMode}_progress`;
        await AsyncStorage.setItem(nextModeProgressKey, '1'); // Only unlock level 1 of next mode
      }
      // Mark this mode as completed
      const completedKey = game ? `@${game.id}_${mode}_completed` : `@${mode}_completed`;
      await AsyncStorage.setItem(completedKey, 'true');
    }
  };

  const getNextMode = (currentMode) => {
    const modes = ['easy', 'medium', 'hard'];
    const currentIndex = modes.indexOf(currentMode);
    return currentIndex < modes.length - 1 ? modes[currentIndex + 1] : currentMode;
  };

  const triggerGameOver = async (message) => {
    await playLoseSound();
    setShowLoseAnim(true);
    setGameOver(true);
    setTimeout(() => {
      setShowLoseAnim(false);
      setShowLoseModal(true);
    }, 2000);
  };

  const triggerWin = async () => {
    await playWinSound();
    setShowWinAnim(true);
    setGameOver(true);
    unlockNextLevel();
    setTimeout(() => {
      setShowWinAnim(false);
      setShowWinModal(true);
    }, 2000);
  };

  const renderGrid = () => {
    const buttons = [];
    for (let i = 0; i < gridRows * gridCols; i++) {
      const isCat = i === catPosition;
      buttons.push(
        <TouchableOpacity
          key={i}
          style={[styles.box, { width: boxSize, height: boxSize }]}
          onPress={() => handlePress(i)}
          activeOpacity={0.8}
        >
          {isCat ? (
            <Image
              source={require('../assets/images/cat.png')}
              style={[styles.catImage, { width: boxSize * 0.8, height: boxSize * 0.8 }]}
              resizeMode="contain"
            />
          ) : null}
        </TouchableOpacity>
      );
    }
    // Render as rows
    const rows = [];
    for (let r = 0; r < gridRows; r++) {
      rows.push(
        <View key={r} style={{ flexDirection: 'row' }}>
          {buttons.slice(r * gridCols, (r + 1) * gridCols)}
        </View>
      );
    }
    return <View style={[styles.grid, { width: boxSize * gridCols, height: boxSize * gridRows }]}>{rows}</View>;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.level}>Level {level}</Text>
      <Text style={styles.timer}>Time Left: {timeLeft}s</Text>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', width: '100%' }}>
        {renderGrid()}
        {showWinAnim && (
          <LottieView
            source={require('../assets/confetti.json')}
            autoPlay
            loop={false}
            style={styles.lottieOverlay}
          />
        )}
        {showLoseAnim && (
          <LottieView
            source={require('../assets/lose.json')}
            autoPlay
            loop={false}
            style={styles.lottieOverlay}
          />
        )}
      </View>
      {/* Win Modal */}
      <Modal
        visible={showWinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowWinModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.winModalBox}>
            <Text style={styles.winTitle}>🎉 You Win! 🎉</Text>
            {/* AdMob Banner commented out for debugging */}
            {/* {isAdMobAvailable && (
              <AdMobBanner
                bannerSize="fullBanner"
                adUnitID={TEST_BANNER_ID}
                servePersonalizedAds
                onDidFailToReceiveAdWithError={error => console.log(error)}
              />
            )} */}
            <Pressable
              style={styles.winButton}
              onPress={() => {
                setShowWinModal(false);
                navigation.replace('LevelSelect', { game, mode });
              }}
            >
              <Text style={styles.winButtonText}>Next Level</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      {/* Lose Modal */}
      <Modal
        visible={showLoseModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLoseModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.loseModalBox}>
            <Text style={styles.loseTitle}>😿 Missed the Cat!</Text>
            <Pressable
              style={styles.loseButton}
              onPress={() => {
                setShowLoseModal(false);
                navigation.replace('TouchCatGame', { level, mode, game });
              }}
            >
              <Text style={styles.loseButtonText}>Retry</Text>
            </Pressable>
            <Pressable
              style={[styles.loseButton, { backgroundColor: '#bbb' }]}
              onPress={() => {
                setShowLoseModal(false);
                navigation.replace('LevelSelect', { game, mode });
              }}
            >
              <Text style={styles.loseButtonText}>Back to Levels</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
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
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginVertical: 10,
  },
  box: {
    margin: 5,
    backgroundColor: '#87CEFA',
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },
  catImage: {
    // width and height set dynamically
  },
  lottieOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: '100%',
    height: '100%',
    zIndex: 10,
    pointerEvents: 'none',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winModalBox: {
    backgroundColor: 'rgba(255,255,255,0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#ffb300',
  },
  winTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ff9800',
    marginBottom: 20,
    textAlign: 'center',
  },
  winButton: {
    backgroundColor: '#ff9800',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
  },
  winButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loseModalBox: {
    backgroundColor: 'rgba(30,30,30,0.95)',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    borderWidth: 2,
    borderColor: '#e53935',
  },
  loseTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#e53935',
    marginBottom: 20,
    textAlign: 'center',
  },
  loseButton: {
    backgroundColor: '#e53935',
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 10,
    elevation: 2,
  },
  loseButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
}); 