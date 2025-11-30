import { useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Share, Alert } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Print from 'expo-print';
import { generateQRData } from '../services/nostr';

export default function QRScreen({ route }) {
  const { npub, lightningAddress, nombre, actividad } = route.params;
  const qrData = generateQRData(npub, lightningAddress);
  const qrRef = useRef();
  
  const handleShare = async () => {
    try {
      await Share.share({
        message: `Envíame sats: ${lightningAddress}`,
      });
    } catch (error) {
      console.error(error);
    }
  };
  
  const generarMensaje = () => {
    if (!actividad) {
      return `Hola, soy ${nombre}`;
    }
    
    const actividadLower = actividad.toLowerCase();
    
    if (actividadLower.includes('vendo') || actividadLower.includes('venta')) {
      return `Yo ${actividad}. Para pagar, escanea aquí`;
    }
    
    return `Yo ${actividad}. Si te gustó, dona aquí`;
  };
  
  const handlePrint = async () => {
    try {
      qrRef.current?.toDataURL(async (dataURL) => {
        const mensaje = generarMensaje();
        
        const html = `
          <html>
            <head>
              <style>
                @page {
                  size: auto;
                  margin: 10mm;
                }
                * {
                  margin: 0;
                  padding: 0;
                  box-sizing: border-box;
                }
                html, body {
                  height: auto;
                  width: 100%;
                }
                body {
                  display: flex;
                  flex-direction: column;
                  align-items: center;
                  padding: 20px;
                  font-family: Arial, sans-serif;
                }
                .container {
                  text-align: center;
                  max-width: 400px;
                }
                .nombre {
                  font-size: 32px;
                  font-weight: bold;
                  margin-bottom: 10px;
                  color: #333;
                }
                .mensaje {
                  font-size: 20px;
                  color: #666;
                  margin-bottom: 25px;
                  line-height: 1.4;
                }
                .qr-image {
                  width: 280px;
                  height: 280px;
                }
                .address {
                  margin-top: 20px;
                  font-size: 14px;
                  color: #999;
                }
              </style>
            </head>
            <body>
              <div class="container">
                <p class="nombre">${nombre}</p>
                <p class="mensaje">${mensaje}</p>
                <img class="qr-image" src="data:image/png;base64,${dataURL}" />
                <p class="address">${lightningAddress}</p>
              </div>
            </body>
          </html>
        `;
        
        await Print.printAsync({ 
          html,
          orientation: Print.Orientation.portrait,
        });
      });
    } catch (error) {
      Alert.alert('Error', 'No se pudo imprimir');
      console.error(error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Tu código QR</Text>
      
      <Text style={styles.subtitle}>
        Muestra este código para recibir donaciones
      </Text>
      
      <View style={styles.qrContainer}>
        <QRCode
          value={qrData}
          size={250}
          backgroundColor="white"
          getRef={(ref) => (qrRef.current = ref)}
        />
      </View>
      
      <Text style={styles.address}>{lightningAddress}</Text>
      
      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.button} onPress={handleShare}>
          <Text style={styles.buttonText}>Compartir</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.buttonSecondary} onPress={handlePrint}>
          <Text style={styles.buttonSecondaryText}>Imprimir</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 40,
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 40,
  },
  qrContainer: {
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
    marginBottom: 30,
  },
  address: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 15,
  },
  button: {
    backgroundColor: '#F7931A',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonSecondary: {
    backgroundColor: '#fff',
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#F7931A',
  },
  buttonSecondaryText: {
    color: '#F7931A',
    fontSize: 18,
    fontWeight: 'bold',
  },
});