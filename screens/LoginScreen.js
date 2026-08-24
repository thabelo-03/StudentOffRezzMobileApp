import React, { useState, useRef } from 'react';
import { StyleSheet, View, TextInput, TouchableOpacity, Text, ActivityIndicator, Animated, Keyboard, Modal } from 'react-native';
import { Image } from 'expo-image';
import { useAssets } from 'expo-asset';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api, { BASE_URL } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const navigation = useNavigation();
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [assets, error] = useAssets([require('../assets/ThabStayLogo.jpeg')]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  // Role is chosen up-front so a landlord signing up with Google isn't silently
  // created as a student (the backend defaults to 'student' when no role is sent).
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  // Error state
  const [errorMsg, setErrorMsg] = useState('');
  const [errorType, setErrorType] = useState(''); // 'email', 'password', 'network', 'auth', 'general'
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Animation
  const shakeAnim = useRef(new Animated.Value(0)).current;

  if (error) {
    console.error('Error loading assets:', error);
    return null;
  }

  if (!assets || !assets[0]) return null;

  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const triggerShake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const clearErrors = () => {
    setErrorMsg('');
    setErrorType('');
    setEmailError('');
    setPasswordError('');
  };

  const showError = (msg, type, fieldErrors = {}) => {
    setErrorMsg(msg);
    setErrorType(type);
    if (fieldErrors.email) setEmailError(fieldErrors.email);
    if (fieldErrors.password) setPasswordError(fieldErrors.password);
    triggerShake();
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    clearErrors();

    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();

    // 1. Empty email
    if (!trimmedEmail && !trimmedPassword) {
      showError('Please enter your email and password to sign in.', 'general', {
        email: 'Email is required',
        password: 'Password is required'
      });
      return;
    }

    if (!trimmedEmail) {
      showError('Please enter your email address.', 'email', { email: 'Email is required' });
      return;
    }

    // 2. Invalid email format
    if (!isValidEmail(trimmedEmail)) {
      showError('That doesn\'t look like a valid email. Please check the format (e.g. user@example.com).', 'email', {
        email: 'Invalid email format'
      });
      return;
    }

    // 3. Empty password
    if (!trimmedPassword) {
      showError('Please enter your password.', 'password', { password: 'Password is required' });
      return;
    }

    // 4. Weak password (too short)
    if (trimmedPassword.length < 6) {
      showError('Password must be at least 6 characters long.', 'password', {
        password: 'Too short (min 6 characters)'
      });
      return;
    }

    setLoading(true);

    try {
      // 5. Authenticate against the backend (returns a JWT + user details with role)
      const response = await api.post('/auth/login', {
        email: trimmedEmail,
        password: trimmedPassword,
      });

      const { token, user } = response.data;

      // 6. Store the JWT and user data for session management
      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('user', JSON.stringify(user));

      setLoading(false);

      // 8. Role-Based Navigation Logic
      // Parity with the web app: verification is a trust badge / admin-approval flow,
      // not a hard gate on access. Users go straight to their home. Landlords can
      // submit verification docs later from their dashboard (LandlordVerification).
      if (user.role === 'admin') {
        navigation.navigate('AdminDashboard');
      } else if (user.role === 'landlord') {
        navigation.navigate('Landlord');
      } else if (user.role === 'student') {
        navigation.navigate('Student');
      } else {
        showError('Your account role is not recognized. Please contact support.', 'general');
      }

    } catch (err) {
      setLoading(false);
      console.error('Login Error:', err);

      if (err.response) {
        // Backend API errors. The backend returns errors as { error: '...' }
        // (with { message } on some routes), so fall back across both.
        const status = err.response.status;
        const msg = err.response.data?.error || err.response.data?.message || '';
        if (status === 401) {
          showError('Invalid credentials. Please check your email and password.', 'auth');
        } else if (status === 403) {
          showError('Your account is restricted. Please contact support.', 'auth');
        } else if (status === 404) {
          showError('Account not found. Please sign up first.', 'email', { email: 'Account not found' });
        } else if (status >= 500) {
          showError('Server is currently unavailable. Please try again later.', 'network');
        } else {
          showError(msg || 'Login failed. Please try again.', 'general');
        }
      } else if (err.request) {
        // No response received - network issue
        showError('Unable to reach the server. Please check your internet connection or try again later.', 'network');
      } else {
        showError('An unexpected error occurred. Please try again.', 'general');
      }
    }
  };

  const goToRoleHome = (role) => {
    if (role === 'admin') navigation.navigate('AdminDashboard');
    else if (role === 'landlord') navigation.navigate('Landlord');
    else if (role === 'student') navigation.navigate('Student');
    else showError('Your account role is not recognized. Please contact support.', 'general');
  };

  const handleGoogleLogin = () => {
    clearErrors();
    setRoleModalVisible(true);
  };

  // Signs the user in and lands them on their home screen.
  const finishSignIn = async (token, user) => {
    await AsyncStorage.setItem('token', String(token));
    let profile = user;
    if (!profile) {
      // The api interceptor now attaches the token; fetch the profile.
      const me = await api.get('/auth/me');
      profile = me.data.user;
    }
    await AsyncStorage.setItem('user', JSON.stringify(profile));
    setLoading(false);
    goToRoleHome(profile.role);
  };

  const startGoogleFlow = async (role) => {
    setRoleModalVisible(false);
    try {
      clearErrors();
      setLoading(true);
      // Deep link the backend will return the JWT to (e.g. thabstay://google-auth).
      const redirectUrl = Linking.createURL('google-auth');
      const authUrl = `${BASE_URL}/auth/google?platform=mobile&role=${role}` +
        `&redirect=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type !== 'success' || !result.url) {
        setLoading(false); // user dismissed the browser
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      if (queryParams?.error) {
        setLoading(false);
        showError('Google sign-in failed. Please try again or use email.', 'auth');
        return;
      }

      // Existing account — the backend already issued a JWT.
      if (queryParams?.token) {
        await finishSignIn(queryParams.token, null);
        return;
      }

      // New account — Google verified them, but they still need a ThabStay
      // account. Exchange the prefill token for a session; no password needed.
      if (queryParams?.google_prefill && queryParams?.prefill) {
        // Absolute URL: the Google routes are mounted at /auth on the server
        // root, not under the /api prefix that `api` is configured with.
        const { data } = await api.post(`${BASE_URL}/auth/google/complete`, {
          prefill: queryParams.prefill,
          role: queryParams.role || role,
        });
        await finishSignIn(data.token, data.user);
        return;
      }

      setLoading(false);
      showError('Google sign-in failed.', 'auth');
    } catch (e) {
      setLoading(false);
      showError(
        e?.response?.data?.error || 'Google sign-in failed. Please try again.',
        'auth'
      );
    }
  };

  const getErrorIcon = () => {
    switch (errorType) {
      case 'network': return 'wifi-off';
      case 'email': return 'email-alert-outline';
      case 'password': return 'lock-alert-outline';
      case 'auth': return 'shield-alert-outline';
      default: return 'alert-circle-outline';
    }
  };

  const getErrorColor = () => {
    switch (errorType) {
      case 'network': return '#dd6b20';
      case 'auth': return '#e53e3e';
      default: return '#e53e3e';
    }
  };

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.card, { transform: [{ translateX: shakeAnim }] }]}>
        <Image source={assets[0]} style={styles.logo} contentFit="cover" />
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Sign in to continue</Text>

        {/* Error Banner */}
        {errorMsg !== '' && (
          <View style={[styles.errorBanner, { borderLeftColor: getErrorColor() }]}>  
            <MCIcon name={getErrorIcon()} size={20} color={getErrorColor()} />
            <Text style={styles.errorBannerText}>{errorMsg}</Text>
            <TouchableOpacity onPress={clearErrors} style={styles.errorClose}>
              <MCIcon name="close" size={16} color="#999" />
            </TouchableOpacity>
          </View>
        )}

        {/* Email Input */}
        <View style={[styles.inputContainer, emailError ? styles.inputError : null]}>
          <Icon name="envelope" size={18} color={emailError ? '#e53e3e' : '#2563eb'} style={styles.iconmail} />
          <TextInput
            placeholder="Email"
            placeholderTextColor="#a0aec0"
            style={styles.input}
            value={email}
            onChangeText={(t) => { setEmail(t); if (emailError) setEmailError(''); if (errorMsg) clearErrors(); }}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          {emailError ? <MCIcon name="alert-circle" size={18} color="#e53e3e" /> : null}
        </View>
        {emailError ? <Text style={styles.fieldError}>{emailError}</Text> : null}

        {/* Password Input */}
        <View style={[styles.passwordContainer, passwordError ? styles.inputError : null]}>
          <Icon name="lock" size={20} color={passwordError ? '#e53e3e' : '#2563eb'} style={styles.iconpass} />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#a0aec0"
            secureTextEntry={!passwordVisible}
            style={styles.passwordInput}
            value={password}
            onChangeText={(t) => { setPassword(t); if (passwordError) setPasswordError(''); if (errorMsg) clearErrors(); }}
          />
          <TouchableOpacity onPress={() => setPasswordVisible(!passwordVisible)} style={styles.eyeIconContainer}>
            <Icon name={passwordVisible ? 'eye' : 'eye-slash'} size={18} color="#2563eb" />
          </TouchableOpacity>
          {passwordError ? <MCIcon name="alert-circle" size={18} color="#e53e3e" style={{ marginLeft: 4 }} /> : null}
        </View>
        {passwordError ? <Text style={styles.fieldError}>{passwordError}</Text> : null}

        {/* Login Button */}
        <TouchableOpacity onPress={handleLogin} style={styles.button} disabled={loading} activeOpacity={0.8}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign In</Text>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>OR</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Google Sign-In */}
        <TouchableOpacity onPress={handleGoogleLogin} style={styles.googleButton} disabled={loading} activeOpacity={0.8}>
          <Icon name="google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
          <Text style={styles.googleButtonText}>Continue with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signUpContainer}
          onPress={() => navigation.navigate('SignUp')}
        >
          <Text style={styles.signUpText}>Don't have an account? <Text style={styles.signUpHighlight}>Sign Up</Text></Text>
        </TouchableOpacity>
      </Animated.View>

      {/* Ask which kind of account before handing off to Google. Existing users
          are logged into their real account regardless of what they pick. */}
      <Modal
        visible={roleModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setRoleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setRoleModalVisible(false)}
        >
          <TouchableOpacity style={styles.modalCard} activeOpacity={1}>
            <Text style={styles.modalTitle}>Continue as</Text>
            <Text style={styles.modalSubtitle}>
              Choose the kind of account you want. If you already have one, we'll
              just sign you in.
            </Text>

            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => startGoogleFlow('student')}
              activeOpacity={0.8}
            >
              <MCIcon name="school-outline" size={24} color="#2563eb" />
              <View style={styles.roleTextWrap}>
                <Text style={styles.roleTitle}>Student</Text>
                <Text style={styles.roleDesc}>Find and book off-campus accommodation</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.roleOption}
              onPress={() => startGoogleFlow('landlord')}
              activeOpacity={0.8}
            >
              <MCIcon name="home-city-outline" size={24} color="#2563eb" />
              <View style={styles.roleTextWrap}>
                <Text style={styles.roleTitle}>Landlord</Text>
                <Text style={styles.roleDesc}>List your property and manage bookings</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setRoleModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f0f2f5' },
  card: { 
    backgroundColor: '#ffffff', borderRadius: 22, padding: 30, width: '90%', 
    elevation: 6, alignItems: 'center', 
    shadowColor: '#000', shadowOpacity: 0.12, shadowRadius: 15, shadowOffset: { width: 0, height: 4 },
  },
  logo: { width: 100, height: 100, borderRadius: 50, borderWidth: 4, borderColor: '#eff6ff', marginBottom: 16 },
  title: { fontSize: 26, fontWeight: '800', marginBottom: 4, textAlign: 'center', color: '#1a365d' },
  subtitle: { fontSize: 14, color: '#718096', marginBottom: 24 },

  // Error Banner
  errorBanner: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff5f5', 
    borderRadius: 10, padding: 12, marginBottom: 16, width: '100%',
    borderLeftWidth: 4, borderLeftColor: '#e53e3e', gap: 10,
  },
  errorBannerText: { flex: 1, fontSize: 13, color: '#c53030', lineHeight: 18 },
  errorClose: { padding: 2 },

  // Field errors
  fieldError: { color: '#e53e3e', fontSize: 12, alignSelf: 'flex-start', marginBottom: 8, marginTop: -4, marginLeft: 4 },

  // Inputs
  inputContainer: { 
    flexDirection: 'row', alignItems: 'center', borderColor: '#e2e8f0', 
    borderWidth: 1.5, borderRadius: 14, marginBottom: 10, width: '100%', 
    paddingHorizontal: 12, backgroundColor: '#f7fafc',
  },
  inputError: { borderColor: '#e53e3e', backgroundColor: '#fff5f5' },
  input: { flex: 1, height: 50, paddingLeft: 8, fontSize: 15, color: '#2d3748' },
  passwordContainer: { 
    flexDirection: 'row', alignItems: 'center', borderColor: '#e2e8f0', 
    borderWidth: 1.5, borderRadius: 14, width: '100%', marginBottom: 10, 
    paddingHorizontal: 12, backgroundColor: '#f7fafc',
  },
  passwordInput: { flex: 1, height: 50, paddingLeft: 8, fontSize: 15, color: '#2d3748' },
  eyeIconContainer: { padding: 6 },
  iconmail: { marginRight: 4 },
  iconpass: { marginRight: 4 },

  // Button
  button: { 
    backgroundColor: '#2563eb', borderRadius: 14, height: 52, 
    justifyContent: 'center', alignItems: 'center', width: '100%', marginTop: 6,
    elevation: 3, shadowColor: '#2563eb', shadowOpacity: 0.3, shadowRadius: 8,
  },
  buttonText: { color: '#ffffff', fontWeight: '700', fontSize: 17 },
  
  // Divider
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginTop: 18, marginBottom: 14 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
  dividerText: { marginHorizontal: 12, color: '#a0aec0', fontSize: 12, fontWeight: '600' },

  // Google button
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderColor: '#e2e8f0', borderWidth: 1.5, borderRadius: 14, height: 50,
    width: '100%', backgroundColor: '#ffffff',
  },
  googleButtonText: { color: '#2d3748', fontWeight: '600', fontSize: 15 },

  // Google role picker
  modalBackdrop: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center', alignItems: 'center', padding: 24,
  },
  modalCard: {
    backgroundColor: '#ffffff', borderRadius: 20, padding: 24, width: '100%',
    elevation: 8, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 20,
    shadowOffset: { width: 0, height: 6 },
  },
  modalTitle: { fontSize: 19, fontWeight: '700', color: '#2d3748', marginBottom: 6 },
  modalSubtitle: { fontSize: 13, color: '#718096', lineHeight: 19, marginBottom: 18 },
  roleOption: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderColor: '#e2e8f0', borderWidth: 1.5, borderRadius: 14,
    padding: 16, marginBottom: 12, backgroundColor: '#f7fafc',
  },
  roleTextWrap: { flex: 1 },
  roleTitle: { fontSize: 15, fontWeight: '700', color: '#2d3748' },
  roleDesc: { fontSize: 12, color: '#718096', marginTop: 2 },
  modalCancel: { padding: 10, alignItems: 'center', marginTop: 2 },
  modalCancelText: { color: '#718096', fontSize: 14, fontWeight: '600' },

  signUpContainer: { marginTop: 18, padding: 8 },
  signUpText: { color: '#718096', fontSize: 14, textAlign: 'center' },
  signUpHighlight: { color: '#2563eb', fontWeight: '700' },
});
