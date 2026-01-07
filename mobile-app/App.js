import './src/polyfills';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { DonationProvider } from './src/context/DonationContext';
import { ToastProvider } from './src/context/ToastContext';
import { AppLockProvider } from './src/context/AppLockContext';
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
import SetupPinScreen from './src/screens/SetupPinScreen';
import PinLoginScreen from './src/screens/PinLoginScreen';
import PinVerificationScreen from './src/screens/PinVerificationScreen';
import NFCPaymentScreen from './src/screens/NFCPaymentScreen';

const Stack = createNativeStackNavigator();

function AppNavigator() {
  return (
    <AppLockProvider>
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
        <Stack.Screen name="SetupPin" component={SetupPinScreen} />
        <Stack.Screen name="PinLogin" component={PinLoginScreen} />
        <Stack.Screen name="NFCPayment" component={NFCPaymentScreen} options={{ headerShown: false }} />
        <Stack.Screen 
          name="PinVerification" 
          component={PinVerificationScreen}
          options={{
            presentation: 'modal',
            gestureEnabled: false,
          }}
        />
      </Stack.Navigator>
    </AppLockProvider>
  );
}

export default function App() {
  return (
    <ToastProvider>
      <DonationProvider>
        <NavigationContainer>
          <AppNavigator />
        </NavigationContainer>
      </DonationProvider>
    </ToastProvider>
  );
}