import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { createNostrClient, publishProfile } from '../services/nostr';
import { saveNostrKeys, saveUserProfile } from '../utils/storage';

export default function ConnectWalletScreen({ route, navigation }) {
  const { nombre, actividad, keys } = route.params;
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
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
        routes: [{ 
          name: 'QRScreen', 
          params: { 
            npub: keys.npub, 
            lightningAddress: address,
            nombre,
            actividad,
          } 
        }],
      });
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo conectar. Verifica tu conexión a internet.');
      console.error(error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conecta tu wallet</Text>
      
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
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 10,
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
});