import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { getNostrKeys, getUserProfile, isPinEnabled } from '../utils/storage';

export default function WelcomeScreen({ navigation }) {
  const [checking, setChecking] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  useEffect(() => {
    checkExistingUser();
  }, []);
  
  const checkExistingUser = async () => {
    try {
      const keys = await getNostrKeys();
      const profile = await getUserProfile();
      const pinEnabled = await isPinEnabled();
      
      if (keys && profile) {
        if (pinEnabled) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'PinLogin' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Profile' }],
          });
        }
        return;
      }
      
      setChecking(false);
      setShowWelcome(true);
    } catch (error) {
      setChecking(false);
      setShowWelcome(true);
    }
  };
  
  if (checking) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingEmoji}>💰</Text>
        <ActivityIndicator size="large" color="#F7931A" style={styles.loader} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </View>
    );
  }
  
  if (!showWelcome) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>💰</Text>
      <Text style={styles.title}>Recibe donaciones en Bitcoin</Text>
      <Text style={styles.subtitle}>
        Crea tu código QR y comienza a recibir sats hoy mismo
      </Text>
      
      <TouchableOpacity 
        style={styles.button}
        onPress={() => navigation.navigate('Register')}
      >
        <Text style={styles.buttonText}>Crear cuenta</Text>
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.secondaryButton}
        onPress={() => navigation.navigate('Restore')}
      >
        <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  loader: {
    marginBottom: 15,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 40,
    paddingHorizontal: 20,
  },
  button: {
    backgroundColor: '#F7931A',
    paddingVertical: 15,
    paddingHorizontal: 60,
    borderRadius: 10,
    marginBottom: 15,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 15,
    paddingHorizontal: 60,
  },
  secondaryButtonText: {
    color: '#F7931A',
    fontSize: 16,
    fontWeight: '600',
  },
});