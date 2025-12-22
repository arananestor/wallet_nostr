import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Animated, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';
import { getUserProfile } from '../utils/storage';
import NFCService from '../services/nfc';
import { useToast } from '../context/ToastContext';

const SATS_TO_USD = 0.00043;

export default function NFCPaymentScreen({ navigation }) {
  const [amount, setAmount] = useState('');
  const [profile, setProfile] = useState(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [pulseAnim] = useState(new Animated.Value(1));
  const { showToast } = useToast();

  useEffect(() => {
    loadProfile();
    initNFC();

    return () => {
      NFCService.cleanup();
    };
  }, []);

  useEffect(() => {
    if (isWaiting) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isWaiting]);

  const loadProfile = async () => {
    const savedProfile = await getUserProfile();
    setProfile(savedProfile);
  };

  const initNFC = async () => {
    const initialized = await NFCService.initialize();
    if (!initialized) {
      Alert.alert(
        'NFC no disponible',
        'Tu dispositivo no soporta NFC o está desactivado.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    }
  };

  const handleStartNFC = async () => {
    if (!amount || parseInt(amount) <= 0) {
      showToast('Ingresa una cantidad válida', 'warning');
      return;
    }

    if (!profile?.lightningAddress) {
      showToast('No tienes Lightning Address configurada', 'error');
      return;
    }

    setIsWaiting(true);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const result = await NFCService.writePaymentRequest(
      parseInt(amount),
      profile.lightningAddress
    );

    setIsWaiting(false);

    if (result.success) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      showToast('Solicitud enviada', 'success');
      
      Alert.alert(
        '¡Listo!',
        'El otro teléfono debería mostrar la solicitud de pago.',
        [
          {
            text: 'Nueva solicitud',
            onPress: () => setAmount(''),
          },
          {
            text: 'Volver',
            onPress: () => navigation.goBack(),
          },
        ]
      );
    } else {
      showToast('Error al enviar solicitud', 'error');
    }
  };

  const handleCancel = async () => {
    await NFCService.cancelOperation();
    setIsWaiting(false);
  };

  const usdAmount = amount ? (parseInt(amount) * SATS_TO_USD).toFixed(2) : '0.00';

  return (
    <View style={styles.container}>
      <Header title="Cobro presencial" />

      <View style={styles.content}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Ionicons name="phone-portrait" size={28} color="#6366F1" />
            </View>
            <Text style={styles.cardTitle}>POS de Sats</Text>
            <Text style={styles.cardSubtitle}>
              Cobra de forma presencial usando NFC
            </Text>
          </View>

          <View style={styles.amountSection}>
            <Text style={styles.amountLabel}>Cantidad a cobrar</Text>
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="number-pad"
                placeholder="0"
                placeholderTextColor="rgba(255, 255, 255, 0.5)"
                editable={!isWaiting}
              />
              <Text style={styles.unit}>sats</Text>
            </View>
            {amount && (
              <Text style={styles.usdAmount}>≈ ${usdAmount} USD</Text>
            )}
          </View>
        </LinearGradient>

        {!isWaiting ? (
          <View style={styles.instructions}>
            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>Ingresa la cantidad de sats</Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>Presiona "Generar solicitud"</Text>
            </View>

            <View style={styles.step}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>
                Acerca el teléfono del pagador (parte trasera)
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.waitingContainer}>
            <Animated.View
              style={[
                styles.nfcIcon,
                { transform: [{ scale: pulseAnim }] },
              ]}
            >
              <Ionicons name="wifi" size={80} color="#6366F1" />
            </Animated.View>
            <Text style={styles.waitingTitle}>Esperando teléfono...</Text>
            <Text style={styles.waitingText}>
              Acerca el otro teléfono a la parte trasera de este dispositivo
            </Text>
          </View>
        )}
      </View>

      <View style={styles.footer}>
        {!isWaiting ? (
          <TouchableOpacity
            style={[styles.button, (!amount || parseInt(amount) <= 0) && styles.buttonDisabled]}
            onPress={handleStartNFC}
            disabled={!amount || parseInt(amount) <= 0}
            activeOpacity={0.8}
          >
            <Ionicons name="radio" size={20} color="#FFFFFF" />
            <Text style={styles.buttonText}>Generar solicitud</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={handleCancel}
            activeOpacity={0.8}
          >
            <Text style={styles.cancelButtonText}>Cancelar</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1, padding: 20 },
  card: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
  },
  amountSection: {
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 8,
  },
  input: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    minWidth: 100,
    textAlign: 'center',
  },
  unit: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  usdAmount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 8,
  },
  instructions: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  stepText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
  waitingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  nfcIcon: {
    marginBottom: 24,
  },
  waitingTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 12,
  },
  waitingText: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
    paddingHorizontal: 40,
    lineHeight: 20,
  },
  footer: {
    padding: 20,
  },
  button: {
    backgroundColor: '#6366F1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  cancelButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});