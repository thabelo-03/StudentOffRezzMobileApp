
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';

const TermsAndConditions = () => {
  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Terms and Conditions for ThabStay</Text>
      <Text style={styles.date}>Last Updated: [07/04/2025]</Text>

      <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
      <Text style={styles.sectionText}>
        By accessing or using the ThabStay app, you agree to these Terms and Conditions, along with our Privacy Policy. If you do not agree to these terms, you must not use our services.
      </Text>

      <Text style={styles.sectionTitle}>2. Definitions</Text>
      <Text style={styles.sectionText}>
        - <Text style={styles.bold}>User:</Text> Refers to both landlords and students who use the ThabStay app for rental purposes.
      </Text>
      <Text style={styles.sectionText}>
        - <Text style={styles.bold}>Landlord:</Text> Refers to individuals or entities that own properties and list them for rent within the app.
      </Text>
      <Text style={styles.sectionText}>
        - <Text style={styles.bold}>Student:</Text> Refers to individuals who are looking for rental accommodations while studying.
      </Text>

      <Text style={styles.sectionTitle}>3. User Responsibilities</Text>
      <Text style={styles.sectionText}>
        <Text style={styles.bold}>For Landlords:</Text> You must provide accurate information about the property, including location, size, amenities, and rental price. You are responsible for the maintenance and safety of the property.
      </Text>
      <Text style={styles.sectionText}>
        <Text style={styles.bold}>For Students:</Text> You must provide accurate information when creating your profile and respect the property during your stay.
      </Text>

      <Text style={styles.sectionTitle}>4. Rental Agreement</Text>
      <Text style={styles.sectionText}>
        A rental agreement will be formed between the landlord and the student upon property selection, defining all terms of the rental.
      </Text>

      <Text style={styles.sectionTitle}>5. Payments</Text>
      <Text style={styles.sectionText}>
        Proof of payment for rentals must be uploaded on the ThabStay app. Late fees may apply if payment is not received by the specified date in the rental agreement.
      </Text>

      <Text style={styles.sectionTitle}>6. Communication</Text>
      <Text style={styles.sectionText}>
        Users are encouraged to communicate via email or calls outside the app. The ThabStay app is not responsible for agreements made outside the app.
      </Text>

      <Text style={styles.sectionTitle}>7. Privacy Policy</Text>
      <Text style={styles.sectionText}>
        Your use of the ThabStay app is also governed by our Privacy Policy.
      </Text>

      <Text style={styles.sectionTitle}>8. Termination</Text>
      <Text style={styles.sectionText}>
        ThabStay reserves the right to suspend or terminate your account if you violate these Terms and Conditions or engage in fraud.
      </Text>

      <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
      <Text style={styles.sectionText}>
        ThabStay is not liable for any damages arising from the use of our services or any transactions made between landlords and students.
      </Text>

      <Text style={styles.sectionTitle}>10. Modifications</Text>
      <Text style={styles.sectionText}>
        ThabStay reserves the right to modify these Terms and Conditions at any time. Users will be notified of significant changes through the app.
      </Text>

   

      <Text style={styles.sectionTitle}>12. Contact Us</Text>
      <Text style={styles.sectionText}>
        For questions or concerns, please contact us at:
      </Text>
      <Text style={styles.sectionText}>
        Phone: +263777926123
      </Text>
      <Text style={styles.sectionText}>
        Email: thabStay@gmail.com or tyzan.com.mlalaz@gmail.com
      </Text>
    </ScrollView>
  );
};


const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: 20,
      backgroundColor: '#fff',
    },
    title: {
      fontSize: 24,
      fontWeight: 'bold',
      marginBottom: 10

},
date: {
  fontSize: 14,
  color: '#666',
  marginBottom: 20,
},
sectionTitle: {
  fontSize: 20,
  fontWeight: 'bold',
  marginTop: 15,
  marginBottom: 5,
  color: '#007BFF', // A blue color for section titles
},
sectionText: {
  fontSize: 16,
  lineHeight: 24,
  marginBottom: 10,
  color: '#333', // Dark color for text for better readability
},
bold: {
  fontWeight: 'bold',
},
});

export default TermsAndConditions;