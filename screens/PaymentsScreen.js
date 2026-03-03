import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import * as DocumentPicker from 'expo-document-picker';
import * as MailComposer from 'expo-mail-composer';

const PaymentsScreen = ({ route, navigation }) => {
  const [modalVisible, setModalVisible] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [date, setDate] = useState('');
  const [proofOfPayment, setProofOfPayment] = useState(null);
  const [fileName, setFileName] = useState('');
  const { house } = route.params;
  const landlordEmail = house?.landlordEmail;

  const openPaymentModal = (method) => {
    setPaymentMethod(method);
    setModalVisible(true);
  };

  const handleUpload = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
    });

    if (result.canceled) {
      Alert.alert('Upload Cancelled');
      return;
    }

    const { assets } = result;
    if (assets && assets[0]) {
      setProofOfPayment(assets[0]);
      setFileName(assets[0].name);
    } else {
      Alert.alert('Error', 'No file selected');
    }
  };

  const handleSubmit = async () => {
    if (!name || !phone || !date || !proofOfPayment) {
      Alert.alert('Missing Info', 'Please fill in all fields and upload your proof of payment.');
      return;
    }

    const emailBody = `
      Payment Method: ${paymentMethod}
      Name: ${name}
      Phone: ${phone}
      Date: ${date}
      Proof of Payment File: ${fileName}
    `;

    try {
      await MailComposer.composeAsync({
        recipients: [landlordEmail], 
        subject: `Proof of Payment for Booking - ${house.houseName}`,
        body: emailBody,
        attachments: [proofOfPayment.uri],
      });

      Alert.alert('Success', 'Payment details sent successfully!');
      setModalVisible(false);
      setName('');
      setPhone('');
      setDate('');
      setProofOfPayment(null);
      setFileName('');
    } catch (err) {
      Alert.alert('Error', 'Failed to send email. Try again.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Choose Payment Method</Text>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#3CB371' }]} onPress={() => openPaymentModal('EcoCash')}>
        <Icon name="mobile" size={20} color="#fff" />
        <Text style={styles.buttonText}>Pay with EcoCash</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, { backgroundColor: '#1E90FF' }]} onPress={() => openPaymentModal('PayNow')}>
        <Icon name="credit-card" size={20} color="#fff" />
        <Text style={styles.buttonText}>Pay with PayNow</Text>
      </TouchableOpacity>

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalBackground}>
          <View style={styles.modalContainer}>
            <Text style={styles.modalTitle}>{paymentMethod} Payment</Text>

            <TextInput
              placeholder="Full Name"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
            <TextInput
              placeholder="Phone Number"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
            <TextInput
              placeholder="Date of Payment (YYYY-MM-DD)"
              value={date}
              onChangeText={setDate}
              style={styles.input}
            />

            <TouchableOpacity style={styles.uploadButton} onPress={handleUpload}>
              <Icon name="upload" size={18} color="#fff" />
              <Text style={styles.uploadText}>Upload Proof (PDF)</Text>
            </TouchableOpacity>

            {fileName ? <Text style={styles.fileName}>Uploaded: {fileName}</Text> : null}

            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
                <Text style={styles.submitText}>Submit</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f2f5',
    padding: 20,
    justifyContent: 'center',
  },
  header: {
    fontSize: 26,
    fontWeight: 'bold',
    marginBottom: 40,
    textAlign: 'center',
  },
  button: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 10,
  },
  modalBackground: {
    flex: 1,
    backgroundColor: '#000000aa',
    justifyContent: 'center',
  },
  modalContainer: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 25,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 10,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 15,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 10,
    padding: 12,
    marginBottom: 15,
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#6a5acd',
    padding: 12,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 10,
  },
  fileName: {
    marginTop: 10,
    color: '#333',
    textAlign: 'center',
  },
  modalActions: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  submitButton: {
    flex: 1,
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 10,
    marginRight: 10,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#dc3545',
    padding: 12,
    borderRadius: 10,
  },
  submitText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  cancelText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default PaymentsScreen;
