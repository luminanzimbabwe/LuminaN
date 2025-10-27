import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import axiosInstance from "../services/auth.service";
import { ENDPOINTS } from "../config/api.config";

const { width } = Dimensions.get("window");

const PaymentPendingScreen = ({ navigation, route }) => {
  const { orderId, paymentMethod, merchantNumber, totalPrice } = route.params;
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Start polling for payment status
    const pollInterval = setInterval(checkPaymentStatus, 5000); // Poll every 5 seconds
    return () => clearInterval(pollInterval);
  }, []);

  const checkPaymentStatus = async () => {
    try {
      const response = await axiosInstance.get(ENDPOINTS.ORDERS.STATUS(orderId));
      const { payment_status } = response.data;
      if (payment_status === "paid") {
        navigation.replace("ProgressScreen", { orderId });
      }
    } catch (err) {
      console.error("Error checking payment status:", err);
    }
  };

  const handleManualCheck = async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get(ENDPOINTS.ORDERS.STATUS(orderId));
      const { payment_status } = response.data;
      if (payment_status === "paid") {
        navigation.replace("ProgressScreen", { orderId });
      } else {
        Alert.alert("Payment Pending", "Payment not yet confirmed. Please try again in a moment.");
      }
    } catch (err) {
      Alert.alert("Error", "Unable to check payment status. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const getPaymentLabel = (method) => {
    switch (method) {
      case "ecocash": return "Ecocash";
      case "onemoney": return "OneMoney";
      default: return method.toUpperCase();
    }
  };

  return (
    <LinearGradient colors={["#0a0e27", "#16213e", "#1a2332"]} style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="wallet" size={80} color="#00eaff" style={styles.icon} />
        <Text style={styles.title}>Complete Your Payment</Text>
        <Text style={styles.subtitle}>
          Please complete the payment using {getPaymentLabel(paymentMethod)} to proceed with your order.
        </Text>
        <View style={styles.instructions}>
          <Text style={styles.instructionText}>
            1. Dial *151# on your phone
          </Text>
          <Text style={styles.instructionText}>
            2. Select "Make Payment"
          </Text>
          <Text style={styles.instructionText}>
            3. Enter Merchant Number: {merchantNumber}
          </Text>
          <Text style={styles.instructionText}>
            4. Enter Amount: ${totalPrice}
          </Text>
          <Text style={styles.instructionText}>
            5. Confirm the payment
          </Text>
        </View>
        <Text style={styles.waitingText}>
          Waiting for payment confirmation...
        </Text>
        <ActivityIndicator size="large" color="#00eaff" style={styles.spinner} />
        <TouchableOpacity style={styles.button} onPress={handleManualCheck} disabled={loading}>
          <LinearGradient colors={["#00eaff", "#0ea5e9"]} style={styles.buttonGradient}>
            <Ionicons name="refresh" size={20} color="#fff" />
            <Text style={styles.buttonText}>
              {loading ? "Checking..." : "I Have Paid - Check Status"}
            </Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
};

export default PaymentPendingScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 20 },
  icon: { marginBottom: 20 },
  title: { color: "#fff", fontSize: width < 400 ? 24 : 28, fontWeight: "bold", textAlign: "center", marginBottom: 10 },
  subtitle: { color: "#ddd", fontSize: width < 400 ? 14 : 16, textAlign: "center", marginBottom: 20 },
  instructions: { backgroundColor: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 10, marginBottom: 20, width: "100%" },
  instructionText: { color: "#fff", fontSize: width < 400 ? 12 : 14, marginBottom: 5 },
  waitingText: { color: "#aaa", fontSize: width < 400 ? 12 : 14, textAlign: "center", marginBottom: 20 },
  spinner: { marginBottom: 20 },
  button: { width: "80%" },
  buttonGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: "#fff", fontSize: width < 400 ? 14 : 16, fontWeight: "600", marginLeft: 8 },
});
