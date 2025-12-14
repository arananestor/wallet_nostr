import { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { restoreNostrKeysFromMnemonic, createNostrClient, fetchUserProfile } from '../services/nostr';
import { saveNostrKeys, saveUserProfile, isPinEnabled } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export default function RestoreScreen({ navigation }) {
  const [mnemonic, setMnemonic] = useState('');
  const [loading, setLoading] = useState(false);
  const { showToast } = useToast();
  
  const handleRestore = async () => {
    const words = mnemonic.trim().toLowerCase().split(/\s+/);
    
    if (words.length !== 12) {
      showToast('Debes ingresar exactamente 12 palabras', 'error');
      return;
    }
    
    setLoading(true);
    
    try {
      const keys = restoreNostrKeysFromMnemonic(mnemonic.trim());
      
      if (!keys) {
        setLoading(false);
        showToast('Palabras inválidas', 'error');
        return;
      }
      
      const ndk = await createNostrClient(keys.privateKey);
      const profile = await fetchUserProfile(ndk, keys.npub);
      
      if (!profile) {
        setLoading(false);
        showToast('No se encontró perfil en Nostr', 'warning');
        return;
      }
      
      await saveNostrKeys(keys);
      await saveUserProfile({
        nombre: profile.name || 'Usuario',
        actividad: profile.about || '',
        lightningAddress: profile.lud16 || '',
      });
      
      setLoading(false);
      showToast('Cuenta recuperada', 'success');
      
      const pinEnabled = await isPinEnabled();
      
      if (pinEnabled) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'PinLogin' }],
        });
      } else {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Profile' }],
        });
      }
      
    } catch (error) {
      setLoading(false);
      showToast('Error al recuperar cuenta', 'error');
      console.error(error);
    }
  };
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <Header title="Recuperar cuenta" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Ionicons name="key-outline" size={32} color="#6366F1" />
          </View>
          <Text style={styles.title}>Ingresa tus 12 palabras</Text>
          <Text style={styles.subtitle}>
            Las palabras que guardaste cuando creaste tu cuenta
          </Text>
        </View>
        
        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Frase de recuperación</Text>
            <View style={styles.textAreaContainer}>
              <TextInput
                style={styles.textArea}
                placeholder="palabra1 palabra2 palabra3..."
                placeholderTextColor="#94A3B8"
                value={mnemonic}
                onChangeText={setMnemonic}
                multiline
                numberOfLines={4}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
              />
            </View>
            <Text style={styles.hint}>
              Separa cada palabra con un espacio
            </Text>
          </View>
          
          <View style={styles.infoBox}>
            <Ionicons name="shield-checkmark-outline" size={20} color="#6366F1" />
            <Text style={styles.infoText}>
              Tus palabras se procesan de forma segura y nunca salen de tu dispositivo
            </Text>
          </View>
          
          <View style={styles.warningBox}>
            <Ionicons name="alert-circle-outline" size={20} color="#F59E0B" />
            <Text style={styles.warningText}>
              Si las palabras son incorrectas, no podremos recuperar tu cuenta
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={[styles.button, (!mnemonic.trim() || loading) && styles.buttonDisabled]}
          onPress={handleRestore}
          disabled={!mnemonic.trim() || loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Text style={styles.buttonText}>Recuperar cuenta</Text>
              <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Cancelar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1 },
  scrollContent: { padding: 24 },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
  },
  form: {
    gap: 20,
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 4,
  },
  textAreaContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E2E8F0',
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.02,
    shadowRadius: 4,
    elevation: 1,
  },
  textArea: {
    fontSize: 16,
    color: '#1E293B',
    minHeight: 100,
    textAlignVertical: 'top',
  },
  hint: {
    fontSize: 13,
    color: '#94A3B8',
    marginTop: 4,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#EEF2FF',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    gap: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    flex: 1,
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 12,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#CBD5E1',
    shadowOpacity: 0,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 15,
    fontWeight: '600',
  },
});