// screens/ConfirmOrder.js
import React, { useState, useRef, useEffect } from "react";
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
  Alert,
  Linking,
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import Modal from "react-native-modal";
import { useAuth } from "../context/AuthContext";
import axiosInstance, { setApiToken } from "../services/auth.service";

const { width } = Dimensions.get("window");

const ConfirmOrder = ({ navigation, route }) => {
  const { package: selectedPackage, customCylinders, customWeight, customNotes } = route.params;
  const { token } = useAuth();

  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [notes, setNotes] = useState(customNotes || "");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isSuccessModalVisible, setSuccessModalVisible] = useState(false);
  const [ussdModalVisible, setUssdModalVisible] = useState(false);
  const [merchantInfo, setMerchantInfo] = useState({ merchant_number: "", total_price: 0 });

  // Load saved delivery address and phone from AsyncStorage
  useEffect(() => {
    const loadSavedData = async () => {
      try {
        const savedAddress = await AsyncStorage.getItem('deliveryAddress');
        const savedPhone = await AsyncStorage.getItem('phoneNumber');
        if (savedAddress) setDeliveryAddress(savedAddress);
        if (savedPhone) setPhone(savedPhone);
      } catch (error) {
        console.error('Error loading saved data:', error);
      }
    };
    loadSavedData();
  }, []);

  const confirmButtonScale = useRef(new Animated.Value(1)).current;

  const packageWeight = parseFloat(
    (selectedPackage?.weight || customWeight || "1").toString().replace("kg", "")
  );
  const quantity = selectedPackage?.id ? 1 : Math.max(parseInt(customCylinders || "1"), 1);
  const totalWeight = packageWeight * quantity;

  const animateConfirmButton = () => {
    Animated.sequence([
      Animated.timing(confirmButtonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(confirmButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const triggerUSSDPayment = (merchantNumber, amount) => {
    const roundedAmount = Math.round(amount); // USSD requires integer amounts
    const ussdCode = `*151*1*1*${merchantNumber}*${roundedAmount}#`;
    const encoded = encodeURIComponent(ussdCode);

    if (Platform.OS === "android") {
      Linking.openURL(`tel:${encoded}`);
    } else {
      Alert.alert(
        "USSD Not Supported",
        `Use your wallet to pay ${roundedAmount} to merchant number: ${merchantNumber}`
      );
    }
  };

  const handleSubmitOrder = async () => {
    if (!deliveryAddress.trim()) return setErrorMessage("Please enter a delivery address.");
    if (!phone.trim()) return setErrorMessage("Please enter a phone number.");
    if (!token) return setErrorMessage("You must be logged in to place an order.");

    setLoading(true);
    setErrorMessage("");

    const payload = {
      quantity,
      weight: packageWeight.toString(),
      delivery_address: deliveryAddress.trim(),
      payment_method: paymentMethod,
      notes: notes.trim(),
      delivery_type: "home_delivery",
      scheduled_time: null,
      phone: phone.trim(),
    };

    if (selectedPackage && selectedPackage.id) {
      payload.product_id = String(selectedPackage.id);
    } else {
      payload.product_id = "68c606a1ac29609e11f8f941";
      payload.is_custom = true;
      payload.custom_weight = packageWeight.toString();
      payload.custom_cylinders = Number(customCylinders) || quantity;
    }

    try {
      setApiToken(token);
      axiosInstance.defaults.headers.post["Content-Type"] = "application/json";

      const response = await axiosInstance.post(`/orders/start/`, payload);
      const data = response.data || {};
      const orderId = data.order_id || data.order?.id;

      // Save delivery address and phone to AsyncStorage
      await AsyncStorage.setItem('deliveryAddress', deliveryAddress.trim());
      await AsyncStorage.setItem('phoneNumber', phone.trim());

      // Save order locally to AsyncStorage
      const localOrder = {
        order_id: orderId,
        created_at: new Date().toISOString(),
        total_price: data.total_price || 0,
        order_status: 'pending',
        notes: notes.trim(),
        delivery_address: deliveryAddress.trim(),
        phone: phone.trim(),
        payment_method: paymentMethod,
        items: selectedPackage ? [{ name: selectedPackage.weight, qty: quantity }] : [{ name: `${customWeight}kg`, qty: quantity }],
        weight: totalWeight,
      };

      try {
        const existingOrders = await AsyncStorage.getItem('localOrders');
        const ordersArray = existingOrders ? JSON.parse(existingOrders) : [];
        ordersArray.unshift(localOrder); // Add new order at the beginning
        await AsyncStorage.setItem('localOrders', JSON.stringify(ordersArray));
      } catch (error) {
        console.error('Error saving order locally:', error);
      }

      const lowerPayment = paymentMethod.toLowerCase();

      // ---------- Handle Payment ----------
      if (lowerPayment === "cash") {
        setSuccessModalVisible(true);
        setTimeout(() => {
          setSuccessModalVisible(false);
          navigation.navigate("ProgressScreen", { orderId, weight: totalWeight });
        }, 1200);
      } else if (lowerPayment === "paynow") {
        if (data.paynow?.redirect_url) {
          Linking.openURL(data.paynow.redirect_url);
        } else {
          Alert.alert("Payment Error", "Failed to initiate Paynow payment. Try again.");
        }
      } else if (lowerPayment === "ecocash" || lowerPayment === "onemoney") {
        // Navigate to pending screen instead of showing USSD modal
        navigation.navigate("PaymentPendingScreen", {
          orderId,
          paymentMethod: lowerPayment,
          merchantNumber: data.merchant_number || "263772886728", 
          totalPrice: data.total_price || payload.total_price || 0
        });
      }
    } catch (err) {
      const errData = err?.response?.data || {};
      const serverMsg = errData?.error || errData?.detail || errData?.message || "Failed to start order.";
      setErrorMessage(serverMsg);
    } finally {
      setLoading(false);
    }
  };

  const PaymentOption = ({ method }) => {
    const getIconName = (method) => {
      switch (method) {
        case "paynow": return "card-outline";
        case "ecocash": return "phone-portrait-outline";
        case "cash":
        case "onemoney": return "cash-outline";
        default: return "card-outline";
      }
    };
    const getLabel = (method) => {
      switch (method) {
        case "paynow": return "Paynow";
        case "ecocash": return "Ecocash";
        case "cash": return "Cash on Delivery";
        case "onemoney": return "OneMoney";
        default: return method.toUpperCase();
      }
    };
    return (
      <TouchableOpacity
        style={[styles.paymentOption, paymentMethod === method && styles.paymentOptionSelected]}
        onPress={() => setPaymentMethod(method)}
      >
        <Ionicons name={getIconName(method)} size={20} color={paymentMethod === method ? "#00eaff" : "#aaa"} />
        <Text style={[styles.paymentText, paymentMethod === method && styles.paymentTextSelected]}>
          {getLabel(method)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <LinearGradient colors={["#0a0e27", "#16213e", "#1a2332"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Ionicons name="cart" size={26} color="#00eaff" />
          <Text style={styles.headerText}>Confirm Your Order</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Order Summary</Text>
          {selectedPackage ? (
            <Text style={styles.summaryItem}>Package: {selectedPackage.weight}</Text>
          ) : (
            <Text style={styles.summaryItem}>
              Custom Cylinders: {customCylinders}, Weight: {customWeight}kg
            </Text>
          )}
          <Text style={styles.summaryItem}>Quantity: {quantity}</Text>
          <Text style={styles.summaryItem}>Total Weight: {totalWeight}kg</Text>
          {notes ? <Text style={styles.summaryItem}>Notes: {notes}</Text> : null}
        </View>

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

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Payment Method</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <View style={styles.paymentOptions}>
              {["cash", "paynow", "ecocash", "onemoney"].map((method) => (
                <PaymentOption key={method} method={method} />
              ))}
            </View>
          </ScrollView>
        </View>

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

        {errorMessage ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}

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

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00eaff" />
        </View>
      )}

      <Modal isVisible={isSuccessModalVisible} style={styles.modal}>
        <View style={styles.modalContent}>
          <Ionicons name="checkmark-circle" size={60} color="#00eaff" />
          <Text style={styles.successText}>Order Created Successfully!</Text>
        </View>
      </Modal>

      <Modal isVisible={ussdModalVisible} style={styles.modal}>
        <View style={styles.modalContent}>
          <Ionicons name="phone-portrait-outline" size={60} color="#00eaff" />
          <Text style={styles.successText}>
            Complete payment of {Math.round(merchantInfo.total_price)} via wallet using merchant number:
          </Text>
          <Text style={[styles.successText, { marginTop: 6 }]}>{merchantInfo.merchant_number}</Text>
          {Platform.OS === "android" && (
            <TouchableOpacity
              style={[styles.confirmButton, { marginTop: 20 }]}
              onPress={() => {
                triggerUSSDPayment(merchantInfo.merchant_number, merchantInfo.total_price);
                setUssdModalVisible(false);
                navigation.navigate("ProgressScreen", { orderId: merchantInfo.orderId, weight: totalWeight });
              }}
            >
              <LinearGradient colors={["#00eaff", "#0ea5e9"]} style={styles.confirmGradient}>
                <Text style={styles.confirmText}>Dial Now</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
        </View>
      </Modal>
    </LinearGradient>
  );
};

export default ConfirmOrder;

// ---------- Styles (unchanged) ----------
const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 16, paddingTop: Platform.OS === "web" ? 24 : 16 },
  scrollContent: { flexGrow: 1, paddingBottom: 80 },
  header: { flexDirection: "row", alignItems: "center", marginTop: Platform.OS === "ios" ? 50 : 30, marginBottom: 16 },
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
