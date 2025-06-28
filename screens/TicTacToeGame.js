import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Dimensions,
  Modal,
  Pressable,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Audio } from 'expo-av';

const TOTAL_LEVELS = 30;

const catTapSoundFile = require('../assets/sounds/cat-tap.mp3');
const winSoundFile = require('../assets/sounds/winning-sound.mp3');
const loseSoundFile = require('../assets/sounds/lose-sound.mp3');
const drawSoundFile = require('../assets/sounds/draw-sound.mp3');

// Get board size based on mode
function getBoardSize(mode) {
  switch (mode) {
    case 'easy': return 3;
    case 'medium': return 4;
    case 'hard': return 4;
    default: return 3;
  }
}

// Get board dimensions based on mode
function getBoardDimensions(mode) {
  switch (mode) {
    case 'easy': return { rows: 3, cols: 3 };
    case 'medium': return { rows: 4, cols: 3 };
    case 'hard': return { rows: 4, cols: 4 };
    default: return { rows: 3, cols: 3 };
  }
}

function checkWinner(board, mode) {
  const { rows, cols } = getBoardDimensions(mode);
  const totalCells = rows * cols;
  
  // Check rows
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col <= cols - 3; col++) {
      const idx1 = row * cols + col;
      const idx2 = row * cols + col + 1;
      const idx3 = row * cols + col + 2;
      if (board[idx1] && board[idx1] === board[idx2] && board[idx1] === board[idx3]) {
        return board[idx1];
      }
    }
  }
  
  // Check columns
  for (let col = 0; col < cols; col++) {
    for (let row = 0; row <= rows - 3; row++) {
      const idx1 = row * cols + col;
      const idx2 = (row + 1) * cols + col;
      const idx3 = (row + 2) * cols + col;
      if (board[idx1] && board[idx1] === board[idx2] && board[idx1] === board[idx3]) {
        return board[idx1];
      }
    }
  }
  
  // Check diagonals (only for square boards)
  if (rows === cols) {
    // Main diagonal
    for (let i = 0; i <= rows - 3; i++) {
      const idx1 = i * cols + i;
      const idx2 = (i + 1) * cols + (i + 1);
      const idx3 = (i + 2) * cols + (i + 2);
      if (board[idx1] && board[idx1] === board[idx2] && board[idx1] === board[idx3]) {
        return board[idx1];
      }
    }
    
    // Anti-diagonal
    for (let i = 0; i <= rows - 3; i++) {
      const idx1 = i * cols + (cols - 1 - i);
      const idx2 = (i + 1) * cols + (cols - 1 - (i + 1));
      const idx3 = (i + 2) * cols + (cols - 1 - (i + 2));
      if (board[idx1] && board[idx1] === board[idx2] && board[idx1] === board[idx3]) {
        return board[idx1];
      }
    }
  }
  
  // Check for draw
  if (board.every(cell => cell)) return 'draw';
  return null;
}

function getAvailableMoves(board) {
  return board.map((cell, idx) => cell ? null : idx).filter(idx => idx !== null);
}

function getAttemptsKey(game, mode, level) {
  return game ? `@${game.id}_${mode}_tic_attempts_${level}` : `@${mode}_tic_attempts_${level}`;
}

async function getAttempts(game, mode, level) {
  const key = getAttemptsKey(game, mode, level);
  const stored = await AsyncStorage.getItem(key);
  return stored ? parseInt(stored) : 0;
}

async function incrementAttempts(game, mode, level) {
  const key = getAttemptsKey(game, mode, level);
  const attempts = await getAttempts(game, mode, level);
  await AsyncStorage.setItem(key, (attempts + 1).toString());
}

function aiMove(board, level, allowMistake, mode) {
  const moves = getAvailableMoves(board);
  const { rows, cols } = getBoardDimensions(mode);
  const totalCells = rows * cols;
  
  // Calculate AI difficulty based on level and board size
  const baseDifficulty = level;
  const boardComplexity = totalCells / 9; // 9 is the base 3x3 size
  const aiDifficulty = Math.floor(baseDifficulty * boardComplexity);
  
  // 1. Easy Mode (3x3) - Original logic
  if (mode === 'easy') {
    if (level <= 5) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    if (level <= 15) {
      for (let move of moves) {
        const newBoard = [...board];
        newBoard[move] = 'X';
        if (checkWinner(newBoard, mode) === 'X') {
          newBoard[move] = 'O';
          return newBoard;
        }
      }
      const move = moves[Math.floor(Math.random() * moves.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    if (level <= 25) {
      if (Math.random() < 0.2) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const newBoard = [...board];
        newBoard[move] = 'O';
        return newBoard;
      }
      return smartAIMove(board, mode);
    }
    if (allowMistake) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    return smartAIMove(board, mode);
  }
  
  // 2. Medium Mode (4x3) - Enhanced AI
  if (mode === 'medium') {
    if (aiDifficulty <= 8) {
      // Random with some blocking
      if (Math.random() < 0.3) {
        for (let move of moves) {
          const newBoard = [...board];
          newBoard[move] = 'X';
          if (checkWinner(newBoard, mode) === 'X') {
            newBoard[move] = 'O';
            return newBoard;
          }
        }
      }
      const move = moves[Math.floor(Math.random() * moves.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    if (aiDifficulty <= 16) {
      // Smart blocking and some winning moves
      if (Math.random() < 0.7) {
        for (let move of moves) {
          const newBoard = [...board];
          newBoard[move] = 'O';
          if (checkWinner(newBoard, mode) === 'O') return newBoard;
        }
        for (let move of moves) {
          const newBoard = [...board];
          newBoard[move] = 'X';
          if (checkWinner(newBoard, mode) === 'X') {
            newBoard[move] = 'O';
            return newBoard;
          }
        }
      }
      const move = moves[Math.floor(Math.random() * moves.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    if (aiDifficulty <= 24) {
      // Very smart with occasional mistakes
      if (Math.random() < 0.15) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const newBoard = [...board];
        newBoard[move] = 'O';
        return newBoard;
      }
      return advancedAIMove(board, mode);
    }
    // Perfect AI with mistake allowance
    if (allowMistake && Math.random() < 0.3) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    return advancedAIMove(board, mode);
  }
  
  // 3. Hard Mode (4x4) - Expert AI
  if (mode === 'hard') {
    if (aiDifficulty <= 12) {
      // Smart blocking and some strategy
      if (Math.random() < 0.5) {
        for (let move of moves) {
          const newBoard = [...board];
          newBoard[move] = 'O';
          if (checkWinner(newBoard, mode) === 'O') return newBoard;
        }
        for (let move of moves) {
          const newBoard = [...board];
          newBoard[move] = 'X';
          if (checkWinner(newBoard, mode) === 'X') {
            newBoard[move] = 'O';
            return newBoard;
          }
        }
      }
      const move = moves[Math.floor(Math.random() * moves.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    if (aiDifficulty <= 20) {
      // Advanced strategy with some mistakes
      if (Math.random() < 0.2) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const newBoard = [...board];
        newBoard[move] = 'O';
        return newBoard;
      }
      return expertAIMove(board, mode);
    }
    if (aiDifficulty <= 28) {
      // Expert with occasional mistakes
      if (Math.random() < 0.1) {
        const move = moves[Math.floor(Math.random() * moves.length)];
        const newBoard = [...board];
        newBoard[move] = 'O';
        return newBoard;
      }
      return expertAIMove(board, mode);
    }
    // Perfect AI with mistake allowance
    if (allowMistake && Math.random() < 0.25) {
      const move = moves[Math.floor(Math.random() * moves.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    return expertAIMove(board, mode);
  }
  
  // Fallback
  const move = moves[Math.floor(Math.random() * moves.length)];
  const newBoard = [...board];
  newBoard[move] = 'O';
  return newBoard;
}

function smartAIMove(board, mode) {
  const moves = getAvailableMoves(board);
  const { rows, cols } = getBoardDimensions(mode);
  
  // Win if possible
  for (let move of moves) {
    const newBoard = [...board];
    newBoard[move] = 'O';
    if (checkWinner(newBoard, mode) === 'O') return newBoard;
  }
  // Block user win
  for (let move of moves) {
    const newBoard = [...board];
    newBoard[move] = 'X';
    if (checkWinner(newBoard, mode) === 'X') {
      newBoard[move] = 'O';
      return newBoard;
    }
  }
  // Take center (for square boards)
  if (rows === cols) {
    const center = Math.floor(rows / 2) * cols + Math.floor(cols / 2);
    if (!board[center]) {
      const newBoard = [...board];
      newBoard[center] = 'O';
      return newBoard;
    }
  }
  // Take a corner (for square boards)
  if (rows === cols) {
    const corners = [0, cols-1, (rows-1)*cols, (rows-1)*cols + (cols-1)].filter(i => !board[i]);
    if (corners.length > 0) {
      const move = corners[Math.floor(Math.random() * corners.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
  }
  // Take any side (for square boards)
  if (rows === cols) {
    const sides = [];
    for (let i = 1; i < cols-1; i++) sides.push(i); // top
    for (let i = 1; i < rows-1; i++) sides.push(i*cols); // left
    for (let i = 1; i < rows-1; i++) sides.push(i*cols + cols-1); // right
    for (let i = 1; i < cols-1; i++) sides.push((rows-1)*cols + i); // bottom
    const availableSides = sides.filter(i => !board[i]);
    if (availableSides.length > 0) {
      const move = availableSides[Math.floor(Math.random() * availableSides.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
  }
  // Fallback: random
  const move = moves[Math.floor(Math.random() * moves.length)];
  const newBoard = [...board];
  newBoard[move] = 'O';
  return newBoard;
}

function advancedAIMove(board, mode) {
  const moves = getAvailableMoves(board);
  const { rows, cols } = getBoardDimensions(mode);
  
  // Win if possible
  for (let move of moves) {
    const newBoard = [...board];
    newBoard[move] = 'O';
    if (checkWinner(newBoard, mode) === 'O') return newBoard;
  }
  // Block user win
  for (let move of moves) {
    const newBoard = [...board];
    newBoard[move] = 'X';
    if (checkWinner(newBoard, mode) === 'X') {
      newBoard[move] = 'O';
      return newBoard;
    }
  }
  
  // Strategic moves for 4x3
  if (mode === 'medium') {
    // Prefer center positions
    const centerPositions = [cols + 1, cols + 2, 2*cols + 1, 2*cols + 2];
    const availableCenters = centerPositions.filter(i => !board[i]);
    if (availableCenters.length > 0) {
      const move = availableCenters[Math.floor(Math.random() * availableCenters.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    
    // Prefer edge positions
    const edgePositions = [];
    for (let i = 0; i < cols; i++) edgePositions.push(i); // top row
    for (let i = 0; i < cols; i++) edgePositions.push((rows-1)*cols + i); // bottom row
    for (let i = 1; i < rows-1; i++) edgePositions.push(i*cols); // left column
    for (let i = 1; i < rows-1; i++) edgePositions.push(i*cols + cols-1); // right column
    const availableEdges = edgePositions.filter(i => !board[i]);
    if (availableEdges.length > 0) {
      const move = availableEdges[Math.floor(Math.random() * availableEdges.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
  }
  
  // Fallback: random
  const move = moves[Math.floor(Math.random() * moves.length)];
  const newBoard = [...board];
  newBoard[move] = 'O';
  return newBoard;
}

function expertAIMove(board, mode) {
  const moves = getAvailableMoves(board);
  const { rows, cols } = getBoardDimensions(mode);
  
  // Win if possible
  for (let move of moves) {
    const newBoard = [...board];
    newBoard[move] = 'O';
    if (checkWinner(newBoard, mode) === 'O') return newBoard;
  }
  // Block user win
  for (let move of moves) {
    const newBoard = [...board];
    newBoard[move] = 'X';
    if (checkWinner(newBoard, mode) === 'X') {
      newBoard[move] = 'O';
      return newBoard;
    }
  }
  
  // Strategic moves for 4x4
  if (mode === 'hard') {
    // Prefer center positions
    const centerPositions = [5, 6, 9, 10];
    const availableCenters = centerPositions.filter(i => !board[i]);
    if (availableCenters.length > 0) {
      const move = availableCenters[Math.floor(Math.random() * availableCenters.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    
    // Prefer corner positions
    const corners = [0, 3, 12, 15];
    const availableCorners = corners.filter(i => !board[i]);
    if (availableCorners.length > 0) {
      const move = availableCorners[Math.floor(Math.random() * availableCorners.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
    
    // Prefer edge positions
    const edges = [1, 2, 4, 7, 8, 11, 13, 14];
    const availableEdges = edges.filter(i => !board[i]);
    if (availableEdges.length > 0) {
      const move = availableEdges[Math.floor(Math.random() * availableEdges.length)];
      const newBoard = [...board];
      newBoard[move] = 'O';
      return newBoard;
    }
  }
  
  // Fallback: random
  const move = moves[Math.floor(Math.random() * moves.length)];
  const newBoard = [...board];
  newBoard[move] = 'O';
  return newBoard;
}

export default function TicTacToeGame({ route, navigation }) {
  const { level, mode, game } = route.params;
  const { rows, cols } = getBoardDimensions(mode);
  const totalCells = rows * cols;
  
  const [timeLeft, setTimeLeft] = useState(() => {
    if (level <= 10) return 30;
    if (level <= 20) return 25;
    return 20;
  });
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [board, setBoard] = useState(Array(totalCells).fill(null));
  const [isUserTurn, setIsUserTurn] = useState(true);
  const [result, setResult] = useState(null);
  const [allowMistake, setAllowMistake] = useState(false);
  const [showWinModal, setShowWinModal] = useState(false);
  const [showLoseModal, setShowLoseModal] = useState(false);
  const [showDrawModal, setShowDrawModal] = useState(false);
  const [showTimeUpModal, setShowTimeUpModal] = useState(false);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [completionMessage, setCompletionMessage] = useState('');
  const [completionTitle, setCompletionTitle] = useState('');
  const latestScore = useRef(0);
  const catTapSoundRef = useRef();
  const winSoundRef = useRef();
  const loseSoundRef = useRef();
  const drawSoundRef = useRef();

  const handleTimeUp = async () => {
    setGameOver(true);
    await playLoseSound();
    incrementAttempts(game, mode, level);
    setTimeout(() => {
      setShowTimeUpModal(true);
    }, 400);
  };

  useEffect(() => {
    let timerInterval = null;
    if (!gameOver) {
      timerInterval = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerInterval);
            handleTimeUp();
            return 0;
          }
          return t - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timerInterval);
  }, [gameOver]);

  useEffect(() => {
    if (!isUserTurn && !gameOver) {
      const aiTimeout = setTimeout(() => {
        setBoard(prevBoard => aiMove(prevBoard, level, allowMistake, mode));
        setIsUserTurn(true);
      }, 400);
      return () => clearTimeout(aiTimeout);
    }
  }, [isUserTurn, board, gameOver, level, allowMistake, mode]);

  const handleDraw = async () => {
    incrementAttempts(game, mode, level);
    console.log('Playing draw sound...');
    playDrawSound();
    setTimeout(() => {
      setShowDrawModal(true);
    }, 400);
  };

  useEffect(() => {
    const winner = checkWinner(board, mode);
    if (winner && !gameOver) {
      setGameOver(true);
      setResult(winner);
      if (winner === 'X') {
        unlockNextLevel();
        playWinSound();
        setTimeout(() => {
          if (level === TOTAL_LEVELS) {
            if (mode === 'hard') {
              setCompletionTitle('🎉 Hurray! 🎉');
              setCompletionMessage('You have completed all levels. Explore more games!');
              setShowCompletionModal(true);
            } else if (mode === 'medium') {
              setCompletionTitle('🎉 Congratulations! 🎉');
              setCompletionMessage('You unlocked Hard mode!');
              setShowCompletionModal(true);
            } else if (mode === 'easy') {
              setCompletionTitle('🎉 Congratulations! 🎉');
              setCompletionMessage('You unlocked Medium mode!');
              setShowCompletionModal(true);
            }
          } else {
            setShowWinModal(true);
          }
        }, 400);
      } else if (winner === 'O') {
        incrementAttempts(game, mode, level);
        playLoseSound();
        setTimeout(() => {
          setShowLoseModal(true);
        }, 400);
      } else if (winner === 'draw') {
        handleDraw();
      }
    }
  }, [board, gameOver]);

  useEffect(() => {
    // Check if user has failed this level 3+ times (for very hard levels)
    if (level > 25) {
      getAttempts(game, mode, level).then(attempts => {
        setAllowMistake(attempts >= 3);
      });
    }
  }, [level, game, mode]);

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
        const drawSound = new Audio.Sound();
        await drawSound.loadAsync(drawSoundFile);
        drawSoundRef.current = drawSound;
      } catch (e) {}
    })();
    return () => {
      if (catTapSoundRef.current) catTapSoundRef.current.unloadAsync();
      if (winSoundRef.current) winSoundRef.current.unloadAsync();
      if (loseSoundRef.current) loseSoundRef.current.unloadAsync();
      if (drawSoundRef.current) drawSoundRef.current.unloadAsync();
    };
  }, []);

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
  const playDrawSound = async () => {
    try {
      if (drawSoundRef.current) {
        await drawSoundRef.current.playFromPositionAsync(0);
      }
    } catch (e) {}
  };

  const unlockNextLevel = async () => {
    const progressKey = game ? `@${game.id}_${mode}_progress` : `@${mode}_progress`;
    const stored = await AsyncStorage.getItem(progressKey);
    const unlocked = stored ? parseInt(stored) : 1;
    if (unlocked === level && level < TOTAL_LEVELS) {
      await AsyncStorage.setItem(progressKey, (level + 1).toString());
    }
    if (level === TOTAL_LEVELS) {
      const nextMode = getNextMode(mode);
      if (nextMode !== mode) {
        const nextModeProgressKey = game ? `@${game.id}_${nextMode}_progress` : `@${nextMode}_progress`;
        await AsyncStorage.setItem(nextModeProgressKey, '1');
      }
      // Mark this mode as completed (for mode unlock screen)
      const completedKey = game ? `@${game.id}_${mode}_completed` : `@${mode}_completed`;
      await AsyncStorage.setItem(completedKey, 'true');
    }
  };

  const getNextMode = (currentMode) => {
    const modes = ['easy', 'medium', 'hard'];
    const currentIndex = modes.indexOf(currentMode);
    return currentIndex < modes.length - 1 ? modes[currentIndex + 1] : currentMode;
  };

  const handleCellPress = (idx) => {
    if (!isUserTurn || gameOver || board[idx]) return;
    playCatTapSound();
    const newBoard = [...board];
    newBoard[idx] = 'X';
    setBoard(newBoard);
    setIsUserTurn(false);
  };

  // Responsive board size
  const screenWidth = Dimensions.get('window').width;
  const boardSize = Math.min(screenWidth * 0.9, 330);
  const cellSize = boardSize / cols; // Use cols for consistent cell width
  const cellTextSize = Math.max(20, Math.min(32, cellSize * 0.4));

  return (
    <View style={styles.container}>
      <Text style={styles.level}>Tic Tac Toe - Level {level}</Text>
      <Text style={styles.timer}>Time Left: {timeLeft}s</Text>
      <Text style={styles.mode}>{mode.charAt(0).toUpperCase() + mode.slice(1)} Mode ({rows}x{cols})</Text>
      <View style={[
        styles.board, 
        { 
          width: boardSize, 
          height: cellSize * rows,
          borderRadius: 16,
          borderWidth: 2,
          borderColor: '#2563eb',
        }
      ]}> 
        {Array.from({ length: rows }, (_, row) => (
          <View key={row} style={styles.row}>
            {Array.from({ length: cols }, (_, col) => {
              const idx = row * cols + col;
              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.cell,
                    {
                      width: cellSize - 4,
                      height: cellSize - 4,
                      margin: 2,
                      borderRightWidth: col < cols - 1 ? 2 : 0,
                      borderBottomWidth: row < rows - 1 ? 2 : 0,
                    },
                  ]}
                  onPress={() => handleCellPress(idx)}
                  activeOpacity={board[idx] || gameOver || !isUserTurn ? 1 : 0.7}
                  disabled={!!board[idx] || gameOver || !isUserTurn}
                >
                  <Text style={[
                    styles.cellText, 
                    { fontSize: cellTextSize },
                    board[idx] === 'X' && { color: '#2563eb' }, 
                    board[idx] === 'O' && { color: '#e4572e' }
                  ]}>{board[idx]}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
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
            <Text style={styles.winMessage}>You beat the AI!</Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => {
                  setShowWinModal(false);
                  navigation.replace('LevelSelect', { game, mode });
                }}
              >
                <Text style={styles.secondaryButtonText}>Back to Levels</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowWinModal(false);
                  navigation.replace('TicTacToeGame', { level: level + 1, mode, game });
                }}
              >
                <Text style={styles.primaryButtonText}>Next Level</Text>
              </Pressable>
            </View>
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
            <Text style={styles.loseTitle}>😿 You Lose!</Text>
            <Text style={styles.loseMessage}>AI wins this round. Try again!</Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => {
                  setShowLoseModal(false);
                  navigation.replace('LevelSelect', { game, mode });
                }}
              >
                <Text style={styles.secondaryButtonText}>Back to Levels</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowLoseModal(false);
                  navigation.replace('TicTacToeGame', { level, mode, game });
                }}
              >
                <Text style={styles.primaryButtonText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Draw Modal */}
      <Modal
        visible={showDrawModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDrawModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.drawModalBox}>
            <Text style={styles.drawTitle}>🤝 Draw!</Text>
            <Text style={styles.drawMessage}>No one wins. Try again!</Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => {
                  setShowDrawModal(false);
                  navigation.replace('LevelSelect', { game, mode });
                }}
              >
                <Text style={styles.secondaryButtonText}>Back to Levels</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowDrawModal(false);
                  navigation.replace('TicTacToeGame', { level, mode, game });
                }}
              >
                <Text style={styles.primaryButtonText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Time Up Modal */}
      <Modal
        visible={showTimeUpModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowTimeUpModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.timeUpModalBox}>
            <Text style={styles.timeUpTitle}>⏰ Time's up!</Text>
            <Text style={styles.timeUpMessage}>You ran out of time. Try again!</Text>
            <View style={styles.buttonContainer}>
              <Pressable
                style={[styles.modalButton, styles.secondaryButton]}
                onPress={() => {
                  setShowTimeUpModal(false);
                  navigation.replace('LevelSelect', { game, mode });
                }}
              >
                <Text style={styles.secondaryButtonText}>Back to Levels</Text>
              </Pressable>
              <Pressable
                style={[styles.modalButton, styles.primaryButton]}
                onPress={() => {
                  setShowTimeUpModal(false);
                  navigation.replace('TicTacToeGame', { level, mode, game });
                }}
              >
                <Text style={styles.primaryButtonText}>Retry</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Completion Modal */}
      <Modal
        visible={showCompletionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowCompletionModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.completionModalBox}>
            <Text style={styles.completionTitle}>{completionTitle}</Text>
            <Text style={styles.completionMessage}>{completionMessage}</Text>
            <Pressable
              style={[styles.modalButton, styles.primaryButton]}
              onPress={() => {
                setShowCompletionModal(false);
                navigation.replace('LevelSelect', { game, mode });
              }}
            >
              <Text style={styles.primaryButtonText}>Back to Levels</Text>
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
    backgroundColor: '#E8F5E8',
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
  board: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#fff',
    alignSelf: 'center',
    marginBottom: 30,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 6,
  },
  cell: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f0ff',
    borderColor: '#2563eb',
  },
  cellText: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  winModalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0,
    maxWidth: 320,
    minWidth: 280,
  },
  loseModalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0,
    maxWidth: 320,
    minWidth: 280,
  },
  drawModalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0,
    maxWidth: 320,
    minWidth: 280,
  },
  timeUpModalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0,
    maxWidth: 320,
    minWidth: 280,
  },
  completionModalBox: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
    borderWidth: 0,
    maxWidth: 320,
    minWidth: 280,
  },
  winTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'center',
  },
  loseTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#D32F2F',
    marginBottom: 12,
    textAlign: 'center',
  },
  drawTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#F57C00',
    marginBottom: 12,
    textAlign: 'center',
  },
  timeUpTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#D84315',
    marginBottom: 12,
    textAlign: 'center',
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 12,
    textAlign: 'center',
  },
  winMessage: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  loseMessage: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  drawMessage: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  timeUpMessage: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  completionMessage: {
    fontSize: 16,
    color: '#757575',
    marginBottom: 28,
    textAlign: 'center',
    fontWeight: '400',
    lineHeight: 22,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 16,
  },
  modalButton: {
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    minWidth: 100,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    borderWidth: 0,
  },
  secondaryButton: {
    backgroundColor: '#757575',
    borderWidth: 0,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
  secondaryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '500',
    textAlign: 'center',
  },
}); 