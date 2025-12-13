import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import * as Speech from 'expo-speech';
import * as Haptics from 'expo-haptics';

export default function DonationAlert({ donation, onComplete }) {
  const slideAnim = useRef(new Animated.Value(-150)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  
  useEffect(() => {
    if (donation) {
      showAlert();
    }
  }, [donation]);
  
  const showAlert = async () => {
    // Vibración fuerte tipo "Success" - muy distintiva
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 50,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      speakDonation();
    });
  };
  
  const speakDonation = () => {
    // Agregamos signos de exclamación y hacemos la voz más llamativa
    const message = `¡${donation.sender} donó ${donation.amount} sats!`;
    
    Speech.speak(message, {
      language: 'es-MX',
      pitch: 1.3,      // Más agudo = más llamativo (antes era 1.1)
      rate: 1.0,       // Velocidad normal para claridad (antes era 0.9)
      onDone: () => {
        hideAlert();
      },
      onError: () => {
        hideAlert();
      },
    });
  };
  
  const hideAlert = () => {
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -150,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => {
        if (onComplete) onComplete();
      });
    }, 1500);
  };
  
  if (!donation) return null;
  
  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [
            { translateY: slideAnim },
            { scale: scaleAnim },
          ],
          opacity: opacityAnim,
        },
      ]}
    >
      <View style={styles.alertBox}>
        <Text style={styles.senderName}>{donation.sender}</Text>
        <Text style={styles.donationText}> donó </Text>
        <Text style={styles.amount}>{donation.amount} sats</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    alignItems: 'center',
  },
  alertBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  senderName: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#F7931A',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  donationText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
  amount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#00FF00',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
  },
});