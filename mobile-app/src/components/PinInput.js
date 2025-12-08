import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';

export default function PinInput({ pin, onPinChange, maxLength = 6 }) {
  const handleNumberPress = (number) => {
    if (pin.length < maxLength) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPinChange(pin + number);
    }
  };
  
  const handleDelete = () => {
    if (pin.length > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPinChange(pin.slice(0, -1));
    }
  };
  
  return (
    <View style={styles.container}>
      {/* Círculos indicadores */}
      <View style={styles.dotsContainer}>
        {[...Array(maxLength)].map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              index < pin.length && styles.dotFilled,
            ]}
          />
        ))}
      </View>
      
      {/* Teclado numérico */}
      <View style={styles.keyboard}>
        {[[1, 2, 3], [4, 5, 6], [7, 8, 9]].map((row, rowIndex) => (
          <View key={rowIndex} style={styles.row}>
            {row.map((number) => (
              <TouchableOpacity
                key={number}
                style={styles.key}
                onPress={() => handleNumberPress(number.toString())}
              >
                <Text style={styles.keyText}>{number}</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
        
        {/* Última fila con 0 y borrar */}
        <View style={styles.row}>
          <View style={styles.key} />
          <TouchableOpacity
            style={styles.key}
            onPress={() => handleNumberPress('0')}
          >
            <Text style={styles.keyText}>0</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.key}
            onPress={handleDelete}
          >
            <Text style={styles.deleteText}>⌫</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  dotsContainer: {
    flexDirection: 'row',
    marginBottom: 50,
    gap: 15,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#ddd',
  },
  dotFilled: {
    backgroundColor: '#F7931A',
    borderColor: '#F7931A',
  },
  keyboard: {
    width: '100%',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 15,
  },
  key: {
    width: 75,
    height: 75,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 37.5,
    marginHorizontal: 15,
  },
  keyText: {
    fontSize: 28,
    fontWeight: '400',
    color: '#333',
  },
  deleteText: {
    fontSize: 28,
    color: '#F7931A',
  },
});