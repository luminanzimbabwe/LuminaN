import React, { useEffect } from "react";
import { StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

// 🔧 Import the central Navigator
import AppNavigator from "./src/navigation/AppNavigator";

// ⭐️ Import the Auth Provider
import { AuthProvider } from "./src/context/AuthContext"; 

// 🔍 Debug function to check stored tokens
const debugTokens = async () => {
  try {
    const accessToken = await AsyncStorage.getItem("accessToken");
    const refreshToken = await AsyncStorage.getItem("refreshToken");

    console.log("===== Debug Tokens =====");
    console.log("Access Token:", accessToken);
    console.log("Refresh Token:", refreshToken);

    if (!accessToken && !refreshToken) {
      console.log("No tokens found in storage.");
    }
    console.log("========================");
  } catch (err) {
    console.error("Failed to fetch tokens from AsyncStorage:", err);
  }
};

const App = () => {
  // Call debug function on app start
  useEffect(() => {
    debugTokens();
  }, []);

  return (
    <SafeAreaProvider>
      {/* 1. Wrap the entire application with the AuthProvider */}
      <AuthProvider>
        <NavigationContainer>
          {/* The entire application's screen flow is now defined here */}
          <AppNavigator />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
};

export default App;

// ✅ Styles (Kept, though usually moved to a separate file)
const styles = StyleSheet.create({
  // You can define global styles here if necessary
});
