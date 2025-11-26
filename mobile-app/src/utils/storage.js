import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  NOSTR_PRIVATE_KEY: '@nostr_private_key',
  NOSTR_PUBLIC_KEY: '@nostr_public_key',
  NOSTR_NSEC: '@nostr_nsec',
  NOSTR_NPUB: '@nostr_npub',
  USER_PROFILE: '@user_profile',
};

export async function saveNostrKeys(keys) {
  await AsyncStorage.multiSet([
    [KEYS.NOSTR_PRIVATE_KEY, keys.privateKey],
    [KEYS.NOSTR_PUBLIC_KEY, keys.publicKey],
    [KEYS.NOSTR_NSEC, keys.nsec],
    [KEYS.NOSTR_NPUB, keys.npub],
  ]);
}

export async function getNostrKeys() {
  const values = await AsyncStorage.multiGet([
    KEYS.NOSTR_PRIVATE_KEY,
    KEYS.NOSTR_PUBLIC_KEY,
    KEYS.NOSTR_NSEC,
    KEYS.NOSTR_NPUB,
  ]);
  
  if (!values[0][1]) return null;
  
  return {
    privateKey: values[0][1],
    publicKey: values[1][1],
    nsec: values[2][1],
    npub: values[3][1],
  };
}

export async function saveUserProfile(profile) {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function getUserProfile() {
  const profile = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return profile ? JSON.parse(profile) : null;
}

export async function clearAllData() {
  await AsyncStorage.clear();
}