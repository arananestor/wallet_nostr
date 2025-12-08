import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import PinInput from '../components/PinInput';
import { verifyPin } from '../utils/storage';

export default function PinLoginScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  
  const handlePinChange = async (newPin) => {
    setPin(newPin);
    setError('');
    
    if (newPin.length === 6) {
      const isValid = await verifyPin(newPin);
      
      if (isValid) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('Profile');
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setError('PIN incorrecto');
        setPin('');
      }
    }
  };
  
  const handleForgotPin = () => {
    navigation.navigate('Restore');
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.emoji}>🔒</Text>
        
        <Text style={styles.title}>Ingresa tu PIN</Text>
        
        {error && (
          <Text style={styles.error}>{error}</Text>
        )}
        
        <PinInput
          pin={pin}
          onPinChange={handlePinChange}
          maxLength={6}
        />
        
        <TouchableOpacity 
          style={styles.forgotButton}
          onPress={handleForgotPin}
        >
          <Text style={styles.forgotText}>¿Olvidaste tu PIN?</Text>
        </TouchableOpacity>
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
    marginBottom: 50,
    color: '#333',
  },
  error: {
    fontSize: 14,
    color: '#FF4444',
    textAlign: 'center',
    marginBottom: 20,
  },
  forgotButton: {
    marginTop: 30,
    padding: 15,
  },
  forgotText: {
    fontSize: 14,
    color: '#F7931A',
    textAlign: 'center',
  },
});