import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import * as Haptics from 'expo-haptics';
import { getNostrKeys, getDonations, addDonation as saveDonation } from '../utils/storage';
import { createNostrClient, subscribeToZaps } from '../services/nostr';

const DonationContext = createContext();

const MAX_RETRIES = 3;
const RETRY_DELAY = 5000;

export function DonationProvider({ children }) {
  const [currentDonation, setCurrentDonation] = useState(null);
  const [donations, setDonations] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [connectionError, setConnectionError] = useState(null);
  
  const subscriptionRef = useRef(null);
  const ndkRef = useRef(null);
  const retryCountRef = useRef(0);
  const retryTimeoutRef = useRef(null);
  const appStateRef = useRef(AppState.currentState);
  
  useEffect(() => {
    initializeApp();
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      cleanup();
    };
  }, []);
  
  const cleanup = () => {
    if (subscriptionRef.current) {
      try {
        subscriptionRef.current.stop();
      } catch (e) {}
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current);
    }
  };
  
  const handleAppStateChange = (nextAppState) => {
    if (
      appStateRef.current.match(/inactive|background/) &&
      nextAppState === 'active'
    ) {
      console.log('📱 App volvió al frente, verificando conexión...');
      if (!isConnected) {
        retryCountRef.current = 0;
        connectToNostr();
      }
    }
    appStateRef.current = nextAppState;
  };
  
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
        setConnectionError('No hay cuenta configurada');
        return false;
      }
      
      if (subscriptionRef.current) {
        try {
          subscriptionRef.current.stop();
        } catch (e) {}
      }
      
      console.log('🔌 Conectando a Nostr...');
      setConnectionError(null);
      
      const ndk = await createNostrClient(keys.privateKey);
      ndkRef.current = ndk;
      setIsConnected(true);
      retryCountRef.current = 0;
      console.log('✅ Conectado a Nostr');
      
      subscriptionRef.current = subscribeToZaps(ndk, keys.npub, handleNewZap);
      console.log('👂 Escuchando zaps...');
      
      return true;
    } catch (error) {
      console.error('❌ Error connecting to Nostr:', error);
      setIsConnected(false);
      setConnectionError('Error de conexión');
      
      scheduleRetry();
      return false;
    }
  };
  
  const scheduleRetry = () => {
    if (retryCountRef.current < MAX_RETRIES) {
      retryCountRef.current += 1;
      console.log(`🔄 Reintento ${retryCountRef.current}/${MAX_RETRIES} en ${RETRY_DELAY / 1000}s...`);
      
      retryTimeoutRef.current = setTimeout(() => {
        connectToNostr();
      }, RETRY_DELAY);
    } else {
      console.log('❌ Máximo de reintentos alcanzado');
      setConnectionError('No se pudo conectar. Toca para reintentar.');
    }
  };
  
  const manualReconnect = async () => {
    console.log('🔄 Reconexión manual...');
    retryCountRef.current = 0;
    setConnectionError(null);
    return await connectToNostr();
  };
  
  const refresh = async () => {
    setIsRefreshing(true);
    console.log('🔄 Refrescando...');
    
    await loadSavedDonations();
    
    retryCountRef.current = 0;
    const connected = await connectToNostr();
    
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    setIsRefreshing(false);
    console.log('✅ Refresh completado');
    
    return connected;
  };
  
  const handleNewZap = async (zapInfo) => {
    try {
      const donation = {
        id: Date.now().toString(),
        sender: zapInfo.sender === 'Anónimo' ? 'Anónimo' : zapInfo.sender.substring(0, 8),
        amount: zapInfo.amount,
        timestamp: zapInfo.timestamp || Math.floor(Date.now() / 1000),
        date: new Date().toISOString().split('T')[0],
      };
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const updatedDonations = await saveDonation(donation);
      setDonations(updatedDonations);
      setCurrentDonation(donation);
      
      console.log(`💰 Nueva donación: ${donation.amount} sats de ${donation.sender}`);
    } catch (error) {
      console.error('Error processing zap:', error);
    }
  };
  
  // NUEVA FUNCIÓN: addDonation para uso manual (botón test)
  const addDonationManual = async (amount) => {
    try {
      const testDonation = {
        id: Date.now().toString(),
        sender: 'Test',
        amount: amount,
        timestamp: Math.floor(Date.now() / 1000),
        date: new Date().toISOString().split('T')[0],
      };
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const updatedDonations = await saveDonation(testDonation);
      setDonations(updatedDonations);
      setCurrentDonation(testDonation);
      
      console.log(`🧪 Donación de prueba: ${amount} sats`);
    } catch (error) {
      console.error('Error adding manual donation:', error);
    }
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
  
  // AGREGAR: totalAmount como alias
  const totalAmount = getTotalAll();
  
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
    try {
      const nombres = ['Carlos', 'María', 'Juan', 'Ana', 'Pedro', 'Sofía', 'Luis', 'Carmen'];
      const testDonation = {
        id: Date.now().toString(),
        sender: nombres[Math.floor(Math.random() * nombres.length)],
        amount: Math.floor(Math.random() * 1000) + 100,
        timestamp: Math.floor(Date.now() / 1000),
        date: new Date().toISOString().split('T')[0],
      };
      
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      
      const updatedDonations = await saveDonation(testDonation);
      setDonations(updatedDonations);
      setCurrentDonation(testDonation);
    } catch (error) {
      console.error('Error simulating donation:', error);
    }
  };
  
  return (
    <DonationContext.Provider
      value={{
        currentDonation,
        clearCurrentDonation,
        donations,
        totalAmount, // AGREGAR ESTO
        isConnected,
        isLoading,
        isRefreshing,
        connectionError,
        refresh,
        manualReconnect,
        getTodayDonations,
        getTotalToday,
        getTotalAll,
        getDonationsByDate,
        simulateDonation,
        addDonation: addDonationManual, // AGREGAR ESTO
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