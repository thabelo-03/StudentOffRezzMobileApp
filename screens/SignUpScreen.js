import React, { useState, useRef } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, Text, Modal,
  KeyboardAvoidingView, ScrollView, Platform, ActivityIndicator, Animated, Keyboard,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
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
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Error state
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // Animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const clearErrors = () => { setErrorMsg(''); setErrorType(''); setFieldErrors({}); };

  const showError = (msg, type, fields = {}) => {
    setErrorMsg(msg); setErrorType(type); setFieldErrors(fields);
    triggerShake();
  };

  const clearField = (field) => {
    if (fieldErrors[field]) {
      const f = { ...fieldErrors }; delete f[field]; setFieldErrors(f);
    }
    if (errorMsg) clearErrors();
  };

  const validatePassword = (pw) => {
    let errors = [];
    if (pw.length < 8) errors.push('at least 8 characters');
    if (!/[A-Z]/.test(pw)) errors.push('an uppercase letter');
    if (!/[a-z]/.test(pw)) errors.push('a lowercase letter');
    if (!/\d/.test(pw)) errors.push('a number');
    if (!/[^A-Za-z0-9]/.test(pw)) errors.push('a special character');
    return errors.length > 0 ? 'Password must contain ' + errors.join(', ') + '.' : null;
  };

  const getPasswordStrength = () => {
    if (!password) return null;
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[a-z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;
    if (score <= 2) return { label: 'Weak', color: '#e53e3e', width: '33%' };
    if (score <= 4) return { label: 'Medium', color: '#dd6b20', width: '66%' };
    return { label: 'Strong', color: '#38a169', width: '100%' };
  };

  const handleSignup = async () => {
    Keyboard.dismiss();
    clearErrors();

    const t = { username: username.trim(), email: email.trim(), phone: phone.trim(), password: password.trim(), confpassword: confpassword.trim() };
    const fe = {};

    // Validate all fields
    if (!t.username) fe.username = 'Username is required';
    if (!t.email) fe.email = 'Email is required';
    else if (!isValidEmail(t.email)) fe.email = 'Invalid email format (e.g. user@example.com)';
    if (!t.phone) fe.phone = 'Phone number is required';
    else if (t.phone.length < 10) fe.phone = 'Phone number must be at least 10 digits';
    if (!t.password) fe.password = 'Password is required';
    else {
      const pwErr = validatePassword(t.password);
      if (pwErr) fe.password = pwErr;
    }
    if (!t.confpassword) fe.confpassword = 'Please confirm your password';
    else if (t.password !== t.confpassword) fe.confpassword = 'Passwords do not match';
    if (!role) fe.role = 'Please select a role';
    if (role === 'student' && !studentRegNo.trim()) fe.studentRegNo = 'Student Reg No is required';
    if (!isAgreed) fe.terms = 'You must agree to the Terms and Conditions';

    if (Object.keys(fe).length > 0) {
      const count = Object.keys(fe).length;
      const msg = count === 1
        ? Object.values(fe)[0]
        : 'Please fix the ' + count + ' issues highlighted below.';
      showError(msg, 'validation', fe);
      return;
    }

    try {
      setIsLoading(true);
      const response = await api.post('/auth/register', {
        username: t.username, email: t.email, phone: t.phone, password: t.password,
        role, studentRegNo: role === 'student' ? studentRegNo.trim() : undefined,
      });
      console.log('User registered successfully:', response.data);
      setModalVisible(true);
    } catch (error) {
      console.error("Error during sign up:", error);
      if (error.response) {
        const status = error.response.status;
        const msg = error.response.data?.message || '';
        if (status === 409 || msg.toLowerCase().includes('already exists') || msg.toLowerCase().includes('already registered')) {
          showError('An account with this email already exists. Please sign in instead.', 'auth', { email: 'Email already in use' });
        } else if (status >= 500) {
          showError('Server is currently unavailable. Please try again later.', 'network');
        } else {
          showError(msg || 'Registration failed. Please try again.', 'general');
        }
      } else if (error.request) {
        showError('Unable to reach the server. Please check your internet connection.', 'network');
      } else {
        showError('An unexpected error occurred. Please try again.', 'general');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => { setModalVisible(false); navigation.navigate('Login'); };

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network': return 'wifi-off';
      case 'auth': return 'shield-alert-outline';
      case 'validation': return 'alert-circle-outline';
      default: return 'alert-circle-outline';
    }
  };

  const strength = getPasswordStrength();
  const hasFieldError = (f) => !!fieldErrors[f];

  const renderInput = (field, iconName, placeholder, value, onChangeText, extra = {}) => (
    <>
      <View style={[styles.inputContainer, hasFieldError(field) && styles.inputError]}>
        <Icon name={iconName} size={18} color={hasFieldError(field) ? '#e53e3e' : '#2563eb'} style={styles.icon} />
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#a0aec0"
          value={value}
          onChangeText={(t) => { onChangeText(t); clearField(field); }}
          style={styles.input}
          {...extra}
        />
        {extra.secureTextEntry !== undefined && (
          <TouchableOpacity onPress={extra.onToggle} style={styles.eyeIconContainer}>
            <Icon name={extra.visible ? 'eye' : 'eye-slash'} size={18} color="#2563eb" />
          </TouchableOpacity>
        )}
        {hasFieldError(field) && <MCIcon name="alert-circle" size={18} color="#e53e3e" />}
      </View>
      {hasFieldError(field) && <Text style={styles.fieldError}>{fieldErrors[field]}</Text>}
    </>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#f0f2f5' }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'} keyboardVerticalOffset={80}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 16 }} keyboardShouldPersistTaps="handled">
        <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
          <Text style={styles.title}>Create Account</Text>
          <Text style={styles.subtitle}>Sign up to get started</Text>

          {/* Error Banner */}
          {errorMsg !== '' && (
            <View style={styles.errorBanner}>
              <MCIcon name={getErrorIcon()} size={20} color={errorType === 'network' ? '#dd6b20' : '#e53e3e'} />
              <Text style={styles.errorBannerText}>{errorMsg}</Text>
              <TouchableOpacity onPress={clearErrors} style={{ padding: 2 }}>
                <MCIcon name="close" size={16} color="#999" />
              </TouchableOpacity>
            </View>
          )}

          {/* Username */}
          {renderInput('username', 'user', 'Username', username, setUsername, { autoComplete: 'off', autoCorrect: false })}

          {/* Email */}
          {renderInput('email', 'envelope', 'Email', email, setEmail, { keyboardType: 'email-address', autoCapitalize: 'none', autoComplete: 'off' })}

          {/* Phone */}
          {renderInput('phone', 'phone', 'Phone Number', phone, setPhone, { keyboardType: 'phone-pad', autoComplete: 'off' })}

          {/* Password */}
          <View style={[styles.inputContainer, hasFieldError('password') && styles.inputError]}>
            <Icon name="lock" size={18} color={hasFieldError('password') ? '#e53e3e' : '#2563eb'} style={styles.icon} />
            <TextInput
              placeholder="Password"
              placeholderTextColor="#a0aec0"
              value={password}
              onChangeText={(t) => { setPassword(t); clearField('password'); }}
              secureTextEntry={!passwordVisible}
              style={styles.input}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIconContainer}>
              <Icon name={passwordVisible ? 'eye' : 'eye-slash'} size={18} color="#2563eb" />
            </TouchableOpacity>
            {hasFieldError('password') && <MCIcon name="alert-circle" size={18} color="#e53e3e" />}
          </View>
          {hasFieldError('password') && <Text style={styles.fieldError}>{fieldErrors.password}</Text>}

          {/* Password Strength Bar */}
          {password.length > 0 && strength && (
            <View style={styles.strengthRow}>
              <View style={styles.strengthBarBg}>
                <View style={[styles.strengthBarFill, { width: strength.width, backgroundColor: strength.color }]} />
              </View>
              <Text style={[styles.strengthLabel, { color: strength.color }]}>{strength.label}</Text>
            </View>
          )}

          {/* Confirm Password */}
          <View style={[styles.inputContainer, hasFieldError('confpassword') && styles.inputError]}>
            <Icon name="lock" size={18} color={hasFieldError('confpassword') ? '#e53e3e' : '#2563eb'} style={styles.icon} />
            <TextInput
              placeholder="Confirm Password"
              placeholderTextColor="#a0aec0"
              value={confpassword}
              onChangeText={(t) => { setConfPass(t); clearField('confpassword'); }}
              secureTextEntry={!confirmPasswordVisible}
              style={styles.input}
              autoCapitalize="none"
            />
            <TouchableOpacity onPress={() => setConfirmPasswordVisible(!confirmPasswordVisible)} style={styles.eyeIconContainer}>
              <Icon name={confirmPasswordVisible ? 'eye' : 'eye-slash'} size={18} color="#2563eb" />
            </TouchableOpacity>
            {hasFieldError('confpassword') && <MCIcon name="alert-circle" size={18} color="#e53e3e" />}
          </View>
          {hasFieldError('confpassword') && <Text style={styles.fieldError}>{fieldErrors.confpassword}</Text>}

          {/* Role Picker */}
          <View style={[styles.inputContainer, hasFieldError('role') && styles.inputError]}>
            <MCIcon name="account-circle-outline" size={20} color={hasFieldError('role') ? '#e53e3e' : '#2563eb'} style={styles.icon} />
            <Text style={styles.roleText}>Role</Text>
            <RNPickerSelect
              placeholder={{ label: 'Select your role...', value: '' }}
              items={[
                { label: 'Landlord', value: 'landlord' },
                { label: 'Student', value: 'student' },
              ]}
              onValueChange={value => { setRole(value); clearField('role'); }}
              value={role}
              style={pickerSelectStyles}
            />
            {hasFieldError('role') && <MCIcon name="alert-circle" size={18} color="#e53e3e" />}
          </View>
          {hasFieldError('role') && <Text style={styles.fieldError}>{fieldErrors.role}</Text>}

          {/* Student Reg No */}
          {role === 'student' && (
            <>
              {renderInput('studentRegNo', 'id-card', 'Student Reg No (e.g. N0123456X)', studentRegNo, setStudentRegNo, { autoCapitalize: 'characters' })}
            </>
          )}

          {/* Terms Checkbox */}
          <View style={[styles.checkboxContainer, hasFieldError('terms') && { borderColor: '#e53e3e', borderWidth: 1, borderRadius: 8, padding: 8, backgroundColor: '#fff5f5' }]}>
            <TouchableOpacity style={styles.checkbox} onPress={() => { setIsAgreed(!isAgreed); clearField('terms'); }}>
              <MCIcon name={isAgreed ? "checkbox-marked" : "checkbox-blank-outline"} size={22} color={isAgreed ? '#2563eb' : (hasFieldError('terms') ? '#e53e3e' : '#a0aec0')} />
            </TouchableOpacity>
            <Text style={styles.checkboxText}>I have read and understood the{' '}
              <Text style={styles.link} onPress={() => navigation.navigate('TermsAndConditions')}>Terms and Conditions</Text>
            </Text>
          </View>
          {hasFieldError('terms') && <Text style={styles.fieldError}>{fieldErrors.terms}</Text>}

          {/* Sign Up Button */}
          <TouchableOpacity style={[styles.button, isLoading && styles.buttonDisabled]} onPress={handleSignup} disabled={isLoading} activeOpacity={0.8}>
            {isLoading ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.buttonText}>Create Account</Text>}
          </TouchableOpacity>

          <TouchableOpacity style={styles.loginLink} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.loginText}>Already have an account? <Text style={styles.loginHighlight}>Sign In</Text></Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Success Modal */}
        <Modal animationType="fade" transparent={true} visible={modalVisible} onRequestClose={closeModal}>
          <View style={styles.modalContainer}>
            <View style={styles.modalView}>
              <MCIcon name="check-circle" size={60} color="#38a169" style={{ marginBottom: 16 }} />
              <Text style={styles.modalTitle}>Welcome to ThabStay!</Text>
              <Text style={styles.modalSub}>{username}, your account has been created successfully.</Text>
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
  card: {
    padding: 24, borderRadius: 22, backgroundColor: '#fff', elevation: 6,
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 15, shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 26, fontWeight: '800', color: '#1a365d', textAlign: 'center', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#718096', textAlign: 'center', marginBottom: 22 },

  // Error Banner
  errorBanner: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5',
    borderRadius: 10, padding: 12, marginBottom: 14, borderLeftWidth: 4, borderLeftColor: '#e53e3e', gap: 10,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#c53030', lineHeight: 18 },
  fieldError: { color: '#e53e3e', fontSize: 12, marginBottom: 8, marginTop: -6, marginLeft: 4 },

  // Inputs
  inputContainer: {
    flexDirection: 'row', alignItems: 'center', borderWidth: 1.5, borderColor: '#e2e8f0',
    borderRadius: 14, paddingHorizontal: 12, marginBottom: 10, backgroundColor: '#f7fafc',
  },
  inputError: { borderColor: '#e53e3e', backgroundColor: '#fff5f5' },
  input: { flex: 1, height: 48, marginLeft: 8, fontSize: 15, color: '#2d3748' },
  icon: { marginRight: 2 },
  eyeIconContainer: { padding: 6 },
  roleText: { fontSize: 14, fontWeight: '600', color: '#4a5568', marginRight: 8 },

  // Password Strength
  strengthRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, marginTop: -4, paddingHorizontal: 4, gap: 8 },
  strengthBarBg: { flex: 1, height: 4, backgroundColor: '#e2e8f0', borderRadius: 2, overflow: 'hidden' },
  strengthBarFill: { height: '100%', borderRadius: 2 },
  strengthLabel: { fontSize: 11, fontWeight: '700' },

  // Checkbox
  checkboxContainer: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, marginTop: 4 },
  checkbox: { marginRight: 8 },
  checkboxText: { flex: 1, fontSize: 13, color: '#4a5568', lineHeight: 18 },
  link: { color: '#2563eb', fontWeight: '600', textDecorationLine: 'underline' },

  // Button
  button: {
    backgroundColor: '#2563eb', borderRadius: 14, height: 52, justifyContent: 'center', alignItems: 'center',
    marginTop: 6, elevation: 3, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 17 },

  loginLink: { marginTop: 18, alignItems: 'center', padding: 8 },
  loginText: { color: '#718096', fontSize: 14 },
  loginHighlight: { color: '#2563eb', fontWeight: '700' },

  // Success Modal
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.5)' },
  modalView: {
    width: '85%', backgroundColor: '#fff', borderRadius: 22, padding: 30, alignItems: 'center',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 15,
  },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#1a365d', marginBottom: 8 },
  modalSub: { fontSize: 14, color: '#718096', textAlign: 'center', marginBottom: 20, lineHeight: 20 },
  modalButton: {
    backgroundColor: '#2563eb', borderRadius: 14, paddingVertical: 14, paddingHorizontal: 40, alignItems: 'center',
  },
  modalButtonText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

const pickerSelectStyles = StyleSheet.create({
  inputIOS: { fontSize: 15, paddingVertical: 10, paddingHorizontal: 8, color: '#2d3748', paddingRight: 30 },
  inputAndroid: { fontSize: 15, paddingVertical: 6, paddingHorizontal: 8, color: '#2d3748', paddingRight: 30 },
  iconContainer: { top: 10, right: 12 },
});

export default SignUpScreen;
