import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';

const TermsAndConditions = ({ navigation }) => {

  const sections = [
    {
      icon: 'handshake-outline',
      title: '1. Acceptance of Terms',
      text: 'By accessing or using the ThabStay app, you agree to be bound by these Terms and Conditions, along with our Privacy Policy. If you do not agree to these terms, you must not use our services. Your continued use of the platform constitutes acceptance of any future modifications.',
    },
    {
      icon: 'book-open-variant',
      title: '2. Definitions',
      items: [
        { label: 'User', desc: 'Any individual (student or landlord) who registers and uses the ThabStay platform.' },
        { label: 'Landlord', desc: 'An individual or entity that owns properties and lists them for rent within the app.' },
        { label: 'Student', desc: 'An individual enrolled at a recognized institution seeking off-campus rental accommodation.' },
        { label: 'Platform', desc: 'The ThabStay mobile application and any associated web services.' },
      ],
    },
    {
      icon: 'account-check-outline',
      title: '3. User Responsibilities',
      subsections: [
        { label: 'Landlords', text: 'You must provide accurate, truthful information about your properties including location, pricing, amenities, and availability. You are responsible for property maintenance, safety compliance, and responding to booking requests in a timely manner.' },
        { label: 'Students', text: 'You must provide accurate personal and institutional information during registration. You agree to respect the property during your stay, pay rent on time, and communicate any issues through the proper channels within the app.' },
      ],
    },
    {
      icon: 'file-document-outline',
      title: '4. Rental Agreement',
      text: 'A rental agreement is formed between the landlord and student upon acceptance of a booking request. ThabStay facilitates this connection but is not a party to the rental agreement itself. All terms of tenancy (duration, deposits, house rules) are between the landlord and student.',
    },
    {
      icon: 'credit-card-outline',
      title: '5. Payments & Transactions',
      text: 'All rental payments must be processed and documented through the ThabStay platform. Proof of payment should be uploaded within the app. Late payment fees, if applicable, are determined by the landlord and outlined in the rental agreement. ThabStay is not responsible for disputes regarding payment amounts.',
    },
    {
      icon: 'shield-check-outline',
      title: '6. Verification & Safety',
      text: 'All landlords must complete identity verification before listing properties. Students must verify their enrollment status. ThabStay reserves the right to reject or remove unverified accounts. While we strive to verify all users, we cannot guarantee the accuracy of all information provided by third parties.',
    },
    {
      icon: 'message-text-outline',
      title: '7. Communication',
      text: 'Users are encouraged to communicate through the in-app messaging system for transparency and dispute resolution. ThabStay is not responsible for agreements made outside the platform. All in-app communications may be monitored for safety and compliance purposes.',
    },
    {
      icon: 'lock-outline',
      title: '8. Privacy & Data Protection',
      text: 'Your personal information is collected and processed in accordance with our Privacy Policy and applicable data protection laws. We implement industry-standard security measures to protect your data. You have the right to access, correct, or delete your personal information at any time.',
    },
    {
      icon: 'alert-outline',
      title: '9. Prohibited Activities',
      items: [
        { label: 'Fraud', desc: 'Providing false information, fake listings, or engaging in deceptive practices.' },
        { label: 'Harassment', desc: 'Any form of threatening, abusive, or discriminatory behavior toward other users.' },
        { label: 'Spam', desc: 'Sending unsolicited messages, advertisements, or promotional content.' },
        { label: 'Circumvention', desc: 'Attempting to bypass platform fees or security measures.' },
      ],
    },
    {
      icon: 'cancel',
      title: '10. Account Termination',
      text: 'ThabStay reserves the right to suspend or terminate any account that violates these Terms, engages in fraudulent activity, or receives multiple verified complaints. Users may also delete their own account at any time through the app settings.',
    },
    {
      icon: 'scale-balance',
      title: '11. Limitation of Liability',
      text: 'ThabStay acts as a platform connecting landlords and students. We are not liable for any damages, losses, or disputes arising from transactions between users. Users engage in rental agreements at their own risk. Our total liability shall not exceed the fees paid by you to ThabStay in the 12 months preceding any claim.',
    },
    {
      icon: 'pencil-outline',
      title: '12. Modifications',
      text: 'ThabStay reserves the right to modify these Terms and Conditions at any time. Users will be notified of significant changes through the app and via email. Continued use of the platform after modifications constitutes acceptance of the updated terms.',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MCIcon name="arrow-left" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Terms & Conditions</Text>
          <Text style={styles.headerSub}>ThabStay Platform Agreement</Text>
        </View>
        <MCIcon name="shield-check" size={28} color="rgba(255,255,255,0.6)" />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <MCIcon name="information-outline" size={20} color="#3182ce" />
          <Text style={styles.introText}>
            Please read these terms carefully before using ThabStay. By creating an account, you acknowledge and agree to these terms.
          </Text>
        </View>

        <Text style={styles.lastUpdated}>Last Updated: April 30, 2026</Text>

        {/* Sections */}
        {sections.map((section, i) => (
          <View key={i} style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionIconBox}>
                <MCIcon name={section.icon} size={20} color="#3182ce" />
              </View>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>

            {section.text && <Text style={styles.sectionText}>{section.text}</Text>}

            {section.items && section.items.map((item, j) => (
              <View key={j} style={styles.defItem}>
                <Text style={styles.defLabel}>{item.label}</Text>
                <Text style={styles.defDesc}>{item.desc}</Text>
              </View>
            ))}

            {section.subsections && section.subsections.map((sub, j) => (
              <View key={j} style={styles.subsection}>
                <Text style={styles.subLabel}>{sub.label}</Text>
                <Text style={styles.sectionText}>{sub.text}</Text>
              </View>
            ))}
          </View>
        ))}

        {/* Contact Section */}
        <View style={styles.contactCard}>
          <MCIcon name="headset" size={28} color="#3182ce" />
          <Text style={styles.contactTitle}>Need Help?</Text>
          <Text style={styles.contactText}>If you have questions about these terms, contact us:</Text>
          <View style={styles.contactRow}>
            <MCIcon name="phone" size={16} color="#718096" />
            <Text style={styles.contactInfo}>+263 777 926 123</Text>
          </View>
          <View style={styles.contactRow}>
            <MCIcon name="email-outline" size={16} color="#718096" />
            <Text style={styles.contactInfo}>support@thabstay.com</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f0f2f5' },
  header: {
    flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20,
    paddingVertical: 18, paddingTop: 50, backgroundColor: '#1a365d', gap: 12,
  },
  backBtn: { padding: 6, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 2 },

  scrollView: { flex: 1, padding: 16 },

  introCard: {
    flexDirection: 'row', alignItems: 'flex-start', backgroundColor: '#ebf8ff',
    borderRadius: 12, padding: 14, marginBottom: 12, gap: 10,
    borderLeftWidth: 4, borderLeftColor: '#3182ce',
  },
  introText: { flex: 1, fontSize: 13, color: '#2b6cb0', lineHeight: 19 },

  lastUpdated: { fontSize: 12, color: '#a0aec0', marginBottom: 16, textAlign: 'right' },

  section: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 18, marginBottom: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 8,
  },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 10 },
  sectionIconBox: {
    width: 36, height: 36, borderRadius: 10, backgroundColor: '#ebf4ff',
    justifyContent: 'center', alignItems: 'center',
  },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#1a365d', flex: 1 },
  sectionText: { fontSize: 14, lineHeight: 22, color: '#4a5568', marginBottom: 4 },

  defItem: {
    backgroundColor: '#f7fafc', borderRadius: 8, padding: 12, marginBottom: 8,
    borderLeftWidth: 3, borderLeftColor: '#3182ce',
  },
  defLabel: { fontSize: 14, fontWeight: '700', color: '#1a365d', marginBottom: 3 },
  defDesc: { fontSize: 13, color: '#718096', lineHeight: 19 },

  subsection: { marginBottom: 10 },
  subLabel: { fontSize: 14, fontWeight: '700', color: '#dd6b20', marginBottom: 4 },

  contactCard: {
    backgroundColor: '#FFF', borderRadius: 14, padding: 24, marginTop: 8,
    alignItems: 'center', elevation: 2,
  },
  contactTitle: { fontSize: 18, fontWeight: '700', color: '#1a365d', marginTop: 8, marginBottom: 4 },
  contactText: { fontSize: 13, color: '#718096', marginBottom: 14, textAlign: 'center' },
  contactRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  contactInfo: { fontSize: 14, color: '#4a5568', fontWeight: '500' },
});

export default TermsAndConditions;