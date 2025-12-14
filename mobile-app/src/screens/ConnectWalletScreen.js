import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { createNostrClient, publishProfile } from '../services/nostr';
import { saveNostrKeys, saveUserProfile } from '../utils/storage';
import { useToast } from '../context/ToastContext';

const KNOWN_PROVIDERS = {
  'chivo.com': 'Chivo Wallet',
  'getalby.com': 'Alby',
  'strike.me': 'Strike',
  'walletofsatoshi.com': 'Wallet of Satoshi',
  'coinos.io': 'Coinos',
};

export default function ConnectWalletScreen({ route, navigation }) {
  const params = route?.params || {};
  const nombre = params.nombre || '';
  const actividad = params.actividad || '';
  const keys = params.keys || null;
  
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null);
  const [validationMessage, setValidationMessage] = useState('');
  
  const validationTimeoutRef = useRef(null);
  const abortControllerRef = useRef(null);
  const { showToast } = useToast();
  
  useEffect(() => {
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (address.length > 5 && address.includes('@')) {
      validationTimeoutRef.current = setTimeout(() => {
        validateAddress(address);
      }, 500);
    } else {
      setValidationStatus(null);
      setValidationMessage('');
      setIsValidating(false);
    }
    
    return () => {
      if (validationTimeoutRef.current) {
        clearTimeout(validationTimeoutRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [address]);
  
  if (!keys) {
    return (
      <View style={styles.container}>
        <Header title="Error" />
        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={48} color="#EF4444" />
            <Text style={styles.errorText}>No se encontraron las llaves</Text>
            <TouchableOpacity 
              style={styles.errorButton} 
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
              activeOpacity={0.7}
            >
              <Text style={styles.errorButtonText}>Volver al inicio</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }
  
  const validateAddress = async (addr) => {
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!regex.test(addr)) {
      setValidationStatus('invalid');
      setValidationMessage('Formato inválido. Ej: usuario@dominio.com');
      setIsValidating(false);
      return false;
    }
    
    setIsValidating(true);
    setValidationMessage('Verificando...');
    
    const [username, domain] = addr.split('@');
    const isKnownProvider = KNOWN_PROVIDERS[domain.toLowerCase()];
    
    try {
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 3000);
      
      const response = await fetch(
        `https://${domain}/.well-known/lnurlp/${username}`,
        {
          method: 'GET',
          headers: { 
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          signal: abortControllerRef.current.signal,
        }
      );
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        
        if (data.callback && data.maxSendable && data.minSendable) {
          setValidationStatus('valid');
          setValidationMessage(
            isKnownProvider 
              ? `${isKnownProvider} verificado`
              : 'Dirección verificada'
          );
          setIsValidating(false);
          return true;
        }
      }
      
      setValidationStatus('invalid');
      setValidationMessage('Esta dirección no acepta pagos');
      setIsValidating(false);
      return false;
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Timeout en verificación');
      } else {
        console.error('Error verificando:', error);
      }
      
      if (isKnownProvider) {
        setValidationStatus('valid');
        setValidationMessage(`${isKnownProvider} (no se pudo verificar, pero es conocido)`);
        setIsValidating(false);
        return true;
      }
      
      setValidationStatus('warning');
      setValidationMessage('No se pudo verificar. Asegúrate que sea correcta.');
      setIsValidating(false);
      return true;
    }
  };
  
  const handleConnect = async () => {
    if (!address.trim()) {
      showToast('Ingresa tu Lightning Address', 'warning');
      return;
    }
    
    if (validationStatus === 'invalid') {
      showToast('La dirección no es válida', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      await saveNostrKeys(keys);
      
      const ndk = await createNostrClient(keys.privateKey);
      
      await publishProfile(ndk, {
        name: nombre,
        about: actividad || '',
        lud16: address.trim().toLowerCase(),
      });
      
      await saveUserProfile({
        nombre,
        actividad,
        lightningAddress: address.trim().toLowerCase(),
      });
      
      setLoading(false);
      showToast('¡Perfil creado!', 'success');
      
      navigation.navigate('SetupPin', {
        onComplete: () => {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Profile' }],
          });
        },
      });
      
    } catch (error) {
      setLoading(false);
      showToast('Error al conectar', 'error');
      console.error(error);
    }
  };
  
  const suggestAddress = (domain) => {
    const username = nombre.toLowerCase().replace(/\s+/g, '');
    setAddress(`${username}@${domain}`);
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Conectar Wallet" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="wallet-outline" size={32} color="#6366F1" />
          </View>
          <Text style={styles.title}>Lightning Address</Text>
          <Text style={styles.subtitle}>
            Ingresa tu dirección para recibir pagos instantáneos
          </Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Tu Lightning Address</Text>
            <View style={[
              styles.inputContainer,
              validationStatus === 'valid' && styles.inputValid,
              validationStatus === 'warning' && styles.inputWarning,
              validationStatus === 'invalid' && styles.inputInvalid,
            ]}>
              <Ionicons name="at" size={20} color="#94A3B8" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="usuario@chivo.com"
                placeholderTextColor="#94A3B8"
                value={address}
                onChangeText={setAddress}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!loading}
                autoCorrect={false}
              />
              {isValidating && (
                <ActivityIndicator size="small" color="#6366F1" />
              )}
              {!isValidating && validationStatus === 'valid' && (
                <Ionicons name="checkmark-circle" size={24} color="#10B981" />
              )}
              {!isValidating && validationStatus === 'warning' && (
                <Ionicons name="warning" size={24} color="#F59E0B" />
              )}
              {!isValidating && validationStatus === 'invalid' && (
                <Ionicons name="close-circle" size={24} color="#EF4444" />
              )}
            </View>
            
            {validationMessage && (
              <View style={[
                styles.validationMessage,
                validationStatus === 'valid' && styles.validMessageBox,
                validationStatus === 'warning' && styles.warningMessageBox,
                validationStatus === 'invalid' && styles.invalidMessageBox,
              ]}>
                <Text style={[
                  styles.validationText,
                  validationStatus === 'valid' && styles.validText,
                  validationStatus === 'warning' && styles.warningText,
                  validationStatus === 'invalid' && styles.invalidText,
                ]}>
                  {validationMessage}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.suggestionsContainer}>
            <Text style={styles.suggestionsTitle}>Sugerencias rápidas</Text>
            <View style={styles.suggestionsGrid}>
              <TouchableOpacity 
                style={styles.suggestionChip}
                onPress={() => suggestAddress('chivo.com')}
                activeOpacity={0.7}
              >
                <Ionicons name="flash" size={16} color="#6366F1" />
                <Text style={styles.suggestionText}>Chivo</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.suggestionChip}
                onPress={() => suggestAddress('getalby.com')}
                activeOpacity={0.7}
              >
                <Ionicons name="flash" size={16} color="#6366F1" />
                <Text style={styles.suggestionText}>Alby</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.suggestionChip}
                onPress={() => suggestAddress('strike.me')}
                activeOpacity={0.7}
              >
                <Ionicons name="flash" size={16} color="#6366F1" />
                <Text style={styles.suggestionText}>Strike</Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              Si no tienes Lightning Address, crea una gratis en Alby o Strike
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[
            styles.button, 
            (loading || validationStatus === 'invalid' || !address) && styles.buttonDisabled
          ]} 
          onPress={handleConnect}
          disabled={loading || validationStatus === 'invalid' || !address}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Conectar</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1 },
  scrollContent: { padding: 24 },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    gap: 24,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  inputValid: { borderColor: '#10B981' },
  inputWarning: { borderColor: '#F59E0B' },
  inputInvalid: { borderColor: '#EF4444' },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1E293B',
  },
  validationMessage: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  validMessageBox: { backgroundColor: '#DCFCE7' },
  warningMessageBox: { backgroundColor: '#FEF3C7' },
  invalidMessageBox: { backgroundColor: '#FEE2E2' },
  validationText: {
    fontSize: 13,
    fontWeight: '500',
  },
  validText: { color: '#166534' },
  warningText: { color: '#92400E' },
  invalidText: { color: '#991B1B' },
  suggestionsContainer: {
    gap: 12,
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  suggestionsGrid: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  suggestionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    gap: 6,
  },
  suggestionText: {
    fontSize: 14,
    color: '#6366F1',
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
  },
  errorButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
});