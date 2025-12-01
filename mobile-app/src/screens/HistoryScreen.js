import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import Header from '../components/Header';
import { useDonations } from '../context/DonationContext';

export default function HistoryScreen() {
  const { donations, getTotalToday, getTotalAll } = useDonations();
  
  const formatDate = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const renderDonation = ({ item }) => (
    <View style={styles.donationItem}>
      <View style={styles.donationLeft}>
        <Text style={styles.senderName}>{item.sender}</Text>
        <Text style={styles.donationDate}>{formatDate(item.timestamp)}</Text>
      </View>
      <Text style={styles.donationAmount}>+{item.amount} sats</Text>
    </View>
  );
  
  const totalToday = getTotalToday();
  const totalAll = getTotalAll();
  
  return (
    <View style={styles.container}>
      <Header title="Historial" />
      
      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Hoy</Text>
            <Text style={styles.statValue}>{totalToday}</Text>
            <Text style={styles.statUnit}>sats</Text>
          </View>
          
          <View style={[styles.statBox, styles.statBoxHighlight]}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, styles.statValueHighlight]}>{totalAll}</Text>
            <Text style={styles.statUnit}>sats</Text>
          </View>
        </View>
        
        {donations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>Aún no hay donaciones</Text>
            <Text style={styles.emptySubtext}>Cuando recibas sats, aparecerán aquí</Text>
          </View>
        ) : (
          <FlatList
            data={donations}
            renderItem={renderDonation}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 25 },
  statBox: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
  },
  statBoxHighlight: { backgroundColor: '#FFF3E0' },
  statLabel: { fontSize: 14, color: '#666', marginBottom: 5 },
  statValue: { fontSize: 28, fontWeight: 'bold', color: '#333' },
  statValueHighlight: { color: '#F7931A' },
  statUnit: { fontSize: 12, color: '#999' },
  list: { flex: 1 },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  donationLeft: {},
  senderName: { fontSize: 16, fontWeight: '600', color: '#333' },
  donationDate: { fontSize: 12, color: '#999', marginTop: 3 },
  donationAmount: { fontSize: 18, fontWeight: 'bold', color: '#00AA00' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: '#999' },
});