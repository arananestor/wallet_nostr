require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Rutas de prueba
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Pide Wallet Backend API',
    version: '1.0.0',
  });
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Rutas principales (las crearemos después)
app.use('/api/invoice', require('./routes/invoice'));
// app.use('/api/webhook', require('./routes/webhook'));

// Manejo de errores
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message,
  });
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`🚀 Backend corriendo en http://localhost:${PORT}`);
  console.log(`📡 Ambiente: ${process.env.NODE_ENV}`);
});

module.exports = app;