import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

const PaymentsScreen = ({ route, navigation }) => {
  const { house, bookingId } = route.params || {};
  const housePrice = house?.price;
  const [transactionId, setTransactionId] = useState('');
  const [loading, setLoading] = useState(false);

  const payNowLink = "https://www.paynow.co.zw/Payment/Link/?q=c2VhcmNoPXRoYWJzdGF5JTQwZ21haWwuY29tJmFtb3VudD0wLjAwJnJlZmVyZW5jZT0mbD0w";

  const handlePayNowPress = () => {
    Linking.openURL(payNowLink).catch(() => alert('Failed to open PayNow link'));
  };

  const handleConfirmPayment = async () => {
    if (!transactionId.trim()) {
      Alert.alert("Error", "Please enter the Transaction ID from PayNow.");
      return;
    }
    if (!bookingId) {
      Alert.alert("Error", "Booking ID missing. Please try again from Home screen.");
      return;
    }

    setLoading(true);
    try {
      await api.post('/bookings/confirm', {
        bookingId,
        transactionId
      });
      setTransactionId('');
      Alert.alert("Success", "Payment recorded! A receipt has been sent to your email.", [
        { text: "OK", onPress: () => navigation.navigate('Student') }
      ]);
    } catch (error) {
      console.error("Payment Error:", error);
      Alert.alert("Error", "Failed to record payment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <View style={styles.cardWrapper}>
          <Text style={styles.title}>Pay for Your Listing</Text>
          <Text style={styles.subtitle}>
            Amount: ${housePrice}.
          </Text>
          <Text style={styles.instruction}>
            1. Click the button below to pay on PayNow.
          </Text>

          <TouchableOpacity onPress={handlePayNowPress} style={styles.paynowBtn}>
            <Image
              source={{ uri: 'https://www.paynow.co.zw/Content/Buttons/Medium_buttons/button_pay-now_medium.png' }}
              style={{ width: 200, height: 60 }}
              resizeMode="contain"
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.instruction}>
            2. After payment, copy the Transaction ID (e.g. 40371450) from the success page and paste it below:
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Enter Transaction ID"
            value={transactionId}
            onChangeText={setTransactionId}
            keyboardType="numeric"
          />

          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirmPayment} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Confirm Payment</Text>}
          </TouchableOpacity>

        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  cardWrapper: {
    width: '100%',
    maxWidth: 400,
    alignSelf: 'center',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#007BFF',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#007BFF', textAlign: 'center' },
  subtitle: { fontSize: 18, color: '#333', textAlign: 'center', marginBottom: 10, fontWeight: 'bold' },
  instruction: { fontSize: 14, color: '#666', textAlign: 'center', marginBottom: 10, marginTop: 10 },
  paynowBtn: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 10
  },
  divider: { width: '100%', height: 1, backgroundColor: '#eee', marginVertical: 15 },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 15,
    backgroundColor: '#f9f9f9'
  },
  confirmBtn: {
    backgroundColor: '#28a745',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center'
  },
  confirmText: { color: '#fff', fontWeight: 'bold', fontSize: 16 }
});

export default PaymentsScreen;
