import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';



export default function HomeScreen({ navigation }) {
  const isEasyCompleted = false; // Update this logic later with AsyncStorage or context

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🐱 Touch the Cat</Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('LevelSelect', { mode: 'easy' })}>
        <Text style={styles.buttonText}>Easy</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !isEasyCompleted && styles.locked]}
        onPress={() =>
          isEasyCompleted
            ? navigation.navigate('LevelSelect', { mode: 'medium' })
            : Alert.alert('Locked', 'Complete Easy levels first!')
        }
      >
        <Text style={styles.buttonText}>Medium</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, !isEasyCompleted && styles.locked]}
        onPress={() =>
          isEasyCompleted
            ? navigation.navigate('LevelSelect', { mode: 'hard' })
            : Alert.alert('Locked', 'Complete Easy levels first!')
        }
      >
        <Text style={styles.buttonText}>Hard</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffe0f0',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    marginBottom: 60,
    color: '#c71585',
  },
  button: {
    width: '80%',
    backgroundColor: '#ff69b4',
    padding: 16,
    marginVertical: 10,
    borderRadius: 12,
    alignItems: 'center',
  },
  locked: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    fontSize: 20,
    color: '#fff',
    fontWeight: '600',
  },
});
