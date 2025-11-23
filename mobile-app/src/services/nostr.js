import NDK, { NDKEvent, NDKPrivateKeySigner } from '@nostr-dev-kit/ndk';
import { generateSecretKey, getPublicKey, nip19 } from 'nostr-tools';

const RELAYS = [
  'wss://relay.damus.io',
  'wss://relay.primal.net',
  'wss://nos.lol',
  'wss://relay.nostr.band',
];

export function generateNostrKeys() {
  const privateKey = generateSecretKey();
  const publicKey = getPublicKey(privateKey);
  const nsec = nip19.nsecEncode(privateKey);
  const npub = nip19.npubEncode(publicKey);
  
  return {
    privateKey: Buffer.from(privateKey).toString('hex'),
    publicKey,
    nsec,
    npub,
  };
}

export async function createNostrClient(privateKeyHex = null) {
  let signer = null;
  
  if (privateKeyHex) {
    const privateKeyBytes = Buffer.from(privateKeyHex, 'hex');
    signer = new NDKPrivateKeySigner(privateKeyBytes);
  }
  
  const ndk = new NDK({
    explicitRelayUrls: RELAYS,
    signer,
  });
  
  await ndk.connect();
  return ndk;
}

export async function publishProfile(ndk, profile) {
  const event = new NDKEvent(ndk);
  event.kind = 0;
  event.content = JSON.stringify({
    name: profile.name,
    about: profile.about || '',
    picture: profile.picture || '',
    lud16: profile.lud16,
  });
  
  await event.publish();
  return event;
}

export async function getProfile(ndk, npub) {
  const { data: publicKey } = nip19.decode(npub);
  
  const events = await ndk.fetchEvents({
    kinds: [0],
    authors: [publicKey],
  });
  
  if (events.size === 0) return null;
  
  const event = Array.from(events)[0];
  return JSON.parse(event.content);
}

export function subscribeToZaps(ndk, npub, onZap) {
  const { data: publicKey } = nip19.decode(npub);
  
  const sub = ndk.subscribe({
    kinds: [9735],
    '#p': [publicKey],
  });
  
  sub.on('event', (event) => {
    const zapInfo = parseZapEvent(event);
    onZap(zapInfo);
  });
  
  return sub;
}

function parseZapEvent(event) {
  const amountTag = event.tags.find(t => t[0] === 'amount');
  const senderTag = event.tags.find(t => t[0] === 'P');
  
  return {
    amount: amountTag ? parseInt(amountTag[1]) / 1000 : 0,
    sender: senderTag ? senderTag[1] : 'Anónimo',
    timestamp: event.created_at,
  };
}

export function generateQRData(npub, lightningAddress) {
  return lightningAddress;
}