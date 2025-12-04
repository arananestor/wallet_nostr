import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import { createNostrClient, publishProfile } from '../services/nostr';
import { saveNostrKeys, saveUserProfile } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export default function ConnectWalletScreen({ route, navigation }) {
  const params = route?.params || {};
  const nombre = params.nombre || '';
  const actividad = params.actividad || '';
  const keys = params.keys || null;
  
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState(null); // null | 'valid' | 'invalid'
  const [validationMessage, setValidationMessage] = useState('');
  
  const { showToast } = useToast();
  
  useEffect(() => {
    if (address.length > 5) {
      validateAddress(address);
    } else {
      setValidationStatus(null);
      setValidationMessage('');
    }
  }, [address]);
  
  if (!keys) {
    return (
      <View style={styles.container}>
        <Header title="Error" />
        <View style={styles.content}>
          <Text style={styles.errorText}>Error: No se encontraron las llaves. Vuelve a intentar.</Text>
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
    // Validación de formato básico
    const regex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    
    if (!regex.test(addr)) {
      setValidationStatus('invalid');
      setValidationMessage('Formato inválido. Debe ser: usuario@dominio.com');
      return false;
    }
    
    setIsValidating(true);
    
    try {
      const [username, domain] = addr.split('@');
      
      // Verificar que el dominio responde
      const response = await fetch(`https://${domain}/.well-known/lnurlp/${username}`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.callback && data.maxSendable) {
          setValidationStatus('valid');
          setValidationMessage('✅ Dirección verificada');
          setIsValidating(false);
          return true;
        }
      }
      
      setValidationStatus('invalid');
      setValidationMessage('❌ No se pudo verificar esta dirección');
      setIsValidating(false);
      return false;
    } catch (error) {
      console.error('Validation error:', error);
      setValidationStatus('invalid');
      setValidationMessage('⚠️ No se pudo verificar. Asegúrate que esté correcta.');
      setIsValidating(false);
      return false;
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
      showToast('¡Perfil creado exitosamente!', 'success');
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Profile' }],
      });
      
    } catch (error) {
      setLoading(false);
      showToast('Error al conectar. Verifica tu internet.', 'error');
      console.error(error);
    }
  };
  
  const suggestAddress = (domain) => {
    const username = address.split('@')[0] || nombre.toLowerCase().replace(/\s+/g, '');
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
              style={styles.validatingIcon}
            />
          )}
          {!isValidating && validationStatus === 'valid' && (
            <Text style={styles.validIcon}>✅</Text>
          )}
          {!isValidating && validationStatus === 'invalid' && (
            <Text style={styles.invalidIcon}>❌</Text>
          )}
        </View>
        
        {validationMessage && (
          <Text style={[
            styles.validationMessage,
            validationStatus === 'valid' && styles.validMessage,
            validationStatus === 'invalid' && styles.invalidMessage,
          ]}>
            {validationMessage}
          </Text>
        )}
        
        <View style={styles.suggestionsContainer}>
          <Text style={styles.suggestionsTitle}>Sugerencias populares:</Text>
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
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    lineHeight: 20,
  },
  inputContainer: {
    position: 'relative',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    paddingRight: 45,
  },
  inputValid: {
    borderColor: '#00AA00',
    borderWidth: 2,
  },
  inputInvalid: {
    borderColor: '#FF4444',
    borderWidth: 2,
  },
  validatingIcon: {
    position: 'absolute',
    right: 15,
    top: 15,
  },
  validIcon: {
    position: 'absolute',
    right: 15,
    top: 13,
    fontSize: 20,
  },
  invalidIcon: {
    position: 'absolute',
    right: 15,
    top: 13,
    fontSize: 20,
  },
  validationMessage: {
    fontSize: 13,
    marginBottom: 20,
  },
  validMessage: {
    color: '#00AA00',
  },
  invalidMessage: {
    color: '#FF4444',
  },
  suggestionsContainer: {
    marginBottom: 30,
  },
  suggestionsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 10,
  },
  suggestionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  suggestionChip: {
    backgroundColor: '#F0F0F0',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
  },
  button: {
    backgroundColor: '#F7931A',
    paddingVertical: 15,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
});