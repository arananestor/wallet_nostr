import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share, Alert } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Header from '../components/Header';

export default function BackupScreen({ route, navigation }) {
  const { mnemonic, nombre, actividad, keys } = route.params;
  const [confirmed, setConfirmed] = useState(false);
  
  const words = mnemonic.split(' ');
  
  const handleCopy = async () => {
    await Clipboard.setStringAsync(mnemonic);
    Alert.alert('Copiado', 'Las 12 palabras fueron copiadas');
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Mi frase de recuperación (NO COMPARTIR):\n\n${mnemonic}`,
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  const handleContinue = () => {
    if (!confirmed) {
      Alert.alert('Importante', 'Confirma que guardaste tus palabras');
      return;
    }
    
    navigation.navigate('ConnectWallet', {
      nombre,
      actividad,
      keys,
    });
  };
  
  return (
    <View style={styles.container}>
      <Header title="Frase de recuperación" />
      
      <View style={styles.content}>
        <Text style={styles.warning}>
          Guarda estas 12 palabras en un lugar seguro. Si pierdes tu teléfono, las necesitarás para recuperar tu cuenta.
        </Text>
        
        <View style={styles.wordsContainer}>
          {words.map((word, index) => (
            <View key={index} style={styles.wordBox}>
              <Text style={styles.wordNumber}>{index + 1}</Text>
              <Text style={styles.word}>{word}</Text>
            </View>
          ))}
        </View>
        
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.secondaryButton} onPress={handleCopy}>
            <Text style={styles.secondaryButtonText}>Copiar</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.secondaryButton} onPress={handleShare}>
            <Text style={styles.secondaryButtonText}>Compartir</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity 
          style={styles.checkboxRow} 
          onPress={() => setConfirmed(!confirmed)}
        >
          <View style={[styles.checkbox, confirmed && styles.checkboxChecked]}>
            {confirmed && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxText}>Ya guardé mis palabras en un lugar seguro</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.button, !confirmed && styles.buttonDisabled]} 
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continuar</Text>
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
  warning: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  wordsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  wordBox: {
    width: '30%',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordNumber: {
    fontSize: 12,
    color: '#999',
    marginRight: 5,
    width: 20,
  },
  word: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  secondaryButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    marginHorizontal: 5,
  },
  secondaryButtonText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#333',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#F7931A',
    borderRadius: 4,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#F7931A',
  },
  checkmark: {
    color: '#fff',
    fontWeight: 'bold',
  },
  checkboxText: {
    fontSize: 14,
    flex: 1,
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