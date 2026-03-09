import React from 'react';
import 'react-native-gesture-handler';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Screen Imports
import LoginScreen from './screens/LoginScreen';
import StudentHomeScreen from './screens/StudentHomeScreen';
import SignUpScreen from './screens/SignUpScreen';
import AdminDashboardScreen from './screens/AdminDashboardScreen';
import ManageUsersScreen from './screens/ManageUsersScreen';
import SystemConfigsScreen from './screens/SystemConfigsScreen';
import AdminListingsScreen from './screens/AdminListingsScreen';
import AdminVerificationScreen from './screens/AdminVerificationScreen'; // Import Admin Verification
import AdminReportsScreen from './screens/AdminReportsScreen';
import AdminPaymentsScreen from './screens/AdminPaymentsScreen';
import PaymentsScreen from './screens/PaymentsScreen';
import ProfileScreen from './screens/ProfileScreen';
import LandlordDashboard from './screens/LandlordDashboard'; 
import LandlordInbox from './screens/LandlordInbox';         
import LandlordScreen from './screens/MyListings';           
import TermsAndConditions from './screens/TermsAndCondition';
import SplashScreen from './screens/SplashScreen';
import ChatDetail from './screens/ChatDetail'; // Ensure this exists in /screens
import StudentInbox from './screens/StudentInbox'; // Import StudentInbox
import LandlordVerificationScreen from './screens/LandlordVerificationScreen'; // Import Verification Screen
import StudentVerificationScreen from './screens/StudentVerificationScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// ==========================================
// 1. STUDENT TABS
// ==========================================
function StudentTabs() {
  return (
    <Tab.Navigator 
      initialRouteName="Home"
      screenOptions={{
        tabBarActiveTintColor: '#007BFF',
        headerStyle: { backgroundColor: '#007BFF' },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen 
        name="Home" 
        component={StudentHomeScreen} 
        options={{ 
          tabBarIcon: ({ color }) => <Icon name="home" size={22} color={color} /> 
        }} 
      />
      <Tab.Screen 
        name="Inbox" 
        component={StudentInbox} 
        options={{ 
          tabBarIcon: ({ color }) => <Icon name="email-outline" size={22} color={color} /> 
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarIcon: ({ color }) => <Icon name="account-circle" size={22} color={color} /> 
        }} 
      />
    </Tab.Navigator>
  );
}


// ==========================================
// 2. LANDLORD TABS (Only Main Hubs)
// ==========================================
function LandlordTabs() {
  return (
    <Tab.Navigator 
      initialRouteName="Dashboard"
      screenOptions={{
        tabBarActiveTintColor: '#007BFF',
        headerStyle: { backgroundColor: '#007BFF' },
        headerTintColor: '#fff',
      }}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={LandlordDashboard} 
        options={{ 
          tabBarIcon: ({ color }) => <Icon name="view-dashboard" size={22} color={color} /> 
        }} 
      />
      <Tab.Screen 
        name="My Listings" 
        component={LandlordScreen} 
        options={{ 
          tabBarIcon: ({ color }) => <Icon name="home-city" size={22} color={color} /> 
        }} 
      />
      <Tab.Screen 
        name="Inbox" 
        component={LandlordInbox} 
        options={{ 
          tabBarIcon: ({ color }) => <Icon name="email-outline" size={22} color={color} /> 
        }} 
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          tabBarIcon: ({ color }) => <Icon name="account-circle" size={22} color={color} /> 
        }} 
      />
    </Tab.Navigator>
  );
}

// ==========================================
// 3. MAIN NAVIGATION STACK
// ==========================================
export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        {/* Auth Flow */}
        <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        
        {/* Student Flow */}
        <Stack.Screen name="Student" component={StudentTabs} options={{ headerShown: false }} />
        
        {/* Landlord Flow */}
        <Stack.Screen name="Landlord" component={LandlordTabs} options={{ headerShown: false }} />
        
        {/* Landlord Verification Flow */}
        <Stack.Screen name="LandlordVerification" component={LandlordVerificationScreen} options={{ headerShown: false }} />
        
        {/* Student Verification Flow */}
        <Stack.Screen name="StudentVerification" component={StudentVerificationScreen} options={{ headerShown: false }} />

        {/* ChatDetail MUST be here. 
            When you click a chat in LandlordInbox, 
            it pushes this screen on top of the drawer.
        */}
        <Stack.Screen 
          name="ChatDetail" 
          component={ChatDetail} 
          options={({ route }) => ({ 
            title: route.params?.studentName || 'Chat',
            headerStyle: { backgroundColor: '#007BFF' },
            headerTintColor: '#fff',
          })} 
        />
        
        {/* Admin Flow */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
        <Stack.Screen name="ManageUsers" component={ManageUsersScreen} />
        <Stack.Screen name="SystemConfigs" component={SystemConfigsScreen} />
        <Stack.Screen name="AdminListings" component={AdminListingsScreen} />
        <Stack.Screen name="AdminReports" component={AdminReportsScreen} />
        <Stack.Screen name="AdminVerification" component={AdminVerificationScreen} />
        <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} />
        
        {/* Shared Screens */}
        <Stack.Screen name="Payments" component={PaymentsScreen} />
        <Stack.Screen name="TermsAndConditions" component={TermsAndConditions} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}