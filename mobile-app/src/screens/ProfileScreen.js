import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert, ActivityIndicator, ScrollView, RefreshControl } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import Header from '../components/Header';
import { getNostrKeys, getUserProfile } from '../utils/storage';
import { generateQRData } from '../services/nostr';
import { useDonations } from '../context/DonationContext';

export default function ProfileScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [keys, setKeys] = useState(null);
  const qrRef = useRef();
  
  const { isConnected, isRefreshing, refresh, getTotalToday, simulateDonation } = useDonations();
  
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
      setLoading(false);
    }
  };
  
  const onRefresh = useCallback(async () => {
    await refresh();
  }, [refresh]);
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Envíame sats: ${profile.lightningAddress}`,
      });
    } catch (error) {
      console.error(error);
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
      Alert.alert('Error', 'No se pudo imprimir');
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#F7931A" />
      </View>
    );
  }
  
  const qrData = generateQRData(keys.npub, profile.lightningAddress);
  const todayTotal = getTotalToday();
  
  return (
    <View style={styles.container}>
      <Header title="Mi Perfil" showBack={false} />
      
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#F7931A']}
            tintColor="#F7931A"
            title="Actualizando..."
            titleColor="#666"
          />
        }
      >
        <View style={styles.content}>
          <View style={styles.statusBar}>
            <View style={[styles.statusDot, isConnected ? styles.connected : styles.disconnected]} />
            <Text style={styles.statusText}>
              {isConnected ? 'Conectado' : 'Sin conexión'} • Arrastra para actualizar
            </Text>
          </View>
          
          {todayTotal > 0 && (
            <View style={styles.todayBox}>
              <Text style={styles.todayLabel}>Hoy</Text>
              <Text style={styles.todayAmount}>{todayTotal} sats</Text>
            </View>
          )}
          
          <View style={styles.userInfo}>
            <Text style={styles.name}>{profile.nombre}</Text>
            {profile.actividad && <Text style={styles.activity}>{profile.actividad}</Text>}
          </View>
          
          <View style={styles.qrContainer}>
            <QRCode
              value={qrData}
              size={180}
              backgroundColor="white"
              getRef={(ref) => (qrRef.current = ref)}
            />
          </View>
          
          <Text style={styles.address}>{profile.lightningAddress}</Text>
          
          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.button} onPress={handleShare}>
              <Text style={styles.buttonText}>Compartir</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.buttonSecondary} onPress={handlePrint}>
              <Text style={styles.buttonSecondaryText}>Imprimir</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.bottomButtons}>
            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('History')}>
              <Text style={styles.linkText}>📊 Historial de donaciones</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.linkButton} onPress={() => navigation.navigate('Settings')}>
              <Text style={styles.linkText}>⚙️ Configuración</Text>
            </TouchableOpacity>
          </View>
          
          {/* BOTÓN DE PRUEBA - QUITAR EN PRODUCCIÓN */}
          <TouchableOpacity style={styles.testButton} onPress={simulateDonation}>
            <Text style={styles.testButtonText}>🧪 Simular Donación (TEST)</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' },
  scrollContent: { flexGrow: 1 },
  content: { flex: 1, padding: 20, alignItems: 'center' },
  statusBar: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  connected: { backgroundColor: '#00CC00' },
  disconnected: { backgroundColor: '#FF0000' },
  statusText: { fontSize: 12, color: '#999' },
  todayBox: {
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  todayLabel: { fontSize: 14, color: '#F7931A', marginRight: 10 },
  todayAmount: { fontSize: 18, fontWeight: 'bold', color: '#F7931A' },
  userInfo: { alignItems: 'center', marginBottom: 15 },
  name: { fontSize: 22, fontWeight: 'bold', color: '#333' },
  activity: { fontSize: 14, color: '#666', marginTop: 5 },
  qrContainer: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 10,
  },
  address: { fontSize: 12, color: '#666', marginBottom: 20 },
  buttonRow: { flexDirection: 'row', gap: 15, marginBottom: 20 },
  button: { backgroundColor: '#F7931A', paddingVertical: 12, paddingHorizontal: 25, borderRadius: 10 },
  buttonText: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  buttonSecondary: {
    backgroundColor: '#fff',
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F7931A',
  },
  buttonSecondaryText: { color: '#F7931A', fontSize: 14, fontWeight: 'bold' },
  bottomButtons: { marginTop: 10 },
  linkButton: { padding: 12 },
  linkText: { fontSize: 16, color: '#666' },
  testButton: {
    backgroundColor: '#FF6B6B',
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
  },
  testButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
});