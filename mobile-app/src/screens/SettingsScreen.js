import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator, Modal, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import Header from '../components/Header';
import PinInput from '../components/PinInput';
import { getNostrKeys, getUserProfile, saveUserProfile, clearAllData, verifyPin, isPinEnabled } from '../utils/storage';
import { createNostrClient, publishProfile } from '../services/nostr';
import { useToast } from '../context/ToastContext';
import * as LocalAuthentication from 'expo-local-authentication';
import { isBiometricsEnabled, setBiometricsEnabled } from '../utils/storage';

export default function SettingsScreen({ navigation }) {
  const [newAddress, setNewAddress] = useState('');
  const [currentAddress, setCurrentAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabledState] = useState(false);
  
  const { showToast } = useToast();
  
  useEffect(() => {
    loadCurrentAddress();
    checkBiometrics();
  }, []);

  const checkBiometrics = async () => {
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    const enabled = await isBiometricsEnabled();
  
  setBiometricsAvailable(compatible && enrolled);
  setBiometricsEnabledState(enabled);
  };

  const toggleBiometrics = async () => {
    const newValue = !biometricsEnabled;
    await setBiometricsEnabled(newValue);
    setBiometricsEnabledState(newValue);
    showToast(newValue ? 'Biométricos activados' : 'Biométricos desactivados', 'success');
  };
  
  const loadCurrentAddress = async () => {
    const profile = await getUserProfile();
    if (profile?.lightningAddress) {
      setCurrentAddress(profile.lightningAddress);
    }
  };
  
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
      
      setCurrentAddress(newAddress);
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
  
  const handleDeleteAccount = () => {
    Alert.alert(
      'Eliminar cuenta',
      '¿Estás COMPLETAMENTE SEGURO?\n\nSe eliminarán:\n• Tus llaves\n• Tu perfil\n• Tu historial de donaciones\n• Tu PIN\n\nEsta acción NO se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        { 
          text: 'Sí, eliminar TODO', 
          style: 'destructive',
          onPress: confirmDeleteAccount
        },
      ]
    );
  };
  
  const confirmDeleteAccount = () => {
    Alert.alert(
      'Última confirmación',
      '¿De verdad quieres eliminar tu cuenta?\n\nGuarda tus 12 palabras si quieres recuperarla después.',
      [
        { text: 'No, cancelar', style: 'cancel' },
        { 
          text: 'SÍ, ELIMINAR', 
          style: 'destructive',
          onPress: async () => {
            await clearAllData();
            showToast('Cuenta eliminada', 'success');
            navigation.reset({
              index: 0,
              routes: [{ name: 'Welcome' }],
            });
          }
        },
      ]
    );
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
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Lightning Address</Text>
          
          {currentAddress && (
            <View style={styles.currentAddressBox}>
              <Text style={styles.currentAddressLabel}>Actual</Text>
              <Text style={styles.currentAddressText}>{currentAddress}</Text>
            </View>
          )}
          
          <Text style={styles.changeLabel}>Cambiar a:</Text>
          <TextInput
            style={styles.input}
            placeholder="nueva@direccion.com"
            placeholderTextColor="#94A3B8"
            value={newAddress}
            onChangeText={setNewAddress}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TouchableOpacity 
            style={[styles.updateButton, loading && styles.buttonDisabled]} 
            onPress={handleUpdateAddress}
            disabled={loading}
            activeOpacity={0.7}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Actualizar</Text>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Seguridad</Text>
          
          <TouchableOpacity style={styles.optionButton} onPress={handleShowBackup} activeOpacity={0.7}>
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="key-outline" size={22} color="#6366F1" />
              </View>
              <Text style={styles.optionText}>Ver clave privada</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.optionButton} 
            onPress={() => navigation.navigate('SetupPin', {
              onComplete: () => {
                showToast('PIN actualizado', 'success');
                navigation.goBack();
              }
            })}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Ionicons name="lock-closed-outline" size={22} color="#6366F1" />
              </View>
              <Text style={styles.optionText}>Cambiar PIN</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
          </TouchableOpacity>
        </View>

        {biometricsAvailable && (
          <TouchableOpacity 
            style={styles.optionButton} 
            onPress={toggleBiometrics}
            activeOpacity={0.7}
          >
            <View style={styles.optionLeft}>
              <View style={styles.optionIconContainer}>
                <Ionicons 
                  name={biometricsEnabled ? "finger-print" : "finger-print-outline"} 
                  size={22} 
                  color={biometricsEnabled ? "#10B981" : "#6366F1"} 
                />
              </View>
              <Text style={styles.optionText}>
                {biometricsEnabled ? 'Desactivar biométricos' : 'Activar biométricos'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#CBD5E1" />
            </TouchableOpacity>
        )}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          <TouchableOpacity style={styles.logoutButton} onPress={handleLogout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#EF4444" />
            <Text style={styles.logoutText}>Cerrar sesión</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.deleteButton} onPress={handleDeleteAccount} activeOpacity={0.7}>
            <Ionicons name="trash-outline" size={20} color="#EF4444" />
            <Text style={styles.deleteText}>Eliminar cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
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
              activeOpacity={0.7}
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
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#64748B', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 },
  currentAddressBox: {
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: '#6366F1',
  },
  currentAddressLabel: {
    fontSize: 12,
    color: '#6366F1',
    marginBottom: 6,
    fontWeight: '600',
  },
  currentAddressText: {
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '500',
  },
  changeLabel: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '500',
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 16,
    fontSize: 15,
    color: '#1E293B',
    marginBottom: 12,
  },
  updateButton: { 
    backgroundColor: '#6366F1', 
    paddingVertical: 14, 
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: { backgroundColor: '#CBD5E1', shadowOpacity: 0 },
  updateButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '600', textAlign: 'center' },
  optionButton: { 
    backgroundColor: '#FFFFFF', 
    padding: 16,
    borderRadius: 12, 
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionText: { fontSize: 15, color: '#1E293B', fontWeight: '500' },
  logoutButton: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#FEE2E2',
  },
  logoutText: { fontSize: 15, color: '#EF4444', marginLeft: 8, fontWeight: '600' },
  deleteButton: {
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#EF4444',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  deleteText: { 
    fontSize: 15, 
    color: '#EF4444', 
    marginLeft: 8,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 32,
    width: '90%',
    maxWidth: 400,
  },
  modalTitle: { fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 8, color: '#1E293B' },
  modalSubtitle: { fontSize: 14, color: '#64748B', textAlign: 'center', marginBottom: 32 },
  modalCancelButton: { marginTop: 24, padding: 16 },
  modalCancelText: { fontSize: 16, color: '#6366F1', textAlign: 'center', fontWeight: '600' },
});