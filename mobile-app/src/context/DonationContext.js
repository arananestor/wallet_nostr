import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { getNostrKeys } from '../utils/storage';
import { createNostrClient, subscribeToZaps } from '../services/nostr';

const DonationContext = createContext();

export function DonationProvider({ children }) {
  const [currentDonation, setCurrentDonation] = useState(null);
  const [donations, setDonations] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionRef = useRef(null);
  const ndkRef = useRef(null);
  
  useEffect(() => {
    connectToNostr();
    
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.stop();
      }
    };
  }, []);
  
  const connectToNostr = async () => {
    try {
      const keys = await getNostrKeys();
      if (!keys) return;
      
      const ndk = await createNostrClient(keys.privateKey);
      ndkRef.current = ndk;
      setIsConnected(true);
      
      subscriptionRef.current = subscribeToZaps(ndk, keys.npub, handleNewZap);
    } catch (error) {
      console.error('Error connecting to Nostr:', error);
      setIsConnected(false);
    }
  };
  
  const handleNewZap = (zapInfo) => {
    const donation = {
      id: Date.now().toString(),
      sender: zapInfo.sender === 'Anónimo' ? 'Anónimo' : zapInfo.sender.substring(0, 8),
      amount: zapInfo.amount,
      timestamp: zapInfo.timestamp || Date.now(),
      date: new Date().toISOString().split('T')[0],
    };
    
    setDonations((prev) => [donation, ...prev]);
    setCurrentDonation(donation);
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
  
  return (
    <DonationContext.Provider
      value={{
        currentDonation,
        clearCurrentDonation,
        donations,
        isConnected,
        getTodayDonations,
        getTotalToday,
        getTotalAll,
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