import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Alert, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../services/api';

const fmtDate = (d) => d ? new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : '';

const BillingScreen = ({ navigation }) => {
  const [plans, setPlans] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [gateway, setGateway] = useState('');
  const [processing, setProcessing] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const load = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      setRole(stored ? JSON.parse(stored).role : null);
      const { data } = await api.get('/billing/plans');
      setPlans(data);
      if (data.gateways?.length) setGateway((g) => g || data.gateways[0].key);
    } catch (e) {
      Alert.alert('Error', 'Could not load plans.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return <ActivityIndicator size="large" color="#2563eb" style={{ flex: 1 }} />;

  const isStudent = role === 'student';
  const isLandlord = role === 'landlord';
  if (!isStudent && !isLandlord) {
    return <View style={styles.center}><Text style={styles.muted}>Billing is available to students and landlords.</Text></View>;
  }

  const currency = plans?.currency || 'USD';
  const plan = isStudent ? plans?.studentSubscription : plans?.landlordPremium;
  const status = isStudent ? plans?.me?.subscription : plans?.me?.premium;
  const active = !!status?.active;
  const endpoint = isStudent ? '/billing/subscribe' : '/billing/go-premium';
  const title = isStudent ? 'Student Subscription' : 'Landlord Premium';
  const benefits = isStudent
    ? ['Browse and book all verified listings', 'Direct chat with landlords', 'Priority booking support']
    : [
        `List up to ${plans?.landlordPremium?.premiumListingLimit === 0 ? 'unlimited' : plans?.landlordPremium?.premiumListingLimit} properties`,
        'Premium placement in search', 'Verified landlord badge',
      ];

  const startPayment = async () => {
    setProcessing(true);
    try {
      const { data } = await api.post(endpoint, { gateway });
      if (data.redirectUrl) {
        Linking.openURL(data.redirectUrl);
        Alert.alert('Complete payment', 'Finish the payment in your browser, then tap "I’ve paid — check status".');
      } else {
        Alert.alert('Payment started', 'Complete it on your phone, then tap "I’ve paid — check status".');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Could not start payment.');
    } finally {
      setProcessing(false);
    }
  };

  const verify = async () => {
    setVerifying(true);
    try {
      const { data } = await api.post('/billing/verify');
      if (data.status === 'active') {
        Alert.alert('Success', 'Your plan is now active!');
        load();
      } else {
        Alert.alert('Pending', 'Payment still pending. If you have paid, wait a moment and try again.');
      }
    } catch (e) {
      Alert.alert('Error', e.response?.data?.error || 'Verification failed.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20, paddingBottom: 40 }}>
      <View style={styles.header}>
        <Icon name={isStudent ? 'school' : 'crown'} size={28} color="#fff" />
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>{title}</Text>
          <Text style={styles.headerSub}>{isStudent ? 'Book your next home with confidence.' : 'Stand out and list more properties.'}</Text>
        </View>
      </View>

      {active && (
        <View style={styles.activeBox}>
          <Icon name="check-circle" size={20} color="#16a34a" />
          <Text style={styles.activeText}>Active — expires {fmtDate(status?.expiresAt)}</Text>
        </View>
      )}

      {!plan?.enabled ? (
        <Text style={[styles.muted, { textAlign: 'center', marginTop: 30 }]}>This plan isn’t currently available. Please check back later.</Text>
      ) : (
        <View style={styles.card}>
          <Text style={styles.price}>{currency} {plan.monthlyPrice} <Text style={styles.perMonth}>/ month</Text></Text>

          {benefits.map((b, i) => (
            <View key={i} style={styles.benefitRow}>
              <Icon name="check-circle" size={18} color="#2563eb" />
              <Text style={styles.benefitText}>{b}</Text>
            </View>
          ))}

          <Text style={styles.section}>Pay with</Text>
          {plans?.gateways?.length > 0 ? plans.gateways.map(g => (
            <TouchableOpacity key={g.key} style={[styles.gateway, gateway === g.key && styles.gatewayActive]} onPress={() => setGateway(g.key)}>
              <Icon name={gateway === g.key ? 'radiobox-marked' : 'radiobox-blank'} size={20} color="#2563eb" />
              <Text style={styles.gatewayLabel}>{g.label}</Text>
            </TouchableOpacity>
          )) : (
            <Text style={styles.warn}>No payment methods are enabled yet.</Text>
          )}

          <TouchableOpacity style={[styles.payBtn, (!plans?.gateways?.length || processing) && styles.disabled]} onPress={startPayment} disabled={processing || !plans?.gateways?.length}>
            {processing ? <ActivityIndicator color="#fff" /> : <Text style={styles.payText}>{active ? 'Renew' : 'Subscribe'} — {currency} {plan.monthlyPrice}</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.verifyBtn} onPress={verify} disabled={verifying}>
            {verifying ? <ActivityIndicator color="#2563eb" /> : <><Icon name="refresh" size={16} color="#2563eb" /><Text style={styles.verifyText}>  I’ve paid — check status</Text></>}
          </TouchableOpacity>

          <Text style={styles.fine}>Plan activates for 30 days on confirmation.</Text>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  muted: { color: '#718096', fontSize: 15 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#2563eb', borderRadius: 16, padding: 18 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '800' },
  headerSub: { color: '#dbeafe', fontSize: 13, marginTop: 2 },
  activeBox: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f0fdf4', borderColor: '#bbf7d0', borderWidth: 1, borderRadius: 12, padding: 12, marginTop: 14 },
  activeText: { color: '#15803d', fontWeight: '600' },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 18, marginTop: 14, elevation: 1 },
  price: { fontSize: 30, fontWeight: '800', color: '#1a202c', textAlign: 'center', marginBottom: 12 },
  perMonth: { fontSize: 15, fontWeight: '500', color: '#a0aec0' },
  benefitRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 5 },
  benefitText: { fontSize: 14, color: '#2d3748', flex: 1 },
  section: { fontSize: 12, fontWeight: '700', color: '#718096', textTransform: 'uppercase', marginTop: 16, marginBottom: 8 },
  gateway: { flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 14, marginBottom: 8 },
  gatewayActive: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  gatewayLabel: { fontSize: 15, fontWeight: '600', color: '#2d3748' },
  warn: { color: '#b45309', backgroundColor: '#fffbeb', borderColor: '#fde68a', borderWidth: 1, borderRadius: 10, padding: 12, fontSize: 13 },
  payBtn: { backgroundColor: '#2563eb', borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
  payText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  disabled: { opacity: 0.6 },
  verifyBtn: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 12, marginTop: 6 },
  verifyText: { color: '#2563eb', fontWeight: '700', fontSize: 14 },
  fine: { fontSize: 11, color: '#a0aec0', textAlign: 'center', marginTop: 10 },
});

export default BillingScreen;
