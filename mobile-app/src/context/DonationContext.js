import { createContext, useContext, useState, useEffect, useRef } from 'react';
import * as Haptics from 'expo-haptics';
import { getNostrKeys, getDonations, addDonation } from '../utils/storage';
import { createNostrClient, subscribeToZaps } from '../services/nostr';

const DonationContext = createContext();

export function DonationProvider({ children }) {
  const [currentDonation, setCurrentDonation] = useState(null);
  const [donations, setDonations] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const subscriptionRef = useRef(null);
  const ndkRef = useRef(null);
  
  useEffect(() => {
    initializeApp();
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.stop();
      }
    };
  }, []);
  
  const initializeApp = async () => {
    await loadSavedDonations();
    await connectToNostr();
    setIsLoading(false);
  };
  
  const loadSavedDonations = async () => {
    try {
      const savedDonations = await getDonations();
      if (savedDonations && savedDonations.length > 0) {
        setDonations(savedDonations);
        console.log(`📦 Cargadas ${savedDonations.length} donaciones guardadas`);
      }
    } catch (error) {
      console.error('Error loading saved donations:', error);
    }
  };
  
  const connectToNostr = async () => {
    try {
      const keys = await getNostrKeys();
      if (!keys) {
        console.log('⚠️ No hay llaves, no se puede conectar a Nostr');
        return false;
      }
      
      // Desconectar suscripción anterior si existe
      if (subscriptionRef.current) {
        subscriptionRef.current.stop();
      }
      
      console.log('🔌 Conectando a Nostr...');
      const ndk = await createNostrClient(keys.privateKey);
      ndkRef.current = ndk;
      setIsConnected(true);
      console.log('✅ Conectado a Nostr');
      
      subscriptionRef.current = subscribeToZaps(ndk, keys.npub, handleNewZap);
      console.log('👂 Escuchando zaps...');
      
      return true;
    } catch (error) {
      console.error('❌ Error connecting to Nostr:', error);
      setIsConnected(false);
      return false;
    }
  };
  
  const refresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 Refrescando...');
    
    // Recargar donaciones guardadas
    await loadSavedDonations();
    
    // Reconectar a Nostr
    const connected = await connectToNostr();
    
    // Vibración suave para indicar que terminó
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setIsRefreshing(false);
    console.log('✅ Refresh completado');
    
    return connected;
  };
  
  const handleNewZap = async (zapInfo) => {
    const donation = {
      id: Date.now().toString(),
      sender: zapInfo.sender === 'Anónimo' ? 'Anónimo' : zapInfo.sender.substring(0, 8),
      amount: zapInfo.amount,
      timestamp: zapInfo.timestamp || Math.floor(Date.now() / 1000),
      date: new Date().toISOString().split('T')[0],
    };
    
    // Vibración fuerte para notificar donación
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    // Guardar en storage y actualizar estado
    const updatedDonations = await addDonation(donation);
    setDonations(updatedDonations);
    setCurrentDonation(donation);
    
    console.log(`💰 Nueva donación: ${donation.amount} sats de ${donation.sender}`);
  };
  
  const clearCurrentDonation = () => {
    setCurrentDonation(null);
  };
  
  const getTodayDonations = () => {
    const today = new Date().toISOString().split('T')[0];
    return donations.filter((d) => d.date === today);
  };
  
  const getTotalToday = () => {
    return getTodayDonations().reduce((sum, d) => sum + d.amount, 0);
  };
  
  const getTotalAll = () => {
    return donations.reduce((sum, d) => sum + d.amount, 0);
  };
  
  const getDonationsByDate = () => {
    const grouped = {};
    donations.forEach((d) => {
      if (!grouped[d.date]) {
        grouped[d.date] = [];
      }
      grouped[d.date].push(d);
    });
    return grouped;
  };
  
  const simulateDonation = async () => {
    const nombres = ['Carlos', 'María', 'Juan', 'Ana', 'Pedro', 'Sofía', 'Luis', 'Carmen'];
    const testDonation = {
      id: Date.now().toString(),
      sender: nombres[Math.floor(Math.random() * nombres.length)],
      amount: Math.floor(Math.random() * 1000) + 100,
      timestamp: Math.floor(Date.now() / 1000),
      date: new Date().toISOString().split('T')[0],
    };
    
    // Vibración para simular donación real
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    const updatedDonations = await addDonation(testDonation);
    setDonations(updatedDonations);
    setCurrentDonation(testDonation);
  };
  
  return (
    <DonationContext.Provider
      value={{
        currentDonation,
        clearCurrentDonation,
        donations,
        isConnected,
        isLoading,
        isRefreshing,
        refresh,
        getTodayDonations,
        getTotalToday,
        getTotalAll,
        getDonationsByDate,
        simulateDonation,
      }}
    >
      {children}
    </DonationContext.Provider>
  );
}

export function useDonations() {
  const context = useContext(DonationContext);
  if (!context) {
    throw new Error('useDonations must be used within DonationProvider');
  }
  return context;
}