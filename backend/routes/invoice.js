const express = require('express');
const router = express.Router();
const { createInvoice, getQuote, checkPaymentStatus } = require('../services/lightning');

router.post('/create', async (req, res) => {
  try {
    const { amountUSD, amountSats, userNpub, description } = req.body;

    if (!amountUSD && !amountSats) {
      return res.status(400).json({ success: false, error: 'Falta monto (amountUSD o amountSats)' });
    }
    if (!userNpub) {
      return res.status(400).json({ success: false, error: 'Falta userNpub' });
    }

    let finalSats = amountSats;

    // Si viene en USD, convertir a sats
    if (amountUSD && !amountSats) {
      const quote = await getQuote(parseFloat(amountUSD));
      finalSats = quote.amountSats;
    }

    const invoice = await createInvoice(
      parseInt(finalSats),
      description || 'Pago Pide Wallet',
      userNpub
    );

    res.json({ success: true, invoice });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Error creando invoice',
      details: error.error || error.message
    });
  }
});

router.get('/quote', async (req, res) => {
  try {
    const { amount } = req.query;
    if (!amount) {
      return res.status(400).json({ success: false, error: 'Falta amount. Ej: /quote?amount=5' });
    }
    const quote = await getQuote(parseFloat(amount));
    res.json({ success: true, quote });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error obteniendo cotización' });
  }
});

router.get('/status/:invoiceId', async (req, res) => {
  try {
    const { invoiceId } = req.params;
    const status = await checkPaymentStatus(invoiceId);
    res.json({ success: true, status });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Error verificando estado' });
  }
});

module.exports = router;