import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import Header from '../components/Header';
import { getUserProfile, saveUserProfile } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export default function PerfilScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [expandedSection, setExpandedSection] = useState(null);
  const { showToast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const savedProfile = await getUserProfile();
    setProfile(savedProfile);
    if (savedProfile?.profileImage) {
      setProfileImage(savedProfile.profileImage);
    }
  };

  const pickImage = async (useCamera = false) => {
    try {
      const permission = useCamera
        ? await ImagePicker.requestCameraPermissionsAsync()
        : await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          'Permiso requerido',
          useCamera 
            ? 'Necesitamos acceso a tu cámara' 
            : 'Necesitamos acceso a tu galería'
        );
        return;
      }

      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.5,
          });

      if (!result.canceled && result.assets[0]) {
        const imageUri = result.assets[0].uri;
        setProfileImage(imageUri);
        
        await saveUserProfile({
          ...profile,
          profileImage: imageUri,
        });
        
        showToast('Foto actualizada', 'success');
      }
    } catch (error) {
      console.error('Error picking image:', error);
      showToast('Error al cargar imagen', 'error');
    }
  };

  const showImageOptions = () => {
    Alert.alert(
      'Foto de perfil',
      'Elige una opción',
      [
        { text: 'Tomar foto', onPress: () => pickImage(true) },
        { text: 'Elegir de galería', onPress: () => pickImage(false) },
        { text: 'Cancelar', style: 'cancel' },
      ]
    );
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <Header title="Perfil" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Foto de perfil */}
        <View style={styles.profileHeader}>
          <TouchableOpacity 
            style={styles.avatarContainer}
            onPress={showImageOptions}
            activeOpacity={0.8}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={48} color="#94A3B8" />
              </View>
            )}
            <View style={styles.cameraButton}>
              <Ionicons name="camera" size={18} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>{profile?.nombre || profile?.name || 'Usuario'}</Text>
          {(profile?.actividad || profile?.activity) && (
            <Text style={styles.profileActivity}>{profile.actividad || profile.activity}</Text>
          )}
        </View>

        {/* Opciones */}
        <View style={styles.optionsContainer}>
          {/* Opción 1: Sacar efectivo */}
          <View style={styles.optionCard}>
            <TouchableOpacity
              style={styles.optionHeader}
              onPress={() => toggleSection('cash')}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="cash-outline" size={24} color="#16A34A" />
                </View>
                <Text style={styles.optionTitle}>¿Quieres sacar tu efectivo?</Text>
              </View>
              <Ionicons 
                name={expandedSection === 'cash' ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>

            {expandedSection === 'cash' && (
              <View style={styles.optionContent}>
                <Text style={styles.contentTitle}>Cómo sacar tus sats a efectivo:</Text>
                
                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>1</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Descarga Chivo Wallet</Text>
                    <Text style={styles.stepText}>
                      Disponible en App Store y Google Play. Es la wallet oficial de El Salvador.
                    </Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>2</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Transfiere tus sats</Text>
                    <Text style={styles.stepText}>
                      Desde Pide Wallet, envía tus sats a tu Lightning Address de Chivo.
                    </Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>3</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Encuentra un cajero</Text>
                    <Text style={styles.stepText}>
                      En la app Chivo, ve a "Cajeros" para encontrar el más cercano.
                    </Text>
                  </View>
                </View>

                <View style={styles.step}>
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>4</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>Retira tu dinero</Text>
                    <Text style={styles.stepText}>
                      Escanea el QR del cajero y retira tu efectivo. ¡Sin comisiones!
                    </Text>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="information-circle" size={20} color="#6366F1" />
                  <Text style={styles.infoText}>
                    Los cajeros Chivo están disponibles en todo El Salvador 24/7.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Opción 2: Soporte */}
          <View style={styles.optionCard}>
            <TouchableOpacity
              style={styles.optionHeader}
              onPress={() => toggleSection('support')}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="headset-outline" size={24} color="#2563EB" />
                </View>
                <Text style={styles.optionTitle}>Soporte</Text>
              </View>
              <Ionicons 
                name={expandedSection === 'support' ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>

            {expandedSection === 'support' && (
              <View style={styles.optionContent}>
                <View style={styles.comingSoon}>
                  <Ionicons name="construct-outline" size={48} color="#94A3B8" />
                  <Text style={styles.comingSoonTitle}>Próximamente</Text>
                  <Text style={styles.comingSoonText}>
                    Estamos trabajando en integrar soporte por WhatsApp para ayudarte con cualquier duda.
                  </Text>
                </View>
              </View>
            )}
          </View>

          {/* Opción 3: Recarga */}
          <View style={styles.optionCard}>
            <TouchableOpacity
              style={styles.optionHeader}
              onPress={() => toggleSection('recharge')}
              activeOpacity={0.7}
            >
              <View style={styles.optionLeft}>
                <View style={[styles.optionIcon, { backgroundColor: '#FCE7F3' }]}>
                  <Ionicons name="add-circle-outline" size={24} color="#DB2777" />
                </View>
                <Text style={styles.optionTitle}>Recarga tus sats</Text>
              </View>
              <Ionicons 
                name={expandedSection === 'recharge' ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color="#64748B" 
              />
            </TouchableOpacity>

            {expandedSection === 'recharge' && (
              <View style={styles.optionContent}>
                <Text style={styles.contentTitle}>Cómo agregar más sats:</Text>
                
                <Text style={styles.contentText}>
                  Cuando escanean tu código QR desde nuestra página web, podrán enviarte sats mediante:
                </Text>

                <View style={styles.methodCard}>
                  <Ionicons name="card-outline" size={24} color="#6366F1" />
                  <View style={styles.methodContent}>
                    <Text style={styles.methodTitle}>Tarjeta de crédito/débito</Text>
                    <Text style={styles.methodText}>Pago instantáneo con cualquier tarjeta</Text>
                  </View>
                </View>

                <View style={styles.methodCard}>
                  <Ionicons name="logo-bitcoin" size={24} color="#F59E0B" />
                  <View style={styles.methodContent}>
                    <Text style={styles.methodTitle}>Criptomonedas</Text>
                    <Text style={styles.methodText}>Bitcoin, Lightning, y otras crypto</Text>
                  </View>
                </View>

                <View style={styles.infoBox}>
                  <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                  <Text style={styles.infoText}>
                    Todos los pagos son seguros y se acreditan directamente a tu cuenta.
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1 },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  avatarContainer: {
    position: 'relative',
    marginBottom: 16,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#E2E8F0',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#6366F1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  profileActivity: {
    fontSize: 15,
    color: '#64748B',
  },
  optionsContainer: {
    padding: 20,
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    flex: 1,
  },
  optionContent: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  contentTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 16,
  },
  contentText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
    marginBottom: 16,
  },
  step: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6366F1',
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  stepText: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  infoBox: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: '#4338CA',
    lineHeight: 18,
  },
  comingSoon: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 12,
    marginBottom: 8,
  },
  comingSoonText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
  methodCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F8FAFC',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  methodContent: {
    flex: 1,
  },
  methodTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  methodText: {
    fontSize: 13,
    color: '#64748B',
  },
});