require('dotenv').config();
const axios = require('axios');

const STRIKE_API_KEY = process.env.STRIKE_API_KEY;
const STRIKE_API_URL = 'https://api.strike.me';

async function testStrike() {
  console.log('🔍 Probando conexión con Strike (BTC)...\n');

  try {
    const response = await axios.post(
      `${STRIKE_API_URL}/v1/receive-requests`,
      {
        bolt11: {
          amount: {
            currency: 'BTC',
            amount: '0.00001000'  // 1000 satoshis ≈ $1 USD
          },
          description: 'Test Pide Wallet'
        },
        targetCurrency: 'BTC'
      },
      {
        headers: {
          'Authorization': `Bearer ${STRIKE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    console.log('✅ ÉXITO!\n');
    console.log('Invoice ID:', response.data.receiveRequestId);
    console.log('Lightning Invoice:', response.data.bolt11?.invoice?.substring(0, 50) + '...');
    console.log('\nRespuesta completa:');
    console.log(JSON.stringify(response.data, null, 2));

  } catch (error) {
    console.log('❌ ERROR\n');
    console.log('Status:', error.response?.status);
    console.log('Detalles:', JSON.stringify(error.response?.data, null, 2));
  }
}

testStrike();