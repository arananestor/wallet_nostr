import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { generateNostrKeysWithMnemonic } from '../services/nostr';

export default function RegisterScreen({ navigation }) {
  const [nombre, setNombre] = useState('');
  const [actividad, setActividad] = useState('');
  
  const handleContinue = () => {
    if (!nombre.trim()) {
      Alert.alert('Error', 'Ingresa tu nombre');
      return;
    }
    
    const keysWithMnemonic = generateNostrKeysWithMnemonic();
    
    navigation.navigate('Backup', {
      mnemonic: keysWithMnemonic.mnemonic,
      nombre,
      actividad,
      keys: {
        privateKey: keysWithMnemonic.privateKey,
        publicKey: keysWithMnemonic.publicKey,
        nsec: keysWithMnemonic.nsec,
        npub: keysWithMnemonic.npub,
      },
    });
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Cuéntanos sobre ti</Text>
      
      <Text style={styles.label}>Tu nombre *</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Juan Pérez"
        value={nombre}
        onChangeText={setNombre}
      />
      
      <Text style={styles.label}>¿Qué haces? (opcional)</Text>
      <TextInput
        style={styles.input}
        placeholder="Ej: Hago malabares en el semáforo"
        value={actividad}
        onChangeText={setActividad}
        multiline
      />
      
      <TouchableOpacity style={styles.button} onPress={handleContinue}>
        <Text style={styles.buttonText}>Siguiente</Text>
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
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 8,
    color: '#333',
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
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
});