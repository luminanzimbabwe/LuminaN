// screens/ResetPasswordScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

const ResetPasswordScreen = ({ navigation }) => {
  const [step, setStep] = useState(1); // 1 = forgot, 2 = reset
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const BACKEND_URL = "https://backend-luminan.onrender.com/api";

  // Step 1: Send reset code
  const handleSendCode = async () => {
    if (!email.trim()) {
      setErrorMessage("Please enter your registered email.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const response = await fetch(`${BACKEND_URL}/forgot-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert(
          "Success",
          "If this account exists, a reset code has been sent to your email."
        );
        setStep(2); // Move to reset password step
      } else {
        setErrorMessage(data.error || JSON.stringify(data));
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      setErrorMessage(`Network or server error: ${error.message}`);
    }
  };

  // Step 2: Reset password
  const handleResetPassword = async () => {
    if (!code.trim() || !newPassword.trim() || !confirmPassword.trim()) {
      setErrorMessage("Please fill all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);
      setErrorMessage("");
      const response = await fetch(`${BACKEND_URL}/reset-password/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      });

      const data = await response.json();
      setLoading(false);

      if (response.ok) {
        Alert.alert("Success", "Password has been reset successfully.", [
          { text: "OK", onPress: () => navigation.goBack() },
        ]);
      } else {
        // Show all possible errors from backend
        if (data.error) setErrorMessage(data.error);
        if (data.details) setErrorMessage(prev => prev + "\n" + data.details);
        if (!data.error && !data.details) setErrorMessage(JSON.stringify(data));
      }
    } catch (error) {
      setLoading(false);
      console.error(error);
      setErrorMessage(`Network or server error: ${error.message}`);
    }
  };

  return (
    <LinearGradient
      colors={["#0f2027", "#203a43", "#2c5364"]}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          <View style={styles.card}>
            <Text style={styles.title}>Reset Password</Text>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
            {step === 1 ? (
              <>
                <Text style={styles.subtitle}>
                  Enter your registered email to receive a reset code.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Email"
                  placeholderTextColor="#888"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleSendCode}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Send Reset Code</Text>
                  )}
                </TouchableOpacity>
              </>
            ) : (
              <>
                <Text style={styles.subtitle}>
                  Enter the 6-digit code sent to your email and choose a new password.
                </Text>
                <TextInput
                  style={styles.input}
                  placeholder="Reset Code"
                  placeholderTextColor="#888"
                  value={code}
                  onChangeText={setCode}
                  keyboardType="number-pad"
                />
                <TextInput
                  style={styles.input}
                  placeholder="New Password"
                  placeholderTextColor="#888"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                />
                <TextInput
                  style={styles.input}
                  placeholder="Confirm New Password"
                  placeholderTextColor="#888"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                />
                <TouchableOpacity
                  style={styles.button}
                  onPress={handleResetPassword}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.buttonText}>Reset Password</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

export default ResetPasswordScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 16,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#18181b",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: "#444",
    textAlign: "center",
    marginBottom: 20,
  },
  input: {
    backgroundColor: "rgba(0,234,255,0.05)",
    borderWidth: 1,
    borderColor: "#00eaff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    color: "#000",
  },
  button: {
    backgroundColor: "#00eaff",
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  errorText: {
    color: "#FF3B3B",
    fontWeight: "bold",
    marginBottom: 12,
    textAlign: "center",
  },
});
