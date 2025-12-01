import './src/polyfills';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DonationProvider } from './src/context/DonationContext';
import { ToastProvider } from './src/context/ToastContext';
import DonationOverlay from './src/components/DonationOverlay';

import WelcomeScreen from './src/screens/WelcomeScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import BackupScreen from './src/screens/BackupScreen';
import ConnectWalletScreen from './src/screens/ConnectWalletScreen';
import QRScreen from './src/screens/QRScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import RestoreScreen from './src/screens/RestoreScreen';
import HistoryScreen from './src/screens/HistoryScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <ToastProvider>
      <DonationProvider>
        <NavigationContainer>
          <DonationOverlay />
          <Stack.Navigator screenOptions={{ headerShown: false }}>
            <Stack.Screen name="Welcome" component={WelcomeScreen} />
            <Stack.Screen name="Register" component={RegisterScreen} />
            <Stack.Screen name="Backup" component={BackupScreen} />
            <Stack.Screen name="ConnectWallet" component={ConnectWalletScreen} />
            <Stack.Screen name="QRScreen" component={QRScreen} />
            <Stack.Screen name="Profile" component={ProfileScreen} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
            <Stack.Screen name="Restore" component={RestoreScreen} />
            <Stack.Screen name="History" component={HistoryScreen} />
          </Stack.Navigator>
        </NavigationContainer>
      </DonationProvider>
    </ToastProvider>
  );
}