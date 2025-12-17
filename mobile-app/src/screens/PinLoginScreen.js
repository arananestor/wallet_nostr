import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import PinInput from '../components/PinInput';
import { verifyPin, isBiometricsEnabled } from '../utils/storage';

export default function PinLoginScreen({ navigation }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [showBiometricButton, setShowBiometricButton] = useState(false);
  
  useEffect(() => {
    checkBiometrics();
  }, []);
  
  const checkBiometrics = async () => {
    const enabled = await isBiometricsEnabled();
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    
    if (enabled && compatible && enrolled) {
      setShowBiometricButton(true);
      // Auto-trigger biométricos
      setTimeout(() => authenticateWithBiometrics(), 500);
    }
  };
  
  const authenticateWithBiometrics = async () => {
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Desbloquear app',
        fallbackLabel: 'Usar PIN',
        cancelLabel: 'Cancelar',
      });
      
      if (result.success) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        navigation.replace('Profile');
      }
    } catch (error) {
      console.error('Error biométrico:', error);
    }
  };
  
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
    <LinearGradient
      colors={['#6366F1', '#8B5CF6']}
      style={styles.container}
    >
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="lock-closed" size={48} color="#FFFFFF" />
        </View>
        
        <Text style={styles.title}>Ingresa tu PIN</Text>
        <Text style={styles.subtitle}>Para acceder a tu cuenta</Text>
        
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
        
        {showBiometricButton && (
          <TouchableOpacity 
            style={styles.biometricButton}
            onPress={authenticateWithBiometrics}
            activeOpacity={0.7}
          >
            <Ionicons name="finger-print" size={48} color="#FFFFFF" />
            <Text style={styles.biometricText}>Usar biométricos</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.forgotButton}
          onPress={handleForgotPin}
          activeOpacity={0.7}
        >
          <Text style={styles.forgotText}>¿Olvidaste tu PIN?</Text>
        </TouchableOpacity>
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
  biometricButton: {
    marginTop: 32,
    alignItems: 'center',
    padding: 16,
  },
  biometricText: {
    fontSize: 15,
    color: '#FFFFFF',
    marginTop: 8,
    fontWeight: '500',
  },
  forgotButton: {
    marginTop: 16,
    padding: 16,
  },
  forgotText: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    fontWeight: '500',
  },
});