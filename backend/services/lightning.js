const axios = require('axios');

const STRIKE_API_URL = process.env.STRIKE_API_URL || 'https://api.strike.me';
const STRIKE_API_KEY = process.env.STRIKE_API_KEY;

async function createInvoice(amountSats, description, userNpub) {
  const amountBTC = (amountSats / 100000000).toFixed(8);

  const response = await axios.post(
    `${STRIKE_API_URL}/v1/receive-requests`,
    {
      bolt11: {
        amount: { currency: 'BTC', amount: amountBTC },
        description: description || 'Pago Pide Wallet'
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

  return {
    success: true,
    invoiceId: response.data.receiveRequestId,
    lightningInvoice: response.data.bolt11?.invoice,
    amountSats,
    amountBTC: response.data.bolt11?.btcAmount,
    description,
    expiresAt: response.data.bolt11?.expires,
    userNpub
  };
}

async function getQuote(amountUSD) {
  try {
    const response = await axios.get(
      'https://api.coingecko.com/api/v3/simple/price',
      { params: { ids: 'bitcoin', vs_currencies: 'usd' } }
    );
    const btcPriceUSD = response.data.bitcoin.usd;
    const sats = Math.floor((amountUSD / btcPriceUSD) * 100000000);
    
    return {
      success: true,
      amountUSD,
      amountSats: sats,
      amountBTC: (sats / 100000000).toFixed(8),
      btcPriceUSD,
      timestamp: new Date().toISOString()
    };
  } catch {
    const fallbackPrice = 100000;
    const sats = Math.floor((amountUSD / fallbackPrice) * 100000000);
    return {
      success: true,
      amountUSD,
      amountSats: sats,
      amountBTC: (sats / 100000000).toFixed(8),
      btcPriceUSD: fallbackPrice,
      warning: 'Fallback price used'
    };
  }
}

async function checkPaymentStatus(receiveRequestId) {
  const response = await axios.get(
    `${STRIKE_API_URL}/v1/receive-requests/${receiveRequestId}`,
    { headers: { 'Authorization': `Bearer ${STRIKE_API_KEY}` } }
  );
  
  return {
    success: true,
    invoiceId: receiveRequestId,
    isPaid: response.data.completed === true,
    status: response.data.completed ? 'PAID' : 'PENDING'
  };
}

module.exports = { createInvoice, getQuote, checkPaymentStatus };