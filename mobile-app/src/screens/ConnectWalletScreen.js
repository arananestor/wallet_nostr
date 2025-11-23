import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from 'react-native';

export default function ConnectWalletScreen({ route }) {
  const { nombre } = route.params;
  const [address, setAddress] = useState('');
  
  const handleConnect = () => {
    if (!address.includes('@')) {
      Alert.alert('Error', 'Formato inválido');
      return;
    }
    Alert.alert('Éxito', `Hola ${nombre}, wallet conectado`);
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Conecta Chivo Wallet</Text>
      <TextInput
        style={styles.input}
        placeholder="usuario@chivo.com"
        value={address}
        onChangeText={setAddress}
        autoCapitalize="none"
      />
      <TouchableOpacity style={styles.button} onPress={handleConnect}>
        <Text style={styles.buttonText}>Conectar</Text>
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