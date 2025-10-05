import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { useAuth } from "../AuthContext";

// Screens
import SplashScreen from "../screens/SplashScreen";
import WelcomeScreen from "../screens/WelcomeScreen";
import LoginScreen from "../screens/LoginScreen";
import RegisterScreen from "../screens/RegisterScreen";
import GettingReadyScreen from "../screens/GettingReadyScreen";
import ResetPasswordScreen from "../screens/ResetPasswordScreen";
import NotificationScreen from "../screens/NotificationScreen";
import ConfirmOrderScreen from "../screens/ConfirmOrderScreen";
import DriverSelectionScreen from "../screens/DriverSelectionScreen";

// Main App Tabs
import TabNavigator from "./TabNavigator";

const Stack = createNativeStackNavigator();

const AppNavigator = () => {
  const { user, loading, isFirstTime } = useAuth(); // ✅ get isFirstTime
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 2000);
    return () => clearTimeout(timer);
  }, []);

  if (loading || showSplash) return <SplashScreen />;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!user ? (
        // Auth Flow for unauthenticated users
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="Register" component={RegisterScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
        </>
      ) : isFirstTime ? (
        // ✅ First-time users go to GettingReady first
        <Stack.Screen
          name="GettingReady"
          component={GettingReadyScreen}
          options={{ gestureEnabled: false }}
        />
      ) : (
        // Main App Flow for returning users
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
