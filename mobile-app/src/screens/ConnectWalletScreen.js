import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { generateNostrKeys, createNostrClient, publishProfile } from '../services/nostr';
import { saveNostrKeys, saveUserProfile } from '../utils/storage';

export default function ConnectWalletScreen({ route, navigation }) {
  const { nombre, actividad } = route.params;
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleConnect = async () => {
    if (!address.includes('@')) {
      Alert.alert('Error', 'Formato inválido. Debe ser: usuario@chivo.com');
      return;
    }
    
    setLoading(true);
    
    try {
      // 1. Generar llaves Nostr
      const keys = generateNostrKeys();
      
      // 2. Guardar llaves localmente
      await saveNostrKeys(keys);
      
      // 3. Conectar a Nostr
      const ndk = await createNostrClient(keys.privateKey);
      
      // 4. Publicar perfil
      await publishProfile(ndk, {
        name: nombre,
        about: actividad || '',
        lud16: address,
      });
      
      // 5. Guardar perfil localmente
      await saveUserProfile({
        nombre,
        actividad,
        lightningAddress: address,
      });
      
      setLoading(false);
      
      // 6. Navegar a pantalla de QR
      navigation.navigate('QRScreen', {
        npub: keys.npub,
        lightningAddress: address,
      });
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo conectar. Intenta de nuevo.');
      console.error(error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conecta Chivo Wallet</Text>
      
      <Text style={styles.description}>
        Ingresa tu dirección Lightning de Chivo
      </Text>
      
      <TextInput
        style={styles.input}
        placeholder="usuario@chivo.com"
        value={address}
        onChangeText={setAddress}
        autoCapitalize="none"
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