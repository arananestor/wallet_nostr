import { 
  generateNostrKeys, 
  createNostrClient, 
  publishProfile,
  getProfile 
} from './src/services/nostr.js';

async function testNostr() {
  console.log('🧪 PROBANDO SERVICIO NOSTR\n');
  
  try {
    // 1. GENERAR LLAVES
    console.log(' Generando llaves...');
    const keys = generateNostrKeys();
    console.log('   nsec:', keys.nsec.substring(0, 20) + '...');
    console.log('   npub:', keys.npub.substring(0, 20) + '...');
    console.log('');
    
    // 2. CONECTAR A NOSTR
    console.log(' Conectando a relays...');
    const ndk = await createNostrClient(keys.privateKey);
    console.log('');
    
    // 3. PUBLICAR PERFIL
    console.log(' Publicando perfil...');
    const event = await publishProfile(ndk, {
      name: 'Juan Pérez - TEST',
      about: 'Hago malabares en el semáforo',
      lud16: 'juan@chivo.com',
    });
    console.log('   Event ID:', event.id.substring(0, 16) + '...');
    console.log('');
    
    // 4. LEER PERFIL
    console.log(' Esperando 3 segundos para leer perfil...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const profile = await getProfile(ndk, keys.npub);
    console.log('   Perfil leído:', profile);
    console.log('');
    
    console.log('✅ PRUEBA COMPLETA\n');
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    console.error(error);
  }
  
  process.exit(0);
}

testNostr();