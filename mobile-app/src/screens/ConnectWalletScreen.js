import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import { createNostrClient, publishProfile } from '../services/nostr';
import { saveNostrKeys, saveUserProfile } from '../utils/storage';

export default function ConnectWalletScreen({ route, navigation }) {
  const params = route?.params || {};
  const nombre = params.nombre || '';
  const actividad = params.actividad || '';
  const keys = params.keys || null;
  
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
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
  
  const validateLightningAddress = (addr) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(addr);
  };
  
  const handleConnect = async () => {
    if (!validateLightningAddress(address)) {
      Alert.alert('Error', 'Ingresa una dirección válida. Ejemplo: usuario@getalby.com');
      return;
    }
    
    setLoading(true);
    
    try {
      await saveNostrKeys(keys);
      
      const ndk = await createNostrClient(keys.privateKey);
      
      await publishProfile(ndk, {
        name: nombre,
        about: actividad || '',
        lud16: address,
      });
      
      await saveUserProfile({
        nombre,
        actividad,
        lightningAddress: address,
      });
      
      setLoading(false);
      
      navigation.reset({
        index: 0,
        routes: [{ name: 'Profile' }],
      });
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo conectar. Verifica tu conexión a internet.');
      console.error(error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Header title="Conectar Wallet" />
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Ingresa tu Lightning Address para recibir pagos. Si usas Chivo Wallet, tu dirección es algo como: tunombre@chivo.com
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="usuario@getalby.com"
          value={address}
          onChangeText={setAddress}
          autoCapitalize="none"
          keyboardType="email-address"
          editable={!loading}
        />
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleConnect}
          disabled={loading}
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
    marginBottom: 30,
    lineHeight: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 20,
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