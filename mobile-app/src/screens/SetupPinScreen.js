import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as LocalAuthentication from 'expo-local-authentication';
import Header from '../components/Header';
import PinInput from '../components/PinInput';
import { savePinHash, setBiometricsEnabled } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export default function SetupPinScreen({ route, navigation }) {
  const { onComplete } = route.params || {};
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [enableBiometrics, setEnableBiometrics] = useState(false);
  const [showBiometricsOption, setShowBiometricsOption] = useState(false);
  
  const { showToast } = useToast();
  
  useEffect(() => {
    checkBiometrics();
  }, []);
  
  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricsAvailable(compatible && enrolled);
  };
  
  const handlePinChange = async (newPin) => {
    if (step === 1) {
      setPin(newPin);
      
      if (newPin.length === 6) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          setStep(2);
        }, 300);
      }
    } else if (step === 2) {
      setConfirmPin(newPin);
      
      if (newPin.length === 6) {
        if (newPin === pin) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          if (biometricsAvailable) {
            setStep(3);
            setShowBiometricsOption(true);
          } else {
            await finishSetup(false);
          }
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showToast('Los PIN no coinciden', 'error');
          setConfirmPin('');
        }
      }
    }
  };
  
  const finishSetup = async (useBiometrics) => {
    const saved = await savePinHash(pin);
    
    if (saved) {
      if (useBiometrics) {
        await setBiometricsEnabled(true);
      }
      
      showToast('PIN configurado correctamente', 'success');
      
      if (onComplete) {
        onComplete();
      } else {
        navigation.goBack();
      }
    } else {
      showToast('Error al guardar PIN', 'error');
      setStep(1);
      setPin('');
      setConfirmPin('');
    }
  };
  
  const handleBiometricsChoice = async (enable) => {
    setEnableBiometrics(enable);
    await finishSetup(enable);
  };
  
  if (showBiometricsOption) {
    return (
      <View style={styles.container}>
        <Header title="Configurar PIN" />
        
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          style={styles.content}
        >
          <View style={styles.biometricsContainer}>
            <View style={styles.iconContainer}>
              <Ionicons name="finger-print" size={64} color="#FFFFFF" />
            </View>
            
            <Text style={styles.title}>¿Activar biométricos?</Text>
            <Text style={styles.subtitle}>
              Usa Face ID o huella digital para desbloquear más rápido
            </Text>
            
            <View style={styles.biometricsButtons}>
              <TouchableOpacity 
                style={styles.biometricsButtonYes}
                onPress={() => handleBiometricsChoice(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
                <Text style={styles.biometricsButtonText}>Sí, activar</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.biometricsButtonNo}
                onPress={() => handleBiometricsChoice(false)}
                activeOpacity={0.8}
              >
                <Text style={styles.biometricsButtonTextNo}>Ahora no</Text>
              </TouchableOpacity>
            </View>
          </View>
        </LinearGradient>
      </View>
    );
  }
  
  return (
    <View style={styles.container}>
      <Header title="Configurar PIN" />
      
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.content}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name={step === 1 ? "create-outline" : "checkmark-done-outline"} size={48} color="#FFFFFF" />
          </View>
          
          <Text style={styles.title}>
            {step === 1 ? 'Crea tu PIN de seguridad' : 'Confirma tu PIN'}
          </Text>
          
          <Text style={styles.subtitle}>
            {step === 1 
              ? 'Ingresa 6 dígitos que usarás para proteger tu cuenta'
              : 'Ingresa nuevamente tu PIN'
            }
          </Text>
        </View>
        
        <PinInput
          pin={step === 1 ? pin : confirmPin}
          onPinChange={handlePinChange}
          maxLength={6}
        />
        
        <View style={styles.steps}>
          <View style={[styles.stepDot, step >= 1 && styles.stepDotActive]} />
          <View style={[styles.stepDot, step >= 2 && styles.stepDotActive]} />
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 15,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 22,
    paddingHorizontal: 20,
  },
  steps: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 40,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  stepDotActive: {
    backgroundColor: '#FFFFFF',
  },
  biometricsContainer: {
    alignItems: 'center',
  },
  biometricsButtons: {
    width: '100%',
    marginTop: 40,
    gap: 12,
  },
  biometricsButtonYes: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  biometricsButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  biometricsButtonNo: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  biometricsButtonTextNo: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
  },
});