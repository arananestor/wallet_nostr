export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-2xl p-8 text-center">
        <div className="mb-8">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">Pide Wallet</h1>
          <p className="text-xl text-gray-600">Recibe donaciones en Bitcoin de forma instantánea</p>
        </div>
        <div className="bg-purple-50 rounded-2xl p-6 mb-8">
          <p className="text-gray-700 leading-relaxed">Pide Wallet permite a personas en semáforos de El Salvador recibir donaciones en Bitcoin mediante códigos QR. Rápido, seguro y sin comisiones.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <a href="https://github.com" target="_blank" rel="noopener noreferrer" className="bg-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-purple-700 transition-colors">Ver en GitHub</a>
          <a href="/pay?demo=true" className="bg-gray-100 text-gray-800 px-8 py-4 rounded-xl font-semibold hover:bg-gray-200 transition-colors">Ver Demo</a>
        </div>
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">Powered by Lightning Network ⚡</p>
        </div>
      </div>
    </div>
  );
}