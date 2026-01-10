import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import Header from '../components/Header';
import { getUserProfile } from '../utils/storage';
import { useToast } from '../context/ToastContext';

export default function QRPreviewScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [selectedType, setSelectedType] = useState('donacion'); // donacion o pago
  const [customText, setCustomText] = useState('');
  const { showToast } = useToast();

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const savedProfile = await getUserProfile();
    setProfile(savedProfile);
  };

  const phrases = {
    donacion: [
      '¡Gracias por tu apoyo! 🙏',
      'Tu donación hace la diferencia',
      'Acepto donaciones en Bitcoin',
      'Cada satoshi cuenta',
    ],
    pago: [
      'Acepto Bitcoin como pago',
      'Paga con Bitcoin aquí',
      'Bitcoin aceptado',
      'Método de pago: Bitcoin',
    ],
  };

  const selectedPhrase = customText || phrases[selectedType][0];

  const handlePrint = async () => {
    try {
      const qrData = JSON.stringify({
        npub: profile?.npub,
        lud16: profile?.lightningAddress,
      });

      const html = `
        <html>
          <head>
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body {
                font-family: 'Arial', sans-serif;
                display: flex;
                justify-content: center;
                align-items: center;
                min-height: 100vh;
                margin: 0;
                background: linear-gradient(135deg, #6366F1 0%, #8B5CF6 100%);
              }
              .container {
                background: white;
                padding: 40px;
                border-radius: 24px;
                text-align: center;
                max-width: 400px;
                box-shadow: 0 20px 60px rgba(0,0,0,0.2);
              }
              .title {
                font-size: 28px;
                font-weight: bold;
                color: #1E293B;
                margin-bottom: 12px;
              }
              .subtitle {
                font-size: 18px;
                color: #64748B;
                margin-bottom: 32px;
              }
              .qr-container {
                background: #F5F7FA;
                padding: 24px;
                border-radius: 16px;
                margin-bottom: 24px;
                display: inline-block;
              }
              .phrase {
                font-size: 20px;
                font-weight: 600;
                color: #6366F1;
                margin-bottom: 16px;
              }
              .info {
                font-size: 14px;
                color: #94A3B8;
                line-height: 1.6;
              }
              .footer {
                margin-top: 32px;
                padding-top: 24px;
                border-top: 2px solid #E2E8F0;
                font-size: 12px;
                color: #94A3B8;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="title">${profile?.nombre || profile?.name || 'Usuario'}</div>
              <div class="subtitle">${profile?.actividad || profile?.activity || 'Acepto Bitcoin'}</div>
              
              <div class="qr-container">
                <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qrData)}" />
              </div>
              
              <div class="phrase">${selectedPhrase}</div>
              
              <div class="info">
                Escanea para ${selectedType === 'donacion' ? 'donar' : 'pagar'} con Bitcoin
              </div>
              
              <div class="footer">
                Powered by Pide Wallet
              </div>
            </div>
          </body>
        </html>
      `;

      await Print.printAsync({ html });
      showToast('Impresión iniciada', 'success');
    } catch (error) {
      console.error('Error imprimiendo:', error);
      showToast('Error al imprimir', 'error');
    }
  };

  const qrData = profile ? JSON.stringify({
    npub: profile.npub,
    lud16: profile.lightningAddress,
  }) : '';

  return (
    <View style={styles.container}>
      <Header title="Vista previa de impresión" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Preview Card */}
        <View style={styles.previewCard}>
          <Text style={styles.previewName}>{profile?.nombre || profile?.name || 'Tu nombre'}</Text>
          <Text style={styles.previewActivity}>{profile?.actividad || profile?.activity || 'Tu actividad'}</Text>

          <View style={styles.qrContainer}>
            {profile && (
              <QRCode
                value={qrData}
                size={240}
                backgroundColor="#F5F7FA"
              />
            )}
          </View>

          <Text style={styles.previewPhrase}>{selectedPhrase}</Text>
        </View>

        {/* Tipo de impresión */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tipo de cartel</Text>
          <View style={styles.typeButtons}>
            <TouchableOpacity
              style={[styles.typeButton, selectedType === 'donacion' && styles.typeButtonActive]}
              onPress={() => setSelectedType('donacion')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="heart" 
                size={20} 
                color={selectedType === 'donacion' ? '#FFFFFF' : '#6366F1'} 
              />
              <Text style={[styles.typeButtonText, selectedType === 'donacion' && styles.typeButtonTextActive]}>
                Donación
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.typeButton, selectedType === 'pago' && styles.typeButtonActive]}
              onPress={() => setSelectedType('pago')}
              activeOpacity={0.7}
            >
              <Ionicons 
                name="card" 
                size={20} 
                color={selectedType === 'pago' ? '#FFFFFF' : '#6366F1'} 
              />
              <Text style={[styles.typeButtonText, selectedType === 'pago' && styles.typeButtonTextActive]}>
                Pago
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Frases predeterminadas */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Frases predeterminadas</Text>
          {phrases[selectedType].map((phrase, index) => (
            <TouchableOpacity
              key={index}
              style={styles.phraseOption}
              onPress={() => setCustomText(phrase)}
              activeOpacity={0.7}
            >
              <Text style={styles.phraseText}>{phrase}</Text>
              {selectedPhrase === phrase && (
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Texto personalizado */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>O escribe tu propia frase</Text>
          <TextInput
            style={styles.customInput}
            placeholder="Ej: Acepto Bitcoin 24/7"
            placeholderTextColor="#94A3B8"
            value={customText}
            onChangeText={setCustomText}
            maxLength={50}
          />
        </View>

        {/* Tips de impresión */}
        <View style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color="#F59E0B" />
            <Text style={styles.tipsTitle}>Tips profesionales</Text>
          </View>

          <View style={styles.tip}>
            <Ionicons name="color-palette" size={18} color="#6366F1" />
            <Text style={styles.tipText}>Imprime en papel couché o vinilo para mayor durabilidad</Text>
          </View>

          <View style={styles.tip}>
            <Ionicons name="resize" size={18} color="#6366F1" />
            <Text style={styles.tipText}>Tamaño recomendado: A4 o carta completa</Text>
          </View>

          <View style={styles.tip}>
            <Ionicons name="shield-checkmark" size={18} color="#6366F1" />
            <Text style={styles.tipText}>Plastifica tu cartel para protegerlo de la lluvia</Text>
          </View>
        </View>

        {/* Advertencia legal */}
        <View style={styles.warningCard}>
          <View style={styles.warningHeader}>
            <Ionicons name="information-circle" size={20} color="#F59E0B" />
            <Text style={styles.warningTitle}>Importante</Text>
          </View>
          <Text style={styles.warningText}>
            En El Salvador, evita obstruir vías públicas o pegar carteles en propiedad privada sin permiso. 
            Respeta las ordenanzas municipales sobre publicidad.
          </Text>
        </View>
      </ScrollView>

      {/* Botón imprimir */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.printButton}
          onPress={handlePrint}
          activeOpacity={0.8}
        >
          <Ionicons name="print" size={20} color="#FFFFFF" />
          <Text style={styles.printButtonText}>Imprimir cartel</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1 },
  previewCard: {
    backgroundColor: '#FFFFFF',
    margin: 20,
    padding: 24,
    borderRadius: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  previewName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1E293B',
    marginBottom: 4,
  },
  previewActivity: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 24,
  },
  qrContainer: {
    backgroundColor: '#F5F7FA',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  previewPhrase: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6366F1',
    textAlign: 'center',
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  typeButtonActive: {
    backgroundColor: '#6366F1',
    borderColor: '#6366F1',
  },
  typeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366F1',
  },
  typeButtonTextActive: {
    color: '#FFFFFF',
  },
  phraseOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  phraseText: {
    fontSize: 15,
    color: '#475569',
    flex: 1,
  },
  customInput: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    fontSize: 15,
    color: '#1E293B',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    marginHorizontal: 20,
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#92400E',
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#78350F',
    lineHeight: 20,
  },
  warningCard: {
    backgroundColor: '#FEF3C7',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
  },
  footer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  printButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6366F1',
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  printButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});