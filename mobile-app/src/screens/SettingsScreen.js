import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, Modal } from 'react-native';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';
import PinInput from '../components/PinInput';
import { getNostrKeys, getUserProfile, saveUserProfile, clearAllData, verifyPin, isPinEnabled } from '../utils/storage';
import { createNostrClient, publishProfile } from '../services/nostr';
import { useToast } from '../context/ToastContext';

export default function SettingsScreen({ navigation }) {
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  
  const { showToast } = useToast();
  
  const validateLightningAddress = (addr) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(addr);
  };
  
  const handleUpdateAddress = async () => {
    if (!validateLightningAddress(newAddress)) {
      showToast('Dirección inválida', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const keys = await getNostrKeys();
      const profile = await getUserProfile();
      
      const ndk = await createNostrClient(keys.privateKey);
      
      await publishProfile(ndk, {
        name: profile.nombre,
        about: profile.actividad || '',
        lud16: newAddress,
      });
      
      await saveUserProfile({
        ...profile,
        lightningAddress: newAddress,
      });
      
      setLoading(false);
      setNewAddress('');
      showToast('Dirección actualizada', 'success');
      
    } catch (error) {
      setLoading(false);
      showToast('No se pudo actualizar', 'error');
      console.error(error);
    }
  };
  
  const requestPinVerification = () => {
    setShowPinModal(true);
    setPin('');
  };
  
  const handlePinVerification = async (newPin) => {
    setPin(newPin);
    
    if (newPin.length === 6) {
      const isValid = await verifyPin(newPin);
      
      if (isValid) {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowPinModal(false);
        setPin('');
        await showBackupKeys();
      } else {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        showToast('PIN incorrecto', 'error');
        setPin('');
      }
    }
  };
  
  const showBackupKeys = async () => {
    const keys = await getNostrKeys();
    Alert.alert(
      'Tu clave privada (nsec)',
      `${keys.nsec}\n\nGuárdala en un lugar seguro. Nunca la compartas.`,
      [{ text: 'OK' }]
    );
  };
  
  const handleShowBackup = async () => {
    const pinEnabled = await isPinEnabled();
    
    if (pinEnabled) {
      requestPinVerification();
    } else {
      await showBackupKeys();
    }
  };
  
  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro? Necesitarás tu frase de recuperación para volver a entrar.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, cerrar sesión', 
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          }
        },
      ]
    );
  };
  
  return (
    <View style={styles.container}>
      <Header title="Configuración" />
      
      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cambiar Lightning Address</Text>
          <TextInput
            style={styles.input}
            placeholder="nueva@direccion.com"
            value={newAddress}
            onChangeText={setNewAddress}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleUpdateAddress}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Actualizar</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          
          <TouchableOpacity style={styles.optionButton} onPress={handleShowBackup}>
            <Text style={styles.optionText}>🔑 Ver clave privada</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionButton} onPress={() => navigation.navigate('SetupPin', {
            onComplete: () => {
              showToast('PIN actualizado', 'success');
              navigation.goBack();
            }
          })}>
            <Text style={styles.optionText}>🔢 Cambiar PIN</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
            <Text style={styles.dangerText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Modal de verificación de PIN */}
      <Modal
        visible={showPinModal}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Verificar PIN</Text>
            <Text style={styles.modalSubtitle}>Ingresa tu PIN para continuar</Text>
            
            <PinInput
              pin={pin}
              onPinChange={handlePinVerification}
              maxLength={6}
            />
            
            <TouchableOpacity 
              style={styles.modalCancelButton}
              onPress={() => {
                setShowPinModal(false);
                setPin('');
              }}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 30 },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  button: { backgroundColor: '#F7931A', paddingVertical: 12, borderRadius: 8 },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  optionButton: { backgroundColor: '#f5f5f5', padding: 15, borderRadius: 8, marginBottom: 10 },
  optionText: { fontSize: 16, color: '#333' },
  dangerButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  dangerText: { fontSize: 16, color: '#ff4444', textAlign: 'center' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 30,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 10 },
  modalSubtitle: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 30 },
  modalCancelButton: { marginTop: 20, padding: 15 },
  modalCancelText: { fontSize: 16, color: '#F7931A', textAlign: 'center' },
});