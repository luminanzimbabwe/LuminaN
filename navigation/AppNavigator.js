import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, StyleSheet } from 'react-native';

import { useAuth } from '../context/AuthContext';
import TabNavigator from './TabNavigator';

// Screens
import SplashScreen from "../src/screens/SplashScreen";
import WelcomeScreen from "../src/screens/WelcomeScreen";
import LoginScreen from "../src/screens/LoginScreen";
import RegisterScreen from "../src/screens/RegisterScreen";
import VerifyOTPScreen from "../src/screens/VerifyOTPScreen";
import GettingReadyScreen from "../src/screens/GettingReadyScreen";
import ConfirmOrderScreen from "../src/screens/ConfirmOrderScreen";

import OrderTrackingScreen from "../src/screens/OrderTrackingScreen";
import NotificationScreen from "../src/screens/NotificationScreen";
import EditProfileScreen from "../src/screens/EditProfileScreen";
import ChangePasswordScreen from "../src/screens/ChangePasswordScreen";
import DataPolicyScreen from "../src/screens/DataPolicyScreen";
import SupportScreen from "../src/screens/SupportScreen";


const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { isLoading, token, tempUser, isSetupComplete } = useAuth(); 

  // Debug log to inspect auth/navigation state after reload
  React.useEffect(() => {
    console.warn('[AppNavigator] auth state:', {
      isLoading,
      token: !!token,
      tokenValue: token ? token.toString().slice(0,8) + '...' : null,
      tempUser,
      isSetupComplete,
    });
  }, [isLoading, token, tempUser, isSetupComplete]);

  // 1️⃣ Show Splash screen while auth state is loading
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SplashScreen />
      </View>
    );
  }

  // 2️⃣ Temp user flow (user registered but OTP not verified)
  if (tempUser?.tempUserId || tempUser?.temp_user_id) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
      </Stack.Navigator>
    );
  }

  // 3️⃣ Authenticated users
  if (token) {
    // If setup is not complete, show GettingReadyScreen first
    if (!isSetupComplete) {
      return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="GettingReady" component={GettingReadyScreen} />
        </Stack.Navigator>
      );
    }

    // Token exists → always show main app
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="MainTabs" component={TabNavigator} />
        <Stack.Screen name="ConfirmOrder" component={ConfirmOrderScreen} />
        <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
        <Stack.Screen name="DataPolicy" component={DataPolicyScreen} />
        <Stack.Screen name="Support" component={SupportScreen} />
      </Stack.Navigator>
    );
  }

  // 4️⃣ Public / unauthenticated flow
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="ResetPassword" component={LoginScreen} />
    </Stack.Navigator>
  );
};

export default AppNavigator;

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#18181b',
  },
});
