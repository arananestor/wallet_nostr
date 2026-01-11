'use client';

import { useSearchParams } from 'next/navigation';
import { useState } from 'react';

export default function PayPage() {
  const searchParams = useSearchParams();
  const userId = searchParams.get('user') || 'demo';
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);

  const handlePayment = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      alert('Ingresa una cantidad válida');
      return;
    }

    setLoading(true);
    
    // Aquí conectaremos con el backend después
    setTimeout(() => {
      alert(`Generando invoice por ${amount} sats...`);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-24 h-24 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👤</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Apoya a este usuario
          </h1>
          <p className="text-gray-600">
            User ID: {userId.slice(0, 8)}...
          </p>
        </div>

        {/* Input de cantidad */}
        <div className="mb-6">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Cantidad en sats
          </label>
          <div className="relative">
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="1000"
              className="w-full px-4 py-4 text-2xl font-bold text-center border-2 border-gray-200 rounded-xl focus:border-purple-500 focus:outline-none"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">
              sats
            </div>
          </div>
          {amount && (
            <p className="text-sm text-gray-500 text-center mt-2">
              ≈ ${(parseFloat(amount) * 0.00043).toFixed(2)} USD
            </p>
          )}
        </div>

        {/* Botón de pago */}
        <button
          onClick={handlePayment}
          disabled={loading || !amount}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-700 text-white py-4 rounded-xl font-bold text-lg hover:from-purple-700 hover:to-purple-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
        >
          {loading ? 'Generando...' : '⚡ Pagar con Lightning'}
        </button>

        {/* Info */}
        <div className="mt-8 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-center gap-2 text-sm text-gray-600">
            <span>🔒</span>
            <span>Pago seguro mediante Lightning Network</span>
          </div>
        </div>

        {/* Métodos próximamente */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-400 mb-3">Próximamente:</p>
          <div className="flex justify-center gap-3">
            <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
              PayPal
            </div>
            <div className="px-3 py-1 bg-gray-100 rounded-full text-xs text-gray-500">
              Tarjeta
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}