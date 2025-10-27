// screens/LoginScreen.js
import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Modal,
  ScrollView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext"; 

const LoginScreen = ({ navigation }) => {
  const { login } = useAuth(); 

  const [formData, setFormData] = useState({ phone: "", password: "" });
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleChange = (name, value) => {
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: "" });
  };

  const validate = () => {
    let tempErrors = {};
    if (!formData.phone.trim()) tempErrors.phone = "Please enter your phone number";
    if (!formData.password) tempErrors.password = "Please enter your password";
    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) return;

    setLoginLoading(true);

    try {
      
      await login(formData.phone.trim(), formData.password.trim());

      
    } catch (error) {
      setErrors({ general: error.message || "Login failed. Please check your credentials." });
    } finally {
      setLoginLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0f2027", "#203a43", "#2c5364"]} style={styles.container}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
        <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.title}>Welcome Back to GasLT</Text>
          <Text style={styles.subtitle}>
            Login to continue using GasLT, Zimbabwe's fastest and safest gas delivery service.
          </Text>

          {/* Phone Input */}
          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor="#bbb"
            autoCapitalize="none"
            value={formData.phone}
            onChangeText={(v) => handleChange("phone", v)}
          />
          {errors.phone && <Text style={styles.errorText}>{errors.phone}</Text>}

          {/* Password Input */}
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor="#bbb"
              secureTextEntry={!showPassword}
              value={formData.password}
              onChangeText={(v) => handleChange("password", v)}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeButton}>
              <Ionicons name={showPassword ? "eye-off" : "eye"} size={22} color="#00eaff" />
            </TouchableOpacity>
          </View>
          {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          {errors.general && <Text style={styles.errorText}>{errors.general}</Text>}

          {/* Forgot Password */}
          <TouchableOpacity onPress={() => navigation.navigate("ResetPassword")} style={styles.forgotButton}>
            <Text style={styles.forgotText}>
              Forgot your password? <Text style={{ color: "#00eaff", fontWeight: "bold" }}>Reset</Text>
            </Text>
          </TouchableOpacity>

          {/* Login Button */}
          <TouchableOpacity onPress={handleLogin} disabled={loginLoading} activeOpacity={0.85}>
            <LinearGradient colors={["#00c6ff", "#0072ff"]} style={styles.loginButton}>
              {loginLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginText}>Login</Text>}
            </LinearGradient>
          </TouchableOpacity>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Don't have an account?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={[styles.footerText, { color: "#00eaff", marginLeft: 5 }]}>Sign Up</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Loading Overlay */}
      {loginLoading && (
        <Modal transparent animationType="fade">
          <View style={styles.overlay}>
            <ActivityIndicator size="large" color="#00eaff" />
            <Text style={styles.loadingText}>Logging in...</Text>
          </View>
        </Modal>
      )}
    </LinearGradient>
  );
};

export default LoginScreen;


const styles = StyleSheet.create({
  container: { flex: 1 },
  card: {
    marginHorizontal: 20,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#00eaff",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
  title: { fontSize: 26, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#aaa", textAlign: "center", marginBottom: 28 },
  input: {
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0, 234, 255, 0.5)",
  },
  passwordContainer: { position: "relative" },
  eyeButton: { position: "absolute", right: 12, top: 14 },
  loginButton: {
    marginTop: 12,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
    shadowColor: "#00eaff",
    shadowOpacity: 0.6,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 0 },
  },
  loginText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 20 },
  footerText: { color: "#ccc", fontSize: 14 },
  errorText: { color: "#ff4d4d", fontWeight: "bold", textAlign: "center", marginBottom: 8 },
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: { color: "#fff", marginTop: 10 },
  forgotButton: { alignSelf: "center", marginBottom: 8, marginTop: -4 },
  forgotText: { color: "#aaa", fontSize: 13, textDecorationLine: "underline" },
});
