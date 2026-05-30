import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

const FAQS = [
  { q: 'How do I book a place?', a: 'Open a listing, tap Reserve, and the landlord will get your request. Track it in your Inbox.' },
  { q: 'How do payments work?', a: 'Once a landlord accepts your booking, a "Pay Now" button appears. Payments are processed securely via PayNow.' },
  { q: 'How do I contact a landlord?', a: 'Open a listing and tap the chat icon, or continue the conversation from your Inbox.' },
  { q: 'How do I report a problem?', a: 'Use the menu (⋮) on the home screen and choose "Report Issue".' },
];

const SUPPORT_EMAIL = 'support@thabstay.com';

const HelpScreen = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>Help & Support</Text>
      <Text style={styles.subtitle}>Frequently asked questions</Text>

      {FAQS.map((f, i) => (
        <View key={i} style={styles.card}>
          <View style={styles.qRow}>
            <Icon name="help-circle-outline" size={20} color="#3182ce" />
            <Text style={styles.q}>{f.q}</Text>
          </View>
          <Text style={styles.a}>{f.a}</Text>
        </View>
      ))}

      <Text style={[styles.subtitle, { marginTop: 10 }]}>Still need help?</Text>
      <TouchableOpacity
        style={styles.contactBtn}
        onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=ThabStay Support`)}
      >
        <Icon name="email-outline" size={20} color="#fff" />
        <Text style={styles.contactText}>Email {SUPPORT_EMAIL}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  title: { fontSize: 26, fontWeight: '800', color: '#1a365d', marginBottom: 6 },
  subtitle: { fontSize: 14, fontWeight: '600', color: '#718096', marginBottom: 12 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  qRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  q: { flex: 1, fontSize: 15, fontWeight: '700', color: '#2D3748' },
  a: { fontSize: 14, color: '#4A5568', lineHeight: 20 },
  contactBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#3182ce', borderRadius: 12, padding: 16, marginTop: 4 },
  contactText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default HelpScreen;
