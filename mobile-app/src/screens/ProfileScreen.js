import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, RefreshControl } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getUserProfile } from '../utils/storage';
import { useDonations } from '../context/DonationContext';
import { useToast } from '../context/ToastContext';

const SATS_TO_USD = 0.00043;

export default function ProfileScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const { donations = [], totalAmount, addDonation } = useDonations();
  const { showToast } = useToast();

  // FIX: Validar valores y calcular UNA SOLA VEZ
  const safeAmount = totalAmount || 0;
  const convertedUSD = (safeAmount * SATS_TO_USD).toFixed(2);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const savedProfile = await getUserProfile();
    console.log('Perfil cargado:', savedProfile); // DEBUG
    setProfile(savedProfile);
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await loadProfile();
    setRefreshing(false);
  }, []);

  const handleTestDonation = async () => {
    const testAmount = Math.floor(Math.random() * 10000) + 1000;
    addDonation(testAmount);
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    showToast(`+${testAmount} sats de prueba`, 'success');
  };

  const todayDonations = donations.filter(d => {
    const today = new Date().toDateString();
    const donationDate = new Date(d.timestamp).toDateString();
    return today === donationDate;
  });

  const recentDonations = donations.slice(0, 3);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mi Perfil</Text>
        <TouchableOpacity 
          style={styles.profileButton}
          onPress={() => navigation.navigate('Perfil')}
          activeOpacity={0.7}
        >
          <View style={styles.avatarCircle}>
            <Ionicons name="person-outline" size={24} color="#6366F1" />
          </View>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6366F1" />
        }
      >
        {/* Balance Card (clickeable → Historial) */}
        <TouchableOpacity 
          style={styles.balanceCard}
          onPress={() => navigation.navigate('History')}
          activeOpacity={0.95}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.balanceGradient}
          >
            <View style={styles.balanceHeader}>
              <Text style={styles.balanceLabel}>Balance total</Text>
              {todayDonations.length > 0 && (
                <View style={styles.todayBadge}>
                  <Text style={styles.todayText}>Hoy</Text>
                </View>
              )}
            </View>
            
            <Text style={styles.balanceAmount}>{safeAmount.toLocaleString()}</Text>
            <Text style={styles.balanceUnit}>sats</Text>
            
            <View style={styles.usdConversion}>
              <Text style={styles.usdAmount}>≈ ${convertedUSD} USD</Text>
            </View>

            <View style={styles.tapHint}>
              <Ionicons name="analytics-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.tapHintText}>Toca para ver historial</Text>
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* QR Card (clickeable → Vista previa impresión) */}
        <TouchableOpacity 
          style={styles.qrCard}
          onPress={() => navigation.navigate('QRPreview')}
          activeOpacity={0.95}
        >
          <View style={styles.qrHeader}>
            <View>
              <Text style={styles.qrTitle}>Tu código QR</Text>
              <Text style={styles.qrSubtitle}>{profile?.lightningAddress || 'Sin configurar'}</Text>
            </View>
            <View style={styles.qrIconContainer}>
              <Ionicons name="qr-code" size={32} color="#6366F1" />
            </View>
          </View>

          <View style={styles.tapHint2}>
            <Ionicons name="print-outline" size={16} color="#6366F1" />
            <Text style={styles.tapHintText2}>Toca para imprimir</Text>
          </View>
        </TouchableOpacity>

        {/* Botón test - SOLO EN DESARROLLO */}
        {__DEV__ && (
          <TouchableOpacity
            style={styles.testButton}
            onPress={handleTestDonation}
            activeOpacity={0.8}
          >
            <Ionicons name="flask" size={20} color="#6366F1" />
            <Text style={styles.testButtonText}>Simular donación</Text>
          </TouchableOpacity>
        )}

        {/* Transacciones recientes */}
        {recentDonations.length > 0 && (
          <View style={styles.transactionsSection}>
            <View style={styles.transactionsHeader}>
              <Text style={styles.sectionTitle}>Actividad reciente</Text>
              <TouchableOpacity onPress={() => navigation.navigate('History')}>
                <Text style={styles.seeAllText}>Ver todas →</Text>
              </TouchableOpacity>
            </View>

            {recentDonations.map((donation, index) => (
              <View key={index} style={styles.transactionItem}>
                <View style={styles.transactionIcon}>
                  <Ionicons name="arrow-down" size={20} color="#10B981" />
                </View>
                <View style={styles.transactionDetails}>
                  <Text style={styles.transactionTitle}>Donación recibida</Text>
                  <Text style={styles.transactionDate}>
                    {new Date(donation.timestamp).toLocaleString('es-ES', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </View>
                <Text style={styles.transactionAmount}>+{donation.amount}</Text>
              </View>
            ))}
          </View>
        )}

        {recentDonations.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={64} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Sin transacciones aún</Text>
            <Text style={styles.emptyText}>Comparte tu QR para recibir donaciones</Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem} activeOpacity={0.7}>
          <Ionicons name="home" size={26} color="#6366F1" />
          <Text style={[styles.navText, styles.navTextActive]}>Inicio</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItemCenter}
          onPress={() => navigation.navigate('NFCPayment')}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#6366F1', '#8B5CF6']}
            style={styles.navCenterButton}
          >
            <Ionicons name="phone-portrait" size={28} color="#FFFFFF" />
          </LinearGradient>
          <Text style={styles.navCenterText}>Cobro</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.navigate('Settings')}
          activeOpacity={0.7}
        >
          <Ionicons name="settings-outline" size={26} color="#64748B" />
          <Text style={styles.navText}>Ajustes</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#1E293B',
  },
  profileButton: {},
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: { flex: 1, paddingHorizontal: 20, paddingTop: 20 },
  
  // Balance Card
  balanceCard: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  balanceGradient: {
    padding: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceLabel: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
  },
  todayBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  todayText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  balanceAmount: {
    fontSize: 52,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  balanceUnit: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '600',
  },
  usdConversion: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  usdAmount: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '500',
  },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
  },
  tapHintText: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.8)',
  },

  // QR Card
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  qrHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  qrTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  qrSubtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  qrIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#EEF2FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tapHint2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tapHintText2: {
    fontSize: 13,
    color: '#6366F1',
    fontWeight: '500',
  },

  // Botón test
  testButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FEF3C7',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: '#FDE68A',
    borderStyle: 'dashed',
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },

  // Transacciones
  transactionsSection: {
    marginBottom: 24,
  },
  transactionsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6366F1',
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionDetails: { flex: 1 },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 13,
    color: '#94A3B8',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#10B981',
  },

  // Empty state
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#475569',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
  },

  // Bottom Nav
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 10,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  navItemCenter: {
    flex: 1,
    alignItems: 'center',
    marginTop: -24,
  },
  navCenterButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  navText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 4,
    fontWeight: '500',
  },
  navTextActive: {
    color: '#6366F1',
    fontWeight: '600',
  },
  navCenterText: {
    fontSize: 10,
    color: '#6366F1',
    marginTop: 6,
    fontWeight: '600',
  },
});