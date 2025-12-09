import { createContext, useContext, useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { isPinEnabled } from '../utils/storage';

const AppLockContext = createContext();

export function AppLockProvider({ children }) {
  const appState = useRef(AppState.currentState);
  const navigation = useNavigation();
  const lockTimeoutRef = useRef(null);
  
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription.remove();
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
    };
  }, []);
  
  const handleAppStateChange = async (nextAppState) => {
    // Si la app va a segundo plano o se bloquea
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      console.log('📱 App va a segundo plano');
      
      // Después de 1 segundo en background, requerir PIN
      lockTimeoutRef.current = setTimeout(async () => {
        const pinEnabled = await isPinEnabled();
        if (pinEnabled) {
          console.log('🔒 PIN será requerido al volver');
        }
      }, 1000);
    }
    
    // Si la app vuelve al frente
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      console.log('📱 App volvió al frente');
      
      if (lockTimeoutRef.current) {
        clearTimeout(lockTimeoutRef.current);
      }
      
      const pinEnabled = await isPinEnabled();
      if (pinEnabled) {
        console.log('🔒 Pidiendo PIN');
        navigation.navigate('PinVerification');
      }
    }
    
    appState.current = nextAppState;
  };
  
  return (
    <AppLockContext.Provider value={{}}>
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  return useContext(AppLockContext);
}