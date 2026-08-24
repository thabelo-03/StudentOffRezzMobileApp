// "Continue with Google" — the whole flow in one drop-in component.
//
// Why the role picker: the backend defaults a new Google user to 'student' when
// no role is supplied (api/googleAuth.js), so a landlord signing up with Google
// would silently get the wrong kind of account. We ask first and pass ?role=.
//
// Why two outcomes: for an EXISTING account the backend deep-links back a JWT
// directly. For a NEW one it deep-links a short-lived `prefill` token instead,
// which we exchange at POST /auth/google/complete for a session — no password,
// mirroring the web signup that uses the g_prefill cookie (the app has no cookie
// jar, so the token rides in the deep link).
import React, { useState } from 'react';
import { StyleSheet, View, TouchableOpacity, Text, Modal } from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome';
import MCIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import api, { BASE_URL } from '../services/api';

WebBrowser.maybeCompleteAuthSession();

export default function GoogleAuthButton({ label = 'Continue with Google', disabled, onStart, onSuccess, onError }) {
  const [roleModalVisible, setRoleModalVisible] = useState(false);

  const persist = async (token, user) => {
    await AsyncStorage.setItem('token', String(token));
    let profile = user;
    if (!profile) {
      // The api interceptor attaches the token we just stored.
      const me = await api.get('/auth/me');
      profile = me.data.user;
    }
    await AsyncStorage.setItem('user', JSON.stringify(profile));
    return profile;
  };

  const startGoogleFlow = async (role) => {
    setRoleModalVisible(false);
    try {
      onStart?.();
      // Deep link the backend returns to (e.g. thabstay://google-auth).
      const redirectUrl = Linking.createURL('google-auth');
      const authUrl = `${BASE_URL}/auth/google?platform=mobile&role=${role}` +
        `&redirect=${encodeURIComponent(redirectUrl)}`;
      const result = await WebBrowser.openAuthSessionAsync(authUrl, redirectUrl);

      if (result.type !== 'success' || !result.url) {
        onError?.(null); // user dismissed the browser — not an error worth showing
        return;
      }

      const { queryParams } = Linking.parse(result.url);
      if (queryParams?.error) {
        onError?.('Google sign-in failed. Please try again or use email.');
        return;
      }

      // Existing account — backend already issued the JWT.
      if (queryParams?.token) {
        onSuccess?.(await persist(queryParams.token, null));
        return;
      }

      // New account — finish signup without a password.
      if (queryParams?.google_prefill && queryParams?.prefill) {
        // Absolute URL: the Google routes live at /auth on the server root, not
        // under the /api prefix `api` is configured with.
        const { data } = await api.post(`${BASE_URL}/auth/google/complete`, {
          prefill: queryParams.prefill,
          role: queryParams.role || role,
        });
        onSuccess?.(await persist(data.token, data.user));
        return;
      }

      onError?.('Google sign-in failed.');
    } catch (e) {
      onError?.(e?.response?.data?.error || 'Google sign-in failed. Please try again.');
    }
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setRoleModalVisible(true)}
        style={styles.googleButton}
        disabled={disabled}
        activeOpacity={0.8}
      >
        <Icon name="google" size={18} color="#EA4335" style={{ marginRight: 10 }} />
        <Text style={styles.googleButtonText}>{label}</Text>
      </TouchableOpacity>

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

            <TouchableOpacity style={styles.roleOption} onPress={() => startGoogleFlow('student')} activeOpacity={0.8}>
              <MCIcon name="school-outline" size={24} color="#2563eb" />
              <View style={styles.roleTextWrap}>
                <Text style={styles.roleTitle}>Student</Text>
                <Text style={styles.roleDesc}>Find and book off-campus accommodation</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.roleOption} onPress={() => startGoogleFlow('landlord')} activeOpacity={0.8}>
              <MCIcon name="home-city-outline" size={24} color="#2563eb" />
              <View style={styles.roleTextWrap}>
                <Text style={styles.roleTitle}>Landlord</Text>
                <Text style={styles.roleDesc}>List your property and manage bookings</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalCancel} onPress={() => setRoleModalVisible(false)}>
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  googleButton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    borderColor: '#e2e8f0', borderWidth: 1.5, borderRadius: 14, height: 50,
    width: '100%', backgroundColor: '#ffffff',
  },
  googleButtonText: { color: '#2d3748', fontWeight: '600', fontSize: 15 },

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
});
