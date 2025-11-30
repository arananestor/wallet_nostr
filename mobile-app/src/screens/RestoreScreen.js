import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import { restoreKeysFromMnemonic, createNostrClient, getProfile } from '../services/nostr';
import { saveNostrKeys, saveUserProfile } from '../utils/storage';

export default function RestoreScreen({ navigation }) {
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  
  const handleRestore = async () => {
    const words = mnemonic.trim().toLowerCase().split(/\s+/);
    
    if (words.length !== 12) {
      Alert.alert('Error', 'Debes ingresar exactamente 12 palabras');
      return;
    }
    
    setLoading(true);
    setStatus('Verificando frase...');
    
    try {
      const keys = restoreKeysFromMnemonic(mnemonic.trim().toLowerCase());
      
      setStatus('Buscando perfil en Nostr...');
      
      const ndk = await createNostrClient(keys.privateKey);
      const nostrProfile = await getProfile(ndk, keys.npub);
      
      await saveNostrKeys(keys);
      
      if (nostrProfile && nostrProfile.name) {
        setStatus('Perfil encontrado!');
        
        await saveUserProfile({
          nombre: nostrProfile.name,
          actividad: nostrProfile.about || '',
          lightningAddress: nostrProfile.lud16 || '',
        });
        
        setLoading(false);
        
        if (nostrProfile.lud16) {
          navigation.reset({
            index: 0,
            routes: [{ name: 'Profile' }],
          });
        } else {
          navigation.reset({
            index: 0,
            routes: [{ 
              name: 'ConnectWallet', 
              params: { 
                nombre: nostrProfile.name,
                actividad: nostrProfile.about || '',
                keys,
              } 
            }],
          });
        }
      } else {
        setStatus('Perfil no encontrado, configurando nuevo...');
        setLoading(false);
        
        navigation.reset({
          index: 0,
          routes: [{ 
            name: 'ConnectWallet', 
            params: { 
              nombre: 'Usuario',
              actividad: '',
              keys,
            } 
          }],
        });
      }
      
    } catch (error) {
      setLoading(false);
      setStatus('');
      Alert.alert('Error', 'Frase inválida. Verifica las palabras.');
      console.error(error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Header title="Recuperar cuenta" />
      
      <View style={styles.content}>
        <Text style={styles.description}>
          Ingresa las 12 palabras de tu frase de recuperación, separadas por espacios.
        </Text>
        
        <TextInput
          style={styles.input}
          placeholder="palabra1 palabra2 palabra3 ..."
          value={mnemonic}
          onChangeText={setMnemonic}
          autoCapitalize="none"
          multiline
          numberOfLines={4}
          editable={!loading}
        />
        
        {status ? <Text style={styles.status}>{status}</Text> : null}
        
        <TouchableOpacity 
          style={[styles.button, loading && styles.buttonDisabled]} 
          onPress={handleRestore}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Recuperar</Text>
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
    marginBottom: 15,
    minHeight: 100,
    textAlignVertical: 'top',
  },
  status: {
    fontSize: 14,
    color: '#F7931A',
    textAlign: 'center',
    marginBottom: 15,
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