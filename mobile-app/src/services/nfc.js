import NfcManager, { NfcTech, Ndef } from 'react-native-nfc-manager';

class NFCService {
  constructor() {
    this.isInitialized = false;
  }

  async initialize() {
    try {
      const supported = await NfcManager.isSupported();
      if (supported) {
        await NfcManager.start();
        this.isInitialized = true;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error inicializando NFC:', error);
      return false;
    }
  }

  async writePaymentRequest(amount, lightningAddress) {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const paymentData = JSON.stringify({
        type: 'lightning_payment',
        amount: amount,
        lud16: lightningAddress,
        timestamp: Date.now(),
      });

      const bytes = Ndef.encodeMessage([Ndef.textRecord(paymentData)]);
      await NfcManager.ndefHandler.writeNdefMessage(bytes);

      return { success: true };
    } catch (error) {
      console.error('Error escribiendo NFC:', error);
      return { success: false, error: error.message };
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }

  async readPaymentRequest(onRead) {
    try {
      await NfcManager.requestTechnology(NfcTech.Ndef);

      const tag = await NfcManager.getTag();
      
      if (tag && tag.ndefMessage && tag.ndefMessage.length > 0) {
        const record = tag.ndefMessage[0];
        const text = Ndef.text.decodePayload(record.payload);
        
        try {
          const paymentData = JSON.parse(text);
          
          if (paymentData.type === 'lightning_payment') {
            onRead({
              amount: paymentData.amount,
              lightningAddress: paymentData.lud16,
              timestamp: paymentData.timestamp,
            });
            return { success: true, data: paymentData };
          }
        } catch (parseError) {
          console.error('Error parseando datos NFC:', parseError);
        }
      }

      return { success: false, error: 'No se encontraron datos válidos' };
    } catch (error) {
      console.error('Error leyendo NFC:', error);
      return { success: false, error: error.message };
    } finally {
      NfcManager.cancelTechnologyRequest();
    }
  }

  async cancelOperation() {
    try {
      await NfcManager.cancelTechnologyRequest();
    } catch (error) {
      console.error('Error cancelando NFC:', error);
    }
  }

  async cleanup() {
    try {
      await NfcManager.cancelTechnologyRequest();
      await NfcManager.unregisterTagEvent();
    } catch (error) {
      console.error('Error limpiando NFC:', error);
    }
  }
}

export default new NFCService();