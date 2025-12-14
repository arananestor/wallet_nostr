import { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getNostrKeys, getUserProfile, isPinEnabled } from '../utils/storage';

export default function WelcomeScreen({ navigation }) {
  const [checking, setChecking] = useState(true);
  const [showWelcome, setShowWelcome] = useState(false);
  
  useEffect(() => {
    checkExistingUser();
  }, []);
  
  const checkExistingUser = async () => {
    try {
      const keys = await getNostrKeys();
      const profile = await getUserProfile();
      const pinEnabled = await isPinEnabled();
      
      if (keys && profile) {
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
        return;
      }
      
      setChecking(false);
      setShowWelcome(true);
    } catch (error) {
      setChecking(false);
      setShowWelcome(true);
    }
  };
  
  if (checking) {
    return (
      <LinearGradient
        colors={['#6366F1', '#8B5CF6']}
        style={styles.loadingContainer}
      >
        <View style={styles.logoContainer}>
          <Ionicons name="wallet" size={64} color="#FFFFFF" />
        </View>
        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />
        <Text style={styles.loadingText}>Cargando...</Text>
      </LinearGradient>
    );
  }
  
  if (!showWelcome) {
    return null;
  }
  
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.heroSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="flash" size={48} color="#6366F1" />
          </View>
          <Text style={styles.title}>Recibe Bitcoin{'\n'}al instante</Text>
          <Text style={styles.subtitle}>
            Crea tu código QR y empieza a recibir donaciones en segundos
          </Text>
        </View>
        
        <View style={styles.features}>
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="qr-code-outline" size={24} color="#6366F1" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>QR personalizado</Text>
              <Text style={styles.featureText}>Tu código único para recibir</Text>
            </View>
          </View>
          
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="shield-checkmark-outline" size={24} color="#10B981" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Seguro con PIN</Text>
              <Text style={styles.featureText}>Tus fondos protegidos</Text>
            </View>
          </View>
          
          <View style={styles.feature}>
            <View style={styles.featureIcon}>
              <Ionicons name="stats-chart-outline" size={24} color="#8B5CF6" />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Historial completo</Text>
              <Text style={styles.featureText}>Todas tus transacciones</Text>
            </View>
          </View>
        </View>
      </View>
      
      <View style={styles.buttons}>
        <TouchableOpacity 
          style={styles.primaryButton}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <Text style={styles.primaryButtonText}>Crear cuenta</Text>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </LinearGradient>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('Restore')}
          activeOpacity={0.7}
        >
          <Text style={styles.secondaryButtonText}>Ya tengo cuenta</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  loader: {
    marginBottom: 16,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  heroSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    color: '#1E293B',
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#64748B',
    lineHeight: 24,
    paddingHorizontal: 20,
  },
  features: {
    gap: 16,
  },
  feature: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  featureText: {
    fontSize: 13,
    color: '#64748B',
  },
  buttons: {
    padding: 24,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 'bold',
  },
  secondaryButton: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#6366F1',
    fontSize: 16,
    fontWeight: '600',
  },
});