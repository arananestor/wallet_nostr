import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, ScrollView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import Header from '../components/Header';
import { useToast } from '../context/ToastContext';

export default function BackupScreen({ route, navigation }) {
  const params = route?.params || {};
  const nombre = params.nombre || '';
  const actividad = params.actividad || '';
  const keys = params.keys || null;
  
  const [copied, setCopied] = useState(false);
  const { showToast } = useToast();
  
  if (!keys) {
    return (
      <View style={styles.container}>
        <Header title="Error" />
        <View style={styles.content}>
          <Text style={styles.errorText}>Error: No se encontraron las llaves.</Text>
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
  
  const handleCopy = async () => {
    await Clipboard.setStringAsync(keys.mnemonic);
    setCopied(true);
    showToast('Palabras copiadas', 'success');
    setTimeout(() => setCopied(false), 3000);
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Mi frase de recuperación (CONFIDENCIAL):\n\n${keys.mnemonic}\n\n⚠️ NUNCA compartas esto con nadie`,
      });
    } catch (error) {
      showToast('Error al compartir', 'error');
    }
  };
  
  const handleContinue = () => {
    Alert.alert(
      '¿Guardaste tus palabras?',
      'Sin estas 12 palabras NO podrás recuperar tu cuenta si pierdes tu teléfono.',
      [
        { text: 'Aún no', style: 'cancel' },
        { 
          text: 'Sí, las guardé', 
          onPress: () => {
            navigation.navigate('ConnectWallet', {
              nombre,
              actividad,
              keys,
            });
          }
        },
      ]
    );
  };
  
  const words = keys.mnemonic.split(' ');
  
  return (
    <View style={styles.container}>
      <Header title="Respaldar cuenta" />
      
      <ScrollView 
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.warningBox}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color="#F59E0B" />
            <Text style={styles.warningTitle}>Muy importante</Text>
          </View>
          <Text style={styles.warningText}>
            Estas 12 palabras son la ÚNICA forma de recuperar tu cuenta. Guárdalas en un lugar seguro.
          </Text>
        </View>
        
        <View style={styles.wordsContainer}>
          <Text style={styles.sectionTitle}>Tus 12 palabras de recuperación</Text>
          <View style={styles.wordsGrid}>
            {words.map((word, index) => (
              <View key={index} style={styles.wordCard}>
                <Text style={styles.wordNumber}>{index + 1}</Text>
                <Text style={styles.wordText}>{word}</Text>
              </View>
            ))}
          </View>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleCopy}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name={copied ? "checkmark" : "copy-outline"} size={20} color={copied ? "#10B981" : "#6366F1"} />
            </View>
            <Text style={[styles.actionText, copied && styles.actionTextSuccess]}>
              {copied ? 'Copiado' : 'Copiar'}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="share-outline" size={20} color="#6366F1" />
            </View>
            <Text style={styles.actionText}>Compartir</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tipsBox}>
          <Text style={styles.tipsTitle}>Consejos de seguridad</Text>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.tipText}>Escríbelas en papel</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="checkmark-circle" size={20} color="#10B981" />
            <Text style={styles.tipText}>Guárdalas en lugar seguro</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.tipText}>No las compartas con nadie</Text>
          </View>
          <View style={styles.tip}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={styles.tipText}>No las guardes en capturas</Text>
          </View>
        </View>
      </ScrollView>
      
      <View style={styles.footer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Ya las guardé, continuar</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1 },
  scrollContent: { padding: 24 },
  warningBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400E',
  },
  warningText: {
    fontSize: 14,
    color: '#92400E',
    lineHeight: 20,
  },
  wordsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 16,
  },
  wordsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  wordCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  wordNumber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
  },
  wordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  actionTextSuccess: {
    color: '#10B981',
  },
  tipsBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  tipsTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 16,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 14,
    color: '#475569',
  },
  footer: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  continueButton: {
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
  continueButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 16,
    color: '#64748B',
    textAlign: 'center',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});