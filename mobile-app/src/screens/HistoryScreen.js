import { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, LayoutAnimation, Platform, UIManager } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Header from '../components/Header';
import { useDonations } from '../context/DonationContext';
import { useToast } from '../context/ToastContext';

// Habilitar LayoutAnimation en Android
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const SATS_TO_USD = 0.00043;
const COLLAPSE_THRESHOLD = 100;

export default function HistoryScreen({ navigation }) {
  const { donations = [] } = useDonations();
  const { showToast } = useToast();
  const [expandedDonation, setExpandedDonation] = useState(null);
  const [isCollapsed, setIsCollapsed] = useState(false);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const lastScrollY = useRef(0);

  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalUSD = (totalAmount * SATS_TO_USD).toFixed(2);

  // Agrupar por fecha
  const groupedDonations = donations.reduce((groups, donation) => {
    const date = new Date(donation.timestamp * 1000).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(donation);
    return groups;
  }, {});

  const exportToCSV = async () => {
    try {
      if (donations.length === 0) {
        showToast('No hay transacciones para exportar', 'warning');
        return;
      }

      const csvHeader = 'Fecha,Remitente,Cantidad (sats),USD\n';
      const csvRows = donations.map(d => {
        const date = new Date(d.timestamp * 1000).toLocaleString('es-ES');
        const usd = (d.amount * SATS_TO_USD).toFixed(2);
        return `${date},${d.sender},${d.amount},${usd}`;
      }).join('\n');

      const csv = csvHeader + csvRows;
      const fileUri = FileSystem.documentDirectory + 'historial_donaciones.csv';
      
      await FileSystem.writeAsStringAsync(fileUri, csv, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      await Sharing.shareAsync(fileUri, {
        mimeType: 'text/csv',
        dialogTitle: 'Exportar historial',
        UTI: 'public.comma-separated-values-text',
      });

      showToast('Historial exportado', 'success');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      showToast('Error al exportar', 'error');
    }
  };

  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    {
      useNativeDriver: true,
      listener: (event) => {
        const currentScrollY = event.nativeEvent.contentOffset.y;
        const shouldCollapse = currentScrollY > COLLAPSE_THRESHOLD;
        
        if (shouldCollapse !== isCollapsed) {
          LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
          setIsCollapsed(shouldCollapse);
        }
        
        lastScrollY.current = currentScrollY;
      },
    }
  );

  // Animaciones con useNativeDriver
  const headerScale = scrollY.interpolate({
    inputRange: [0, COLLAPSE_THRESHOLD],
    outputRange: [1, 0.7],
    extrapolate: 'clamp',
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_THRESHOLD / 2, COLLAPSE_THRESHOLD],
    outputRange: [1, 0.8, 0],
    extrapolate: 'clamp',
  });

  const compactOpacity = scrollY.interpolate({
    inputRange: [0, COLLAPSE_THRESHOLD / 2, COLLAPSE_THRESHOLD],
    outputRange: [0, 0.2, 1],
    extrapolate: 'clamp',
  });

  return (
    <View style={styles.container}>
      <Header title="Historial" />

      {/* Header con animación */}
      <View style={[styles.summaryCard, { height: isCollapsed ? 70 : 200 }]}>
        <LinearGradient
          colors={['#6366F1', '#8B5CF6']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.summaryGradient}
        >
          {/* Versión grande */}
          <Animated.View 
            style={[
              styles.summaryExpanded,
              {
                opacity: headerOpacity,
                transform: [{ scale: headerScale }],
              }
            ]}
          >
            <Text style={styles.summaryLabel}>Total acumulado</Text>
            <Text style={styles.summaryAmount}>{totalAmount.toLocaleString()}</Text>
            <Text style={styles.summaryUnit}>sats</Text>
            <Text style={styles.summaryUSD}>≈ ${totalUSD} USD</Text>
          </Animated.View>

          {/* Versión compacta */}
          <Animated.View 
            style={[
              styles.summaryCompact,
              { opacity: compactOpacity }
            ]}
          >
            <Text style={styles.compactAmount}>{totalAmount.toLocaleString()} sats</Text>
            <Text style={styles.compactUSD}>≈ ${totalUSD} USD</Text>
          </Animated.View>
        </LinearGradient>
      </View>

      {/* Lista de transacciones */}
      <Animated.ScrollView
        style={styles.listContainer}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {donations.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="receipt-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Sin transacciones</Text>
            <Text style={styles.emptyText}>
              Aquí aparecerán todas tus donaciones recibidas
            </Text>
          </View>
        ) : (
          <>
            {/* Botón exportar */}
            <TouchableOpacity
              style={styles.exportButton}
              onPress={exportToCSV}
              activeOpacity={0.8}
            >
              <Ionicons name="download-outline" size={20} color="#6366F1" />
              <Text style={styles.exportText}>Exportar a CSV</Text>
            </TouchableOpacity>

            {/* Transacciones agrupadas por fecha */}
            {Object.entries(groupedDonations).map(([date, dayDonations], groupIndex) => {
              const dayTotal = dayDonations.reduce((sum, d) => sum + d.amount, 0);
              
              return (
                <View key={groupIndex} style={styles.dateGroup}>
                  <View style={styles.dateHeader}>
                    <Text style={styles.dateText}>{date}</Text>
                    <View style={styles.dateBadge}>
                      <Text style={styles.dateBadgeText}>
                        {dayDonations.length} {dayDonations.length === 1 ? 'donación' : 'donaciones'}
                      </Text>
                      <Text style={styles.dateBadgeAmount}>+{dayTotal.toLocaleString()}</Text>
                    </View>
                  </View>

                  {dayDonations.map((donation, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.donationCard}
                      onPress={() => setExpandedDonation(
                        expandedDonation === donation.id ? null : donation.id
                      )}
                      activeOpacity={0.9}
                    >
                      <View style={styles.donationMain}>
                        <View style={styles.donationIcon}>
                          <Ionicons name="arrow-down" size={20} color="#10B981" />
                        </View>
                        
                        <View style={styles.donationInfo}>
                          <Text style={styles.donationSender}>
                            De: {donation.sender}
                          </Text>
                          <Text style={styles.donationTime}>
                            {new Date(donation.timestamp * 1000).toLocaleTimeString('es-ES', {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </Text>
                        </View>

                        <View style={styles.donationAmount}>
                          <Text style={styles.amountSats}>+{donation.amount}</Text>
                          <Text style={styles.amountLabel}>sats</Text>
                        </View>
                      </View>

                      {expandedDonation === donation.id && (
                        <View style={styles.donationDetails}>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Equivalente USD</Text>
                            <Text style={styles.detailValue}>
                              ${(donation.amount * SATS_TO_USD).toFixed(2)}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>Fecha completa</Text>
                            <Text style={styles.detailValue}>
                              {new Date(donation.timestamp * 1000).toLocaleString('es-ES')}
                            </Text>
                          </View>
                          <View style={styles.detailRow}>
                            <Text style={styles.detailLabel}>ID</Text>
                            <Text style={styles.detailValue}>{donation.id}</Text>
                          </View>
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              );
            })}
          </>
        )}
      </Animated.ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  
  // Summary Card
  summaryCard: {
    overflow: 'hidden',
  },
  summaryGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  
  // Versión expandida
  summaryExpanded: {
    position: 'absolute',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  summaryAmount: {
    fontSize: 56,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryUnit: {
    fontSize: 20,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
    marginBottom: 8,
  },
  summaryUSD: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.85)',
  },
  
  // Versión compacta
  summaryCompact: {
    position: 'absolute',
    alignItems: 'center',
  },
  compactAmount: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  compactUSD: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 2,
  },

  // Lista
  listContainer: {
    flex: 1,
  },
  listContent: {
    padding: 20,
    paddingBottom: 40,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  exportText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },

  // Grupos por fecha
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#475569',
  },
  dateBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#EEF2FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  dateBadgeText: {
    fontSize: 12,
    color: '#6366F1',
    fontWeight: '600',
  },
  dateBadgeAmount: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '700',
  },

  // Cards de donación
  donationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  donationMain: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  donationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  donationInfo: {
    flex: 1,
  },
  donationSender: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  donationTime: {
    fontSize: 13,
    color: '#94A3B8',
  },
  donationAmount: {
    alignItems: 'flex-end',
  },
  amountSats: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
  },
  amountLabel: {
    fontSize: 12,
    color: '#64748B',
  },

  // Detalles expandidos
  donationDetails: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  detailValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#475569',
    flex: 1,
    textAlign: 'right',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  
});