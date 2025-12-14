import { View, Text, StyleSheet, TouchableOpacity, Share } from 'react-native';
import { useRoute } from '@react-navigation/native';
import QRCode from 'react-native-qrcode-svg';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Header from '../components/Header';
import { useToast } from '../context/ToastContext';

export default function QRScreen() {
  const route = useRoute();
  const { nombre, qrData } = route.params || {};
  const { showToast } = useToast();
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Escanea mi código QR para donar: ${nombre}`,
      });
    } catch (error) {
      showToast('Error al compartir', 'error');
    }
  };
  
  return (
    <View style={styles.container}>
      <Header title="Tu código QR" />
      
      <View style={styles.content}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.card}
        >
          <View style={styles.cardHeader}>
            <View style={styles.iconBadge}>
              <Ionicons name="person" size={24} color="#6366F1" />
            </View>
            <Text style={styles.nombre}>{nombre}</Text>
            <Text style={styles.subtitle}>Escanea para donar</Text>
          </View>
          
          <View style={styles.qrContainer}>
            <View style={styles.qrWrapper}>
              <QRCode
                value={qrData}
                size={220}
                backgroundColor="white"
              />
            </View>
          </View>
          
          <View style={styles.instructionsBox}>
            <Ionicons name="information-circle-outline" size={20} color="rgba(255, 255, 255, 0.9)" />
            <Text style={styles.instructions}>
              Muestra este código para recibir donaciones
            </Text>
          </View>
        </LinearGradient>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleShare}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="share-outline" size={22} color="#6366F1" />
            </View>
            <Text style={styles.actionText}>Compartir QR</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            activeOpacity={0.7}
          >
            <View style={styles.actionIconContainer}>
              <Ionicons name="download-outline" size={22} color="#6366F1" />
            </View>
            <Text style={styles.actionText}>Descargar</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.tipsContainer}>
          <Text style={styles.tipsTitle}>Consejos</Text>
          
          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Ionicons name="sunny-outline" size={18} color="#F59E0B" />
            </View>
            <Text style={styles.tipText}>
              Asegúrate de tener buena iluminación
            </Text>
          </View>
          
          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Ionicons name="resize-outline" size={18} color="#10B981" />
            </View>
            <Text style={styles.tipText}>
              Mantén el QR a la vista y sin obstrucciones
            </Text>
          </View>
          
          <View style={styles.tip}>
            <View style={styles.tipIcon}>
              <Ionicons name="hand-left-outline" size={18} color="#6366F1" />
            </View>
            <Text style={styles.tipText}>
              Sostén el teléfono firmemente al mostrar
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    flex: 1,
    padding: 24,
  },
  card: {
    borderRadius: 24,
    padding: 28,
    marginBottom: 24,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  nombre: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  instructionsBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 14,
    borderRadius: 12,
    gap: 10,
  },
  instructions: {
    flex: 1,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.95)',
    lineHeight: 18,
    fontWeight: '500',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
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
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '600',
  },
  tipsContainer: {
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
    alignItems: 'flex-start',
    marginBottom: 14,
    gap: 12,
  },
  tipIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: '#475569',
    lineHeight: 20,
  },
});