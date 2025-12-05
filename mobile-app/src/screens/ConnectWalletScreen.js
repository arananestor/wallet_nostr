import { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import { createNostrClient, publishProfile } from '../services/nostr';
import { saveNostrKeys, saveUserProfile } from '../utils/storage';
import { useToast } from '../context/ToastContext';

// Dominios conocidos que soportan Lightning Address
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
    // Limpiar timeout y request anterior
    if (validationTimeoutRef.current) {
      clearTimeout(validationTimeoutRef.current);
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (address.length > 5 && address.includes('@')) {
      // Esperar 500ms después de que el usuario deje de escribir
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
          <Text style={styles.errorText}>Error: No se encontraron las llaves.</Text>
          <TouchableOpacity 
            style={styles.button} 
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Welcome' }] })}
          >
            <Text style={styles.buttonText}>Volver al inicio</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
  
  const validateAddress = async (addr) => {
    // 1. Validar formato básico
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
      // 2. Crear AbortController para timeout de 3 segundos
      abortControllerRef.current = new AbortController();
      const timeoutId = setTimeout(() => {
        if (abortControllerRef.current) {
          abortControllerRef.current.abort();
        }
      }, 3000);
      
      // 3. Verificar servidor Lightning Address
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
        
        // Verificar que tenga los campos necesarios
        if (data.callback && data.maxSendable && data.minSendable) {
          setValidationStatus('valid');
          setValidationMessage(
            isKnownProvider 
              ? `✅ ${isKnownProvider} verificado`
              : '✅ Dirección verificada'
          );
          setIsValidating(false);
          return true;
        }
      }
      
      // Si el servidor responde pero no con datos válidos
      setValidationStatus('invalid');
      setValidationMessage('❌ Esta dirección no acepta pagos');
      setIsValidating(false);
      return false;
      
    } catch (error) {
      // Si es timeout o error de red
      if (error.name === 'AbortError') {
        console.log('⏱️ Timeout en verificación');
      } else {
        console.error('Error verificando:', error);
      }
      
      // Si es proveedor conocido, dar el beneficio de la duda
      if (isKnownProvider) {
        setValidationStatus('valid');
        setValidationMessage(`⚠️ ${isKnownProvider} (no se pudo verificar, pero es conocido)`);
        setIsValidating(false);
        return true;
      }
      
      // Para proveedores desconocidos, permitir pero con advertencia
      setValidationStatus('warning');
      setValidationMessage('⚠️ No se pudo verificar. Asegúrate que sea correcta.');
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
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Profile' }],
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
    <View style={styles.container}>
      <Header title="Conectar Wallet" />
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Ingresa tu Lightning Address para recibir pagos.
        </Text>
        
        <View style={styles.inputContainer}>
          <TextInput
            style={[
              styles.input,
              validationStatus === 'valid' && styles.inputValid,
              validationStatus === 'warning' && styles.inputWarning,
              validationStatus === 'invalid' && styles.inputInvalid,
            ]}
            placeholder="usuario@chivo.com"
            value={address}
            onChangeText={setAddress}
            autoCapitalize="none"
            keyboardType="email-address"
            editable={!loading}
            autoCorrect={false}
          />
          {isValidating && (
            <ActivityIndicator 
              size="small" 
              color="#F7931A" 
              style={styles.icon}
            />
          )}
          {!isValidating && validationStatus === 'valid' && (
            <Text style={styles.icon}>✅</Text>
          )}
          {!isValidating && validationStatus === 'warning' && (
            <Text style={styles.icon}>⚠️</Text>
          )}
          {!isValidating && validationStatus === 'invalid' && (
            <Text style={styles.icon}>❌</Text>
          )}
        </View>
        
        {validationMessage && (
          <Text style={[
            styles.validationMessage,
            validationStatus === 'valid' && styles.validMessage,
            validationStatus === 'warning' && styles.warningMessage,
            validationStatus === 'invalid' && styles.invalidMessage,
          ]}>
            {validationMessage}
          </Text>
        )}
        
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Sugerencias:</Text>
          <View style={styles.suggestionsRow}>
            <TouchableOpacity 
              style={styles.suggestionChip}
              onPress={() => suggestAddress('chivo.com')}
            >
              <Text style={styles.suggestionText}>Chivo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.suggestionChip}
              onPress={() => suggestAddress('getalby.com')}
            >
              <Text style={styles.suggestionText}>Alby</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.suggestionChip}
              onPress={() => suggestAddress('strike.me')}
            >
              <Text style={styles.suggestionText}>Strike</Text>
            </TouchableOpacity>
          </View>
        </View>
        
        <TouchableOpacity 
          style={[
            styles.button, 
            (loading || validationStatus === 'invalid' || !address) && styles.buttonDisabled
          ]} 
          onPress={handleConnect}
          disabled={loading || validationStatus === 'invalid' || !address}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Conectar</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.helpText}>
          💡 Si no tienes Lightning Address, crea una gratis en Alby o Strike
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20 },
  description: { fontSize: 14, color: '#666', marginBottom: 20, lineHeight: 20 },
  inputContainer: { position: 'relative', marginBottom: 10 },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    paddingRight: 45,
  },
  inputValid: { borderColor: '#00AA00', borderWidth: 2 },
  inputWarning: { borderColor: '#F7931A', borderWidth: 2 },
  inputInvalid: { borderColor: '#FF4444', borderWidth: 2 },
  icon: { position: 'absolute', right: 15, top: 13, fontSize: 20 },
  validationMessage: { fontSize: 13, marginBottom: 20 },
  validMessage: { color: '#00AA00' },
  warningMessage: { color: '#F7931A' },
  invalidMessage: { color: '#FF4444' },
  suggestionsContainer: { marginBottom: 30 },
  suggestionsTitle: { fontSize: 14, color: '#666', marginBottom: 10 },
  suggestionsRow: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  suggestionChip: { backgroundColor: '#F0F0F0', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20 },
  suggestionText: { fontSize: 14, color: '#333' },
  button: { backgroundColor: '#F7931A', paddingVertical: 15, borderRadius: 10, marginBottom: 15 },
  buttonDisabled: { backgroundColor: '#ccc' },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold', textAlign: 'center' },
  helpText: { fontSize: 12, color: '#999', textAlign: 'center', lineHeight: 18 },
  errorText: { fontSize: 16, color: '#666', textAlign: 'center', marginBottom: 20 },
});