import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, TextInput, ActivityIndicator } from 'react-native';
import Header from '../components/Header';
import { getNostrKeys, getUserProfile, saveUserProfile, clearAllData } from '../utils/storage';
import { createNostrClient, publishProfile } from '../services/nostr';

export default function SettingsScreen({ navigation }) {
  const [newAddress, setNewAddress] = useState('');
  const [loading, setLoading] = useState(false);
  
  const validateLightningAddress = (addr) => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(addr);
  };
  
  const handleUpdateAddress = async () => {
    if (!validateLightningAddress(newAddress)) {
      Alert.alert('Error', 'Dirección inválida');
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
      Alert.alert('Éxito', 'Dirección actualizada');
      
    } catch (error) {
      setLoading(false);
      Alert.alert('Error', 'No se pudo actualizar');
      console.error(error);
    }
  };
  
  const handleShowBackup = async () => {
    const keys = await getNostrKeys();
    Alert.alert(
      'Tu clave privada (nsec)',
      `${keys.nsec}\n\nGuárdala en un lugar seguro. Nunca la compartas.`,
      [{ text: 'OK' }]
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
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cuenta</Text>
          
          <TouchableOpacity style={styles.dangerButton} onPress={handleLogout}>
            <Text style={styles.dangerText}>Cerrar sesión</Text>
          </TouchableOpacity>
        </View>
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
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 15,
    fontSize: 16,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#F7931A',
    paddingVertical: 12,
    borderRadius: 8,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  optionButton: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  optionText: {
    fontSize: 16,
    color: '#333',
  },
  dangerButton: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  dangerText: {
    fontSize: 16,
    color: '#ff4444',
    textAlign: 'center',
  },
});