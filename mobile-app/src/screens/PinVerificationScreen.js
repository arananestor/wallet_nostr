import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import PinInput from '../components/PinInput';
import { verifyPin } from '../utils/storage';

export default function PinVerificationScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  const handlePinChange = async (newPin) => {
    setPin(newPin);
    setError('');
    
    if (newPin.length === 6) {
      const isValid = await verifyPin(newPin);
      
      if (isValid) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.goBack();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('PIN incorrecto');
        setPin('');
      }
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔒</Text>
        
        <Text style={styles.title}>Verifica tu identidad</Text>
        
        <Text style={styles.subtitle}>
          Ingresa tu PIN para continuar
        </Text>
        
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
        
        <PinInput
          pin={pin}
          onPinChange={handlePinChange}
          maxLength={6}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  emoji: {
    fontSize: 60,
    textAlign: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    color: '#666',
    marginBottom: 50,
  },
  error: {
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
});