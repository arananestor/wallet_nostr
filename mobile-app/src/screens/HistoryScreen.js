import { View, Text, StyleSheet, SectionList, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
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
      <Text style={styles.donationAmount}>+{item.amount} sats</Text>
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
            <Text style={styles.statValue}>{totalToday}</Text>
            <Text style={styles.statUnit}>sats</Text>
          </View>
          
          <View style={[styles.statBox, styles.statBoxHighlight]}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={[styles.statValue, styles.statValueHighlight]}>{totalAll}</Text>
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
                  color: (opacity = 1) => `rgba(247, 147, 26, ${opacity})`,
                  labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
                  style: { borderRadius: 16 },
                  propsForDots: {
                    r: '4',
                    strokeWidth: '2',
                    stroke: '#F7931A',
                  },
                }}
                bezier
                style={styles.chart}
              />
            </View>
            
            <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
              <Text style={styles.exportButtonText}>📊 Exportar a CSV</Text>
            </TouchableOpacity>
          </>
        )}
        
        {donations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>💰</Text>
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
  container: { flex: 1, backgroundColor: '#fff' },
  content: { flex: 1, padding: 20 },
  statsRow: { flexDirection: 'row', gap: 15, marginBottom: 15 },
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
  chartContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
  },
  chartTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 10,
  },
  chart: {
    borderRadius: 10,
  },
  exportButton: {
    backgroundColor: '#F7931A',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  exportButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  list: { flex: 1 },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f9f9f9',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    marginTop: 10,
    marginBottom: 5,
  },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#333', textTransform: 'capitalize' },
  sectionTotal: { fontSize: 14, fontWeight: '600', color: '#F7931A' },
  donationItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  donationLeft: {},
  senderName: { fontSize: 16, fontWeight: '500', color: '#333' },
  donationTime: { fontSize: 12, color: '#999', marginTop: 2 },
  donationAmount: { fontSize: 18, fontWeight: 'bold', color: '#00AA00' },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyIcon: { fontSize: 60, marginBottom: 20 },
  emptyText: { fontSize: 18, fontWeight: '600', color: '#333', marginBottom: 5 },
  emptySubtext: { fontSize: 14, color: '#999' },
});