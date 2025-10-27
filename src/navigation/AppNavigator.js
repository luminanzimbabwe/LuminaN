import React from 'react';
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, StyleSheet } from 'react-native'; 
import { useAuth } from '../context/AuthContext'; 
import TabNavigator from './TabNavigator';
import VerifyOTPScreen from "../screens/VerifyOTPScreen";
import SplashScreen from "../screens/SplashScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen"; 
import RegisterScreen from "../screens/RegisterScreen"; 
import ResetPasswordScreen from "../screens/ResetPasswordScreen"; 
import GettingReadyScreen from "../screens/GettingReadyScreen";
import NotificationScreen from "../screens/NotificationScreen";
import ConfirmOrderScreen from "../screens/ConfirmOrderScreen";
import OrderTrackingScreen from "../screens/OrderTrackingScreen";
import EditProfileScreen from "../screens/EditProfileScreen";
import ChangePasswordScreen from "../screens/ChangePasswordScreen";
import DataPolicyScreen from "../screens/DataPolicyScreen";
import SupportScreen from "../screens/SupportScreen";
import ChatbotLogicScreen from "../logic/ChatbotLogic";
import ProgressScreen from "../screens/ProgressScreen";
import PaymentPendingScreen from "../screens/PaymentPendingScreen";

const Stack = createNativeStackNavigator();

/**
 * @description Manages the main application navigation flow based on authentication state
 * and user setup completion status.
 */
const AppNavigator = () => {
  // Include isSetupComplete from the auth context. The provider stores a separate
  // flag in AsyncStorage and exposes it as `isSetupComplete`. Fall back to
  // `user.setupComplete` if the stored flag hasn't been applied yet.
  const { isAuthenticated, isLoading, user, isSetupComplete } = useAuth();

  // Show a splash screen while authentication status is being determined
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <SplashScreen />
      </View>
    );
  }
  // Determine whether the authenticated user still needs the setup flow.
  // Prefer the explicit stored flag `isSetupComplete`, but fall back to the
  // server-provided `user.setupComplete` when necessary.
  const needsSetup = isAuthenticated && !(isSetupComplete || (user && user.setupComplete));

  // Rather than relying on `initialRouteName` (which only applies at mount),
  // render different navigator stacks based on the current auth state. This
  // ensures that when `user` changes (login/logout) the correct stack is shown
  // immediately.

  // 1) Unauthenticated stack
  if (!isAuthenticated) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Welcome">
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="VerifyOTP" component={VerifyOTPScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </Stack.Navigator>
    );
  }

  // 2) Authenticated but needs setup
  if (needsSetup) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="GettingReadyScreen">
        <Stack.Screen name="GettingReadyScreen" component={GettingReadyScreen} />
        {/* Keep MainTabs reachable after setup completes */}
        <Stack.Screen name="MainTabs" component={TabNavigator} />
      </Stack.Navigator>
    );
  }

  // 3) Fully authenticated
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="MainTabs">
      <Stack.Screen name="MainTabs" component={TabNavigator} />

      {/* Other Deep-Linkable Authenticated Screens */}
      <Stack.Screen name="ConfirmOrder" component={ConfirmOrderScreen} />
      <Stack.Screen name="ProgressScreen" component={ProgressScreen} />

      <Stack.Screen name="OrderTracking" component={OrderTrackingScreen} />
      <Stack.Screen name="Notification" component={NotificationScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ChangePassword" component={ChangePasswordScreen} />
      <Stack.Screen name="DataPolicy" component={DataPolicyScreen} />
      <Stack.Screen name="Support" component={SupportScreen} />
      <Stack.Screen name="ChatbotScreen" component={ChatbotLogicScreen} />
      <Stack.Screen name="PaymentPendingScreen" component={PaymentPendingScreen} />
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