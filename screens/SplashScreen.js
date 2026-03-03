import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, StatusBar, ActivityIndicator, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { useAssets } from 'expo-asset';
import { useNavigation } from '@react-navigation/native';

const { width } = Dimensions.get('window');

const SplashScreen = () => {
  const [assets, error] = useAssets([require('../assets/ThabStayLogo.jpeg')]);
  const navigation = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Sequence of animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1500,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 1500,
        useNativeDriver: true,
      })
    ]).start();

    // Navigate after delay
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  if (error) {
    console.error('Error loading assets:', error);
    return null;
  }

  if (!assets || !assets[0]) {
    return null;
  }

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      {/* Decorative Circles for modern look */}
      <View style={styles.circle1} />
      <View style={styles.circle2} />

      <Animated.View style={[styles.contentContainer, { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY }] }]}>
        <View style={styles.logoContainer}>
           <Image source={assets[0]} style={styles.logo} contentFit="contain" />
        </View>
        
        <Text style={styles.appName}>ThabStay</Text>
        <Text style={styles.tagline}>Find your home away from home</Text>
      </Animated.View>

      <View style={styles.footer}>
        <ActivityIndicator size="small" color="#007BFF" />
        <Text style={styles.version}>v1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  circle1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: 'rgba(0, 123, 255, 0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 123, 255, 0.05)',
  },
  contentContainer: {
    alignItems: 'center',
    zIndex: 10,
  },
  logoContainer: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    marginBottom: 30,
    padding: 15,
  },
  logo: {
    width: '100%',
    height: '100%',
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#007BFF',
    letterSpacing: 1,
    marginBottom: 10,
  },
  tagline: {
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  version: {
    marginTop: 10,
    color: '#ccc',
    fontSize: 12,
  },
});

export default SplashScreen;
