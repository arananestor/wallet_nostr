import { View, Text, StyleSheet, SectionList, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system';
import Header from '../components/Header';
import { useDonations } from '../context/DonationContext';
import { useToast } from '../context/ToastContext';

const screenWidth = Dimensions.get('window').width;

export default function HistoryScreen() {
  const { donations, getTotalToday, getTotalAll, getDonationsByDate } = useDonations();
  const { showToast } = useToast();
  
  const formatDate = (dateString) => {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    
    if (dateString === today) return 'Hoy';
    if (dateString === yesterday) return 'Ayer';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  };
  
  const formatTime = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };
  
  const formatDateForCSV = (timestamp) => {
    const date = new Date(timestamp * 1000);
    return date.toLocaleDateString('es-ES');
  };
  
  const getLast7DaysData = () => {
    const last7Days = [];
    const labels = [];
    const dataPoints = [];
    
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      last7Days.push(dateString);
      
      const dayName = i === 0 ? 'Hoy' : date.toLocaleDateString('es-ES', { weekday: 'short' });
      labels.push(dayName);
    }
    
    last7Days.forEach((date) => {
      const dayDonations = donations.filter((d) => d.date === date);
      const total = dayDonations.reduce((sum, d) => sum + d.amount, 0);
      dataPoints.push(total);
    });
    
    return { labels, dataPoints };
  };
  
  const exportToCSV = async () => {
    if (donations.length === 0) {
      showToast('No hay donaciones para exportar', 'warning');
      return;
    }
    
    try {
      let csvContent = 'Fecha,Hora,Donante,Cantidad (sats)\n';
      
      donations.forEach((donation) => {
        const fecha = formatDateForCSV(donation.timestamp);
        const hora = formatTime(donation.timestamp);
        const donante = donation.sender;
        const cantidad = donation.amount;
        
        csvContent += `${fecha},${hora},${donante},${cantidad}\n`;
      });
      
      csvContent += `\nTotal,,,${getTotalAll()}\n`;
      
      const today = new Date().toISOString().split('T')[0];
      const fileName = `donaciones_${today}.csv`;
      const fileUri = FileSystem.documentDirectory + fileName;
      
      await FileSystem.writeAsStringAsync(fileUri, csvContent, {
        encoding: FileSystem.EncodingType.UTF8,
      });
      
      const canShare = await Sharing.isAvailableAsync();
      
      if (canShare) {
        await Sharing.shareAsync(fileUri, {
          mimeType: 'text/csv',
          dialogTitle: 'Exportar historial de donaciones',
          UTI: 'public.comma-separated-values-text',
        });
        showToast('Archivo exportado', 'success');
      } else {
        showToast('No se puede compartir en este dispositivo', 'error');
      }
      
    } catch (error) {
      console.error('Error exportando CSV:', error);
      showToast('Error al exportar', 'error');
    }
  };
  
  const groupedDonations = getDonationsByDate();
  const sections = Object.keys(groupedDonations)
    .sort((a, b) => b.localeCompare(a))
    .map((date) => ({
      title: formatDate(date),
      total: groupedDonations[date].reduce((sum, d) => sum + d.amount, 0),
      data: groupedDonations[date],
    }));
  
  const renderDonation = ({ item }) => (
    <View style={styles.donationItem}>
      <View style={styles.donationLeft}>
        <Text style={styles.senderName}>{item.sender}</Text>
        <Text style={styles.donationTime}>{formatTime(item.timestamp)}</Text>
      </View>
      <Text style={styles.donationAmount}>+{item.amount}</Text>
    </View>
  );
  
  const renderSectionHeader = ({ section }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
      <Text style={styles.sectionTotal}>{section.total} sats</Text>
    </View>
  );
  
  const totalToday = getTotalToday();
  const totalAll = getTotalAll();
  const chartData = getLast7DaysData();
  
  return (
    <View style={styles.container}>
      <Header title="Historial" />
      
      <View style={styles.content}>
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statLabel}>Hoy</Text>
            <Text style={styles.statValue}>{totalToday.toLocaleString()}</Text>
            <Text style={styles.statUnit}>sats</Text>
          </View>
          
          <View style={[styles.statBox, styles.statBoxHighlight]}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, styles.statValueHighlight]}>{totalAll.toLocaleString()}</Text>
            <Text style={styles.statUnit}>sats</Text>
          </View>
        </View>
        
        {donations.length > 0 && (
          <>
            <View style={styles.chartContainer}>
              <Text style={styles.chartTitle}>Últimos 7 días</Text>
              <LineChart
                data={{
                  labels: chartData.labels,
                  datasets: [{ data: chartData.dataPoints.length > 0 ? chartData.dataPoints : [0] }],
                }}
                width={screenWidth - 40}
                height={180}
                chartConfig={{
                  backgroundColor: '#fff',
                  backgroundGradientFrom: '#fff',
                  backgroundGradientTo: '#fff',
                  decimalPlaces: 0,
                  color: (opacity = 1) => `rgba(99, 102, 241, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(71, 85, 105, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#6366F1',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
            
            <TouchableOpacity style={styles.exportButton} onPress={exportToCSV} activeOpacity={0.7}>
              <Ionicons name="download-outline" size={20} color="#FFFFFF" style={styles.exportIcon} />
              <Text style={styles.exportButtonText}>Exportar CSV</Text>
            </TouchableOpacity>
          </>
        )}
        
        {donations.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Ionicons name="wallet-outline" size={48} color="#CBD5E1" />
            </View>
            <Text style={styles.emptyText}>Aún no hay donaciones</Text>
            <Text style={styles.emptySubtext}>Cuando recibas sats, aparecerán aquí</Text>
          </View>
        ) : (
          <SectionList
            sections={sections}
            renderItem={renderDonation}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id}
            style={styles.list}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={true}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  content: { flex: 1, padding: 20 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  statBox: {
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
  statBoxHighlight: { 
    backgroundColor: '#EEF2FF',
  },
  statLabel: { fontSize: 13, color: '#64748B', marginBottom: 8, fontWeight: '500' },
  statValue: { fontSize: 32, fontWeight: 'bold', color: '#1E293B' },
  statValueHighlight: { color: '#6366F1' },
  statUnit: { fontSize: 13, color: '#94A3B8', marginTop: 4 },
  chartContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  chartTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 12,
  },
  chart: {
    borderRadius: 8,
  },
  exportButton: {
    backgroundColor: '#6366F1',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  exportIcon: {
    marginRight: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
  },
  list: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginTop: 8,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  sectionTitle: { fontSize: 15, fontWeight: '600', color: '#1E293B', textTransform: 'capitalize' },
  sectionTotal: { fontSize: 14, fontWeight: '600', color: '#6366F1' },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  donationLeft: {},
  senderName: { fontSize: 15, fontWeight: '600', color: '#1E293B', marginBottom: 4 },
  donationTime: { fontSize: 13, color: '#94A3B8' },
  donationAmount: { fontSize: 18, fontWeight: 'bold', color: '#10B981' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyIconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#475569', marginBottom: 8 },
  emptySubtext: { fontSize: 14, color: '#94A3B8' },
});