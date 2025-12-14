import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';
import PinInput from '../components/PinInput';
import { savePinHash } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export default function SetupPinScreen({ route, navigation }) {
  const { onComplete } = route.params || {};
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1);
  
  const { showToast } = useToast();
  
  const handlePinChange = async (newPin) => {
    if (step === 1) {
      setPin(newPin);
      
      if (newPin.length === 6) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          setStep(2);
        }, 300);
      }
    } else {
      setConfirmPin(newPin);
      
      if (newPin.length === 6) {
        if (newPin === pin) {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          const saved = await savePinHash(pin);
          
          if (saved) {
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
        } else {
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          showToast('Los PIN no coinciden', 'error');
          setConfirmPin('');
        }
      }
    }
  };
  
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
});