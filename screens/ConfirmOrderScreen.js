// screens/ConfirmOrder.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Animated,
  ActivityIndicator,
  Platform,
  Dimensions,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { useAuth } from "../AuthContext";

const BACKEND_URL = "http://localhost:8000";
const { width } = Dimensions.get("window");

const ConfirmOrder = ({ navigation, route }) => {
  const { package: selectedPackage, customCylinders, customWeight, customNotes } = route.params;

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState(customNotes || "");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);

  const { authToken } = useAuth();
  const confirmButtonScale = useRef(new Animated.Value(1)).current;

  // Compute order weight and quantity
  const packageWeight = selectedPackage?.weight
    ? parseFloat(selectedPackage.weight)
    : parseFloat(customWeight || 1);

  const quantity = selectedPackage?.id ? 1 : Math.max(parseInt(customCylinders || "1"), 1);
  const totalWeight = packageWeight * quantity;

  const animateConfirmButton = () => {
    Animated.sequence([
      Animated.timing(confirmButtonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(confirmButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleSubmitOrder = async () => {
    if (!deliveryAddress.trim()) return setErrorMessage("Please enter a delivery address.");
    if (!phone.trim()) return setErrorMessage("Please enter a phone number.");

    try {
      setLoading(true);
      setErrorMessage("");

      const payload = {
        quantity,
        weight: packageWeight,
        delivery_address: deliveryAddress.trim(),
        payment_method: paymentMethod,
        notes: notes.trim(),
        delivery_type: "home_delivery",
        scheduled_time: null,
        phone: phone.trim(),
        ...(selectedPackage?.id && { product_id: selectedPackage.id }),
      };

      console.log("Submitting order:", payload);

      const res = await fetch(`${BACKEND_URL}/orders/create/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccessModalVisible(true);
        setTimeout(() => {
          setSuccessModalVisible(false);
          // Pass totalWeight to DriverSelection
          navigation.navigate("DriverSelection", { orderId: data.order_id, weight: totalWeight });
        }, 1500);
      } else {
        setErrorMessage(data.error || "Failed to create order");
      }
    } catch (err) {
      console.error("Order submission failed:", err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={["#0a0e27", "#16213e", "#1a2332"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Ionicons name="cart" size={26} color="#00eaff" />
          <Text style={styles.headerText}>Confirm Your Order</Text>
        </View>

        {/* Order Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          {selectedPackage ? (
            <Text style={styles.summaryItem}>Package: {selectedPackage.weight}kg</Text>
          ) : (
            <Text style={styles.summaryItem}>
              Custom Cylinders: {customCylinders}, Weight: {customWeight}kg
            </Text>
          )}
          <Text style={styles.summaryItem}>Quantity: {quantity}</Text>
          <Text style={styles.summaryItem}>Total Weight: {totalWeight}kg</Text>
          {notes ? <Text style={styles.summaryItem}>Notes: {notes}</Text> : null}
        </View>

        {/* Delivery Address */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Delivery Address</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter delivery address"
            placeholderTextColor="#888"
            value={deliveryAddress}
            onChangeText={setDeliveryAddress}
          />
        </View>

        {/* Phone Number */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Phone Number</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter your phone number"
            placeholderTextColor="#888"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
        </View>

        {/* Payment Method */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <View style={styles.paymentOptions}>
            {["cash", "card"].map((method) => (
              <TouchableOpacity
                key={method}
                style={[styles.paymentOption, paymentMethod === method && styles.paymentOptionSelected]}
                onPress={() => setPaymentMethod(method)}
              >
                <Ionicons
                  name={method === "cash" ? "cash-outline" : "card-outline"}
                  size={20}
                  color={paymentMethod === method ? "#00eaff" : "#aaa"}
                />
                <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextSelected]}>
                  {method.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Additional Notes */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Additional Notes</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, textAlignVertical: "top" }]}
            placeholder="Any delivery instructions..."
            placeholderTextColor="#888"
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

        {/* Confirm Button */}
        <Animated.View style={{ transform: [{ scale: confirmButtonScale }] }}>
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={() => {
              animateConfirmButton();
              handleSubmitOrder();
            }}
            disabled={loading}
          >
            <LinearGradient colors={["#00eaff", "#0ea5e9"]} style={styles.confirmGradient}>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.confirmText}>{loading ? "Placing Order..." : "Confirm Order"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Loading Spinner */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00eaff" />
        </View>
      )}

      {/* Success Modal */}
      <Modal isVisible={isSuccessModalVisible} style={styles.modal}>
        <View style={styles.modalContent}>
          <Ionicons name="checkmark-circle" size={60} color="#00eaff" />
          <Text style={styles.successText}>Order Created Successfully!</Text>
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default ConfirmOrder;

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 24 : 16 },
  scrollContent: { flexGrow: 1, paddingBottom: 80 },
  header: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  headerText: { color: "#fff", fontSize: width < 400 ? 16 : 18, fontWeight: "600", marginLeft: 8 },
  summaryCard: { backgroundColor: "rgba(255,255,255,0.05)", padding: 16, borderRadius: 12, marginBottom: 20 },
  summaryTitle: { color: "#00eaff", fontSize: width < 400 ? 14 : 16, fontWeight: "600", marginBottom: 8 },
  summaryItem: { color: "#ddd", fontSize: width < 400 ? 12 : 14, marginBottom: 4 },
  inputGroup: { marginBottom: 20 },
  label: { color: "#aaa", fontSize: width < 400 ? 12 : 14, marginBottom: 6 },
  input: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, padding: 12, color: "#fff" },
  paymentOptions: { flexDirection: "row", marginTop: 10 },
  paymentOption: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.05)", paddingVertical: 10, paddingHorizontal: 14, borderRadius: 10, marginRight: 10 },
  paymentOptionSelected: { borderColor: "#00eaff", borderWidth: 1, backgroundColor: "rgba(0,234,255,0.1)" },
  paymentText: { color: "#aaa", marginLeft: 6, fontSize: width < 400 ? 12 : 14 },
  paymentTextSelected: { color: "#00eaff", fontWeight: "600" },
  confirmButton: { marginTop: 20 },
  confirmGradient: { flexDirection: "row", justifyContent: "center", alignItems: "center", paddingVertical: 14, borderRadius: 12 },
  confirmText: { color: "#fff", fontSize: width < 400 ? 14 : 16, fontWeight: "600", marginLeft: 8 },
  loadingContainer: { ...StyleSheet.absoluteFillObject, justifyContent: "center", alignItems: "center", backgroundColor: "rgba(0,0,0,0.3)" },
  errorContainer: { marginTop: 10, alignItems: "center" },
  errorText: { color: "red", fontSize: width < 400 ? 12 : 14 },
  modal: { justifyContent: "center", alignItems: "center", margin: 0 },
  modalContent: { backgroundColor: "#1a2332", padding: 20, borderRadius: 10, alignItems: "center" },
  successText: { color: "#00eaff", fontSize: width < 400 ? 16 : 18, fontWeight: "600", marginTop: 10 },
});
