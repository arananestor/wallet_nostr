import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import Header from '../components/Header';
import { getNostrKeys, getUserProfile } from '../utils/storage';
import { generateQRData } from '../services/nostr';
import { useDonations } from '../context/DonationContext';
import { useToast } from '../context/ToastContext';

const SATS_TO_USD = 0.00043;

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [keys, setKeys] = useState(null);
  const qrRef = useRef();
  
  const { 
    isConnected, 
    isRefreshing, 
    connectionError,
    refresh, 
    manualReconnect,
    getTotalToday, 
    getTotalAll,
    simulateDonation 
  } = useDonations();
  
  const { showToast } = useToast();
  
  useEffect(() => {
    loadProfile();
  }, []);
  
  const loadProfile = async () => {
    try {
      const savedKeys = await getNostrKeys();
      const savedProfile = await getUserProfile();
      
      if (!savedKeys || !savedProfile) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Welcome' }],
        });
        return;
      }
      
      setKeys(savedKeys);
      setProfile(savedProfile);
      setLoading(false);
    } catch (error) {
      console.error(error);
      showToast('Error cargando perfil', 'error');
      setLoading(false);
    }
  };
  
  const onRefresh = useCallback(async () => {
    const connected = await refresh();
    if (connected) {
      showToast('Conexión actualizada', 'success');
    } else {
      showToast('No se pudo conectar', 'warning');
    }
  }, [refresh, showToast]);
  
  const handleReconnect = async () => {
    showToast('Reconectando...', 'info');
    const connected = await manualReconnect();
    if (connected) {
      showToast('¡Conectado!', 'success');
    } else {
      showToast('No se pudo conectar', 'error');
    }
  };
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Envíame sats: ${profile.lightningAddress}`,
      });
    } catch (error) {
      showToast('Error al compartir', 'error');
    }
  };
  
  const generarMensaje = () => {
    if (!profile.actividad) {
      return `Hola, soy ${profile.nombre}`;
    }
    
    const actividadLower = profile.actividad.toLowerCase();
    
    if (actividadLower.includes('vendo') || actividadLower.includes('venta')) {
      return `Yo ${profile.actividad}. Para pagar, escanea aquí`;
    }
    
    return `Yo ${profile.actividad}. Si te gustó, dona aquí`;
  };
  
  const handlePrint = async () => {
    try {
      qrRef.current?.toDataURL(async (dataURL) => {
        const mensaje = generarMensaje();
        
        const html = `
          <html>
            <head>
              <style>
                @page { size: auto; margin: 10mm; }
                * { margin: 0; padding: 0; box-sizing: border-box; }
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                }
                .container { text-align: center; max-width: 400px; }
                .nombre { font-size: 32px; font-weight: bold; margin-bottom: 10px; color: #333; }
                .mensaje { font-size: 20px; color: #666; margin-bottom: 25px; line-height: 1.4; }
                .qr-image { width: 280px; height: 280px; }
                .address { margin-top: 20px; font-size: 14px; color: #999; }
              </style>
            </head>
            <body>
              <div class="container">
                <p class="nombre">${profile.nombre}</p>
                <p class="mensaje">${mensaje}</p>
                <img class="qr-image" src="data:image/png;base64,${dataURL}" />
                <p class="address">${profile.lightningAddress}</p>
              </div>
            </body>
          </html>
        `;
        
        await Print.printAsync({ html, orientation: Print.Orientation.portrait });
      });
    } catch (error) {
      showToast('Error al imprimir', 'error');
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }
  
  const qrData = generateQRData(keys.npub, profile.lightningAddress);
  const totalToday = getTotalToday();
  const totalAll = getTotalAll();
  const usdToday = (totalToday * SATS_TO_USD).toFixed(2);
  const usdTotal = (totalAll * SATS_TO_USD).toFixed(2);
  
  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#6366F1']}
            tintColor="#6366F1"
          />
        }
      >
        <View style={styles.header}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hola,</Text>
              <Text style={styles.userName}>{profile.nombre}</Text>
            </View>
            <TouchableOpacity 
              style={styles.settingsButton}
              onPress={() => navigation.navigate('Settings')}
            >
              <Ionicons name="settings-outline" size={24} color="#475569" />
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity 
            style={styles.statusBadge}
            onPress={!isConnected ? handleReconnect : null}
            disabled={isConnected}
            activeOpacity={isConnected ? 1 : 0.7}
          >
            <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Conectado' : connectionError || 'Sin conexión'}
            </Text>
          </TouchableOpacity>
        </View>
        
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <Text style={styles.balanceLabel}>Balance total</Text>
          <Text style={styles.balanceAmount}>{totalAll.toLocaleString()}</Text>
          <Text style={styles.balanceUnit}>sats</Text>
          <Text style={styles.balanceUSD}>${usdTotal} USD</Text>
          
          {totalToday > 0 && (
            <View style={styles.todayBadge}>
              <Text style={styles.todayLabel}>Hoy: {totalToday} sats</Text>
            </View>
          )}
        </LinearGradient>
        
        <View style={styles.qrSection}>
          <Text style={styles.sectionTitle}>Tu código QR</Text>
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={200}
              backgroundColor="white"
              getRef={(ref) => (qrRef.current = ref)}
            />
          </View>
          <Text style={styles.address}>{profile.lightningAddress}</Text>
        </View>
        
        <View style={styles.actionsGrid}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="share-outline" size={24} color="#475569" />
            </View>
            <Text style={styles.actionText}>Compartir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={handlePrint}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="print-outline" size={24} color="#475569" />
            </View>
            <Text style={styles.actionText}>Imprimir</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={() => navigation.navigate('History')}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="stats-chart-outline" size={24} color="#475569" />
            </View>
            <Text style={styles.actionText}>Historial</Text>
          </TouchableOpacity>
        </View>
        
        {/* BOTÓN DE PRUEBA */}
        <TouchableOpacity 
          style={styles.testButton} 
          onPress={simulateDonation}
          activeOpacity={0.8}
        >
          <Text style={styles.testButtonText}>Simular Donación (TEST)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#F5F7FA',
  },
  scrollContent: { 
    flexGrow: 1,
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  greeting: {
    fontSize: 16,
    color: '#64748B',
    marginBottom: 4,
  },
  userName: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  settingsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  statusDot: { 
    width: 8, 
    height: 8, 
    borderRadius: 4, 
    marginRight: 8,
  },
  connected: { backgroundColor: '#10B981' },
  disconnected: { backgroundColor: '#EF4444' },
  statusText: { 
    fontSize: 13, 
    color: '#64748B',
    fontWeight: '500',
  },
  balanceCard: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 14,
    color: '#E0E7FF',
    marginBottom: 8,
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceUnit: {
    fontSize: 18,
    color: '#E0E7FF',
    marginBottom: 12,
  },
  balanceUSD: {
    fontSize: 20,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  todayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  todayLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  qrSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 20,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
  },
  address: { 
    fontSize: 13, 
    color: '#64748B',
    textAlign: 'center',
  },
  actionsGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  actionIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '600',
  },
  testButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  testButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
});