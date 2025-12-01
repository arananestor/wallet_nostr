import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  NOSTR_KEYS: 'nostr_keys',
  USER_PROFILE: 'user_profile',
  DONATIONS: 'donations',
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

// === LIMPIAR TODO ===

export async function clearAllData() {
  try {
    await AsyncStorage.multiRemove([
      KEYS.NOSTR_KEYS,
      KEYS.USER_PROFILE,
      KEYS.DONATIONS,
    ]);
  } catch (error) {
    console.error('Error clearing data:', error);
  }
}