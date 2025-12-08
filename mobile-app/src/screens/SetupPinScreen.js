import { useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';
import PinInput from '../components/PinInput';
import { savePinHash } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export default function SetupPinScreen({ route, navigation }) {
  const { onComplete } = route.params || {};
  
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [step, setStep] = useState(1); // 1 = crear, 2 = confirmar
  
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
      
      <View style={styles.content}>
        <Text style={styles.title}>
          {step === 1 ? 'Crea tu PIN de seguridad' : 'Confirma tu PIN'}
        </Text>
        
        <Text style={styles.subtitle}>
          {step === 1 
            ? 'Ingresa 6 dígitos que usarás para proteger tu cuenta'
            : 'Ingresa nuevamente tu PIN'
          }
        </Text>
        
        <PinInput
          pin={step === 1 ? pin : confirmPin}
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
    lineHeight: 20,
  },
});