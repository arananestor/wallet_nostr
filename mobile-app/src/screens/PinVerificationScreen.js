import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
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
    <LinearGradient
      colors={['#6366F1', '#8B5CF6']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="shield-checkmark" size={48} color="#FFFFFF" />
        </View>
        
        <Text style={styles.title}>Verifica tu identidad</Text>
        <Text style={styles.subtitle}>Ingresa tu PIN para continuar</Text>
        
        {error && (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color="#FEE2E2" />
            <Text style={styles.error}>{error}</Text>
          </View>
        )}
        
        <PinInput
          pin={pin}
          onPinChange={handlePinChange}
          maxLength={6}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 40,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 24,
    gap: 8,
  },
  error: {
    fontSize: 14,
    color: '#FEE2E2',
    fontWeight: '500',
  },
});