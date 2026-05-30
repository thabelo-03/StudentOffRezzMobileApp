import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking, Image, ScrollView, TextInput, Alert, ActivityIndicator } from 'react-native';
import api from '../services/api';

const PaymentsScreen = ({ route, navigation }) => {
  const { house, bookingId } = route.params || {};
  const housePrice = house?.price;
  const [loading, setLoading] = useState(false);
  const [initiated, setInitiated] = useState(false);

  // Step 1: create a Paynow session on the backend and open the checkout page.
  const handlePayNow = async () => {
    if (!bookingId) {
      Alert.alert("Error", "Booking reference missing. Please retry from the Home screen.");
      return;
    }
    setLoading(true);
    try {
      const { data } = await api.post('/payments/create-session', { bookingId });
      if (data?.redirectUrl) {
        setInitiated(true);
        Linking.openURL(data.redirectUrl).catch(() => Alert.alert('Error', 'Could not open the payment page.'));
      } else {
        Alert.alert('Error', 'Could not start the payment. Please try again.');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Could not start the payment.');
    } finally {
      setLoading(false);
    }
  };

  // Step 2: after paying on Paynow, verify the payment status.
  const handleCheckStatus = async () => {
    setLoading(true);
    try {
      const { data } = await api.post('/payments/check-status', { bookingId });
      if (data?.status === 'paid') {
        Alert.alert("Payment Verified", "Your payment was successful!", [
          { text: "OK", onPress: () => navigation.navigate('Student') }
        ]);
      } else {
        Alert.alert("Pending", "We haven't received your payment yet. If you've just paid, wait a moment and check again.");
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Could not verify payment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 20 }}>
        <View style={styles.cardWrapper}>
          <Text style={styles.title}>Pay for Your Listing</Text>
          <Text style={styles.subtitle}>Amount: ${housePrice}</Text>
          <Text style={styles.instruction}>
            1. Tap “Pay with PayNow” to open the secure checkout.
          </Text>

          <TouchableOpacity onPress={handlePayNow} style={styles.confirmBtn} disabled={loading}>
            {loading && !initiated ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>Pay with PayNow</Text>}
          </TouchableOpacity>

          <View style={styles.divider} />

          <Text style={styles.instruction}>
            2. After completing payment on PayNow, return here and verify.
          </Text>

          <TouchableOpacity
            style={[styles.confirmBtn, { backgroundColor: initiated ? '#28a745' : '#9bbfd4' }]}
            onPress={handleCheckStatus}
            disabled={loading || !initiated}
          >
            {loading && initiated ? <ActivityIndicator color="#fff" /> : <Text style={styles.confirmText}>I've Paid — Verify</Text>}
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
    borderColor: '#2563eb',
    backgroundColor: '#ffffff',
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 10, color: '#2563eb', textAlign: 'center' },
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
