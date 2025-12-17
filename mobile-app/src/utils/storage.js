import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';

const KEYS = {
  NOSTR_KEYS: 'nostr_keys',
  USER_PROFILE: 'user_profile',
  DONATIONS: 'donations',
  PIN_HASH: 'pin_hash',
  PIN_ENABLED: 'pin_enabled',
};

// === LLAVES NOSTR ===

export async function saveNostrKeys(keys) {
  try {
    await AsyncStorage.setItem(KEYS.NOSTR_KEYS, JSON.stringify(keys));
  } catch (error) {
    console.error('Error saving Nostr keys:', error);
  }
}

export async function getNostrKeys() {
  try {
    const keys = await AsyncStorage.getItem(KEYS.NOSTR_KEYS);
    return keys ? JSON.parse(keys) : null;
  } catch (error) {
    console.error('Error getting Nostr keys:', error);
    return null;
  }
}

// === PERFIL DE USUARIO ===

export async function saveUserProfile(profile) {
  try {
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch (error) {
    console.error('Error saving user profile:', error);
  }
}

export async function getUserProfile() {
  try {
    const profile = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    return profile ? JSON.parse(profile) : null;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
}

// === DONACIONES ===

export async function saveDonations(donations) {
  try {
    await AsyncStorage.setItem(KEYS.DONATIONS, JSON.stringify(donations));
  } catch (error) {
    console.error('Error saving donations:', error);
  }
}

export async function getDonations() {
  try {
    const donations = await AsyncStorage.getItem(KEYS.DONATIONS);
    return donations ? JSON.parse(donations) : [];
  } catch (error) {
    console.error('Error getting donations:', error);
    return [];
  }
}

export async function addDonation(donation) {
  try {
    const donations = await getDonations();
    const updatedDonations = [donation, ...donations];
    await saveDonations(updatedDonations);
    return updatedDonations;
  } catch (error) {
    console.error('Error adding donation:', error);
    return [];
  }
}

// === PIN DE SEGURIDAD ===

export async function hashPin(pin) {
  try {
    const hash = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
    return hash;
  } catch (error) {
    console.error('Error hashing PIN:', error);
    return null;
  }
}

export async function savePinHash(pin) {
  try {
    const hash = await hashPin(pin);
    if (hash) {
      await AsyncStorage.setItem(KEYS.PIN_HASH, hash);
      await AsyncStorage.setItem(KEYS.PIN_ENABLED, 'true');
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error saving PIN hash:', error);
    return false;
  }
}

export async function verifyPin(pin) {
  try {
    const savedHash = await AsyncStorage.getItem(KEYS.PIN_HASH);
    if (!savedHash) return false;
    
    const inputHash = await hashPin(pin);
    return inputHash === savedHash;
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
}

export async function isPinEnabled() {
  try {
    const enabled = await AsyncStorage.getItem(KEYS.PIN_ENABLED);
    return enabled === 'true';
  } catch (error) {
    return false;
  }
}

export async function disablePin() {
  try {
    await AsyncStorage.multiRemove([KEYS.PIN_HASH, KEYS.PIN_ENABLED]);
  } catch (error) {
    console.error('Error disabling PIN:', error);
  }
}

export async function setBiometricsEnabled(enabled) {
  try {
    await AsyncStorage.setItem('biometricsEnabled', JSON.stringify(enabled));
    return true;
  } catch (error) {
    console.error('Error guardado configuracion biométrica:', error);
    return false;
  }
}

export async function isBiometricsEnabled() {
  try {
    const value = await AsyncStorage.getItem('biometricsEnabled');
    return value === 'true';
  } catch (error) {
    return false;
  }
}

// === LIMPIAR TODO ===

export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove([
      KEYS.NOSTR_KEYS,
      KEYS.USER_PROFILE,
      KEYS.DONATIONS,
      KEYS.PIN_HASH,
      KEYS.PIN_ENABLED,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}