import React, { useState } from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Text,
  Alert,
  Modal,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import RNPickerSelect from 'react-native-picker-select';
import api from '../services/api';

const SignUpScreen = ({ navigation }) => {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confpassword, setConfPass] = useState('');
  const [role, setRole] = useState('');
  const [studentRegNo, setStudentRegNo] = useState('');
  const [isAgreed, setIsAgreed] = useState(false);
  const [secureTextEntry, setSecureTextEntry] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignup = async () => {
    if (!isAgreed) {
      Alert.alert('Please agree to the terms and conditions.');
      return;
    }

    if (password !== confpassword) {
      Alert.alert('Passwords do not match.');
      return;
    }

    if (!role) {
      Alert.alert('Please select a role.');
      return;
    }

    if (role === 'student' && !studentRegNo) {
      Alert.alert('Missing Information', 'Please enter your Student Reg No.');
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.post('/auth/register', {
        username,
        email,
        phone,
        password,
        role,
        studentRegNo: role === 'student' ? studentRegNo : undefined,
      });

      console.log('User registered successfully:', response.data);
      setModalVisible(true);
    } catch (error) {
      console.error("Error during sign up:", error);
      let message = 'Sign Up Failed. Please try again.';
      if (error.response) {
        message = error.response.data.message || message;
      }
      Alert.alert('Sign Up Failed', message);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setSecureTextEntry(!secureTextEntry);
  };

  const closeModal = () => {
    setModalVisible(false);
    navigation.navigate('Login');
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={80}
    >
      <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          <View style={styles.card}>

            <View style={styles.inputContainer}>
              <Icon name="user" size={20} color="#000" style={styles.icon} />
              <TextInput
                placeholder="Username"
                value={username}
                onChangeText={setUsername}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="envelope" size={20} color="#000" style={styles.icon} />
              <TextInput
                placeholder="Email"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="phone" size={20} color="#000" style={styles.icon} />
              <TextInput
                placeholder="Phone"
                value={phone}
                onChangeText={setPhone}
                style={styles.input}
              />
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#000" style={styles.icon} />
              <TextInput
                placeholder="Password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={secureTextEntry}
                style={styles.input}
              />
              <TouchableOpacity onPress={togglePasswordVisibility}>
                <Icon name={secureTextEntry ? "eye-slash" : "eye"} size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color="#000" style={styles.icon} />
              <TextInput
                placeholder="Confirm Password"
                value={confpassword}
                onChangeText={setConfPass}
                secureTextEntry={secureTextEntry}
                style={styles.input}
              />
              <TouchableOpacity onPress={togglePasswordVisibility}>
                <Icon name={secureTextEntry ? "eye-slash" : "eye"} size={20} color="#000" />
              </TouchableOpacity>
            </View>

            <View style={styles.inputContainer}>
              <Icon name="user-circle" size={20} color="blue" style={styles.icon} />
              <Text style={styles.roleText}>Select Your Role</Text>
              <RNPickerSelect
                placeholder={{ label: 'Select your role...', value: null }}
                items={[
                  { label: 'Landlord', value: 'landlord' },
                  { label: 'Student', value: 'student' },
                ]}
                onValueChange={value => setRole(value)}
                style={pickerSelectStyles}
              />
            </View>

            {role === 'student' && (
              <>
                <View style={styles.inputContainer}>
                  <Icon name="id-card" size={20} color="#000" style={styles.icon} />
                  <TextInput
                    placeholder="Student Reg No (e.g. N0123456X)"
                    value={studentRegNo}
                    onChangeText={setStudentRegNo}
                    style={styles.input}
                    autoCapitalize="characters"
                  />
                </View>
              </>
            )}

            <View style={styles.checkboxContainer}>
              <TouchableOpacity
                style={styles.checkbox}
                onPress={() => setIsAgreed(!isAgreed)}
              >
                <Icon name={isAgreed ? "check-square" : "square-o"} size={20} color="#000" />
              </TouchableOpacity>
              <Text style={styles.checkboxText}>
                I have read and understood the terms and conditions.
              </Text>
            </View>

            <TouchableOpacity onPress={() => navigation.navigate('TermsAndConditions')}>
              <Text style={styles.link}>Terms and Conditions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, isLoading && styles.buttonDisabled]}
              onPress={handleSignup}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.buttonText}>Sign Up</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>

        {/* Success Modal */}
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={closeModal}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <Text style={styles.modalText}>Welcome To ThabStay, {username}!</Text>
              <Text style={styles.modalText}>You have successfully registered.</Text>
              <TouchableOpacity style={styles.modalButton} onPress={closeModal}>
                <Text style={styles.modalButtonText}>Continue to Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  card: {
    padding: 20,
    borderRadius: 10,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 5,
    padding: 10,
    marginBottom: 20,
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  input: {
    flex: 1,
    height: 40,
    marginLeft: 10,
  },
  icon: {
    marginRight: 10,
  },
  roleText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginRight: 10,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkbox: {
    marginRight: 10,
  },
  checkboxText: {
    flex: 1,
  },
  link: {
    color: '#007BFF',
    textDecorationLine: 'underline',
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#ffffff',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 35,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    marginBottom: 15,
    textAlign: 'center',
    fontSize: 18,
  },
  modalButton: {
    backgroundColor: '#007BFF',
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
  },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    fontSize: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  inputAndroid: {
    fontSize: 16,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#007BFF',
    borderRadius: 5,
    color: 'black',
    paddingRight: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  iconContainer: {
    top: 10,
    right: 12,
  },
});

export default SignUpScreen;
