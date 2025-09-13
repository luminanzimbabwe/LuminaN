// navigation/AppNavigator.js
import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../AuthContext";

// Import screens
import SplashScreen from "../screens/SplashScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import VerifyScreen from "../screens/VerifyScreen";
import GettingReadyScreen from "../screens/GettingReadyScreen";
import SetLocationScreen from "../screens/SetLocationScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import NotificationScreen from "../screens/NotificationScreen";
import ConfirmOrderScreen from "../screens/ConfirmOrderScreen";
import DriverSelectionScreen from "../screens/DriverSelectionScreen";

// Import TabNavigator (MainApp)
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading } = useAuth();

  // Show splash screen while checking AsyncStorage
  if (loading) return <SplashScreen />;

  return (
  <Stack.Navigator screenOptions={{ headerShown: false }}>
    {!user ? (
      // Auth flow for non-logged-in users
      <>
        <Stack.Screen name="Welcome" component={WelcomeScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="GettingReady" component={GettingReadyScreen} />
        <Stack.Screen name="SetLocation" component={SetLocationScreen} />
        <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
      </>
    ) : (
      // Fully logged-in → main app flow
      <>
        <Stack.Screen name="MainApp" component={TabNavigator} />
        <Stack.Screen name="Notification" component={NotificationScreen} />
        <Stack.Screen name="ConfirmOrder" component={ConfirmOrderScreen} />
        <Stack.Screen name="DriverSelection" component={DriverSelectionScreen} />
      </>
    )}
  </Stack.Navigator>
);

};

export default AppNavigator;
