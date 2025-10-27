import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  Keyboard,
  TouchableWithoutFeedback,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";
import { Ionicons } from "@expo/vector-icons";

const OTP_LENGTH = 6;
const RESEND_TIMER = 60; // seconds

const VerifyOTPScreen = ({ navigation, route }) => {
  const { tempUserId: routeTempUserId, contact: routeContact, via: routeVia } = route?.params || {};
  const { verifyOtp, tempUser } = useAuth();

  // Safe fallback to tempUser from context
  const tempUserId = routeTempUserId || tempUser?.tempUserId || tempUser?.temp_user_id || "";
  const contact = routeContact || tempUser?.contact_sent_to || "";
  const via = routeVia || tempUser?.verification_type || "email";

  const [otpArray, setOtpArray] = useState(new Array(OTP_LENGTH).fill(""));
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_TIMER);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // --- Animation Setup ---
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start(() => {
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    });
  }, []);

  // --- Resend Countdown Logic ---
  useEffect(() => {
    let timer;
    if (countdown > 0 && !canResend) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (countdown === 0 && !canResend) {
      setCanResend(true);
    }
    return () => clearTimeout(timer);
  }, [countdown, canResend]);

  // --- Safely format contact display ---
  const formattedContact =
    via === "email"
      ? contact
      : contact
      ? `+263 ${contact.trim().slice(0, 3)} *** ****`
      : "+263 *** ****";

  const handleOtpChange = (text, index) => {
    setError("");
    const digit = text.replace(/[^0-9]/g, "").charAt(0);
    const newOtpArray = [...otpArray];
    newOtpArray[index] = digit;
    setOtpArray(newOtpArray);

    if (digit !== "" && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    if (index === OTP_LENGTH - 1 && digit !== "") {
      Keyboard.dismiss();
    }
  };

  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === "Backspace" && otpArray[index] === "" && index > 0) {
      const newOtpArray = [...otpArray];
      newOtpArray[index - 1] = "";
      setOtpArray(newOtpArray);
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = useCallback(async () => {
    setError("");
    const finalOtp = otpArray.join("");
    if (finalOtp.length !== OTP_LENGTH) {
      setError(`Please enter the complete ${OTP_LENGTH}-digit code.`);
      return;
    }

    if (!tempUserId) {
      setError("No valid session found. Please register again.");
      return;
    }

    setLoading(true);
    Keyboard.dismiss();

    try {
      const result = await verifyOtp(tempUserId, finalOtp);

      // Navigate after successful verification
      navigation.replace("GettingReady");
    } catch (err) {
      console.error("[VerifyOTPScreen] OTP verification failed:", err);
      setOtpArray(new Array(OTP_LENGTH).fill(""));
      inputRefs.current[0]?.focus();

      const message = err?.message || "Verification failed. Check the code.";
      if (message.toLowerCase().includes("expired") || message.toLowerCase().includes("re-register")) {
        Alert.alert(
          "Session Expired",
          "Your session is invalid. Please register again.",
          [{ text: "OK", onPress: () => navigation.replace("Register") }]
        );
      } else {
        setError(message.includes("Invalid") ? "Invalid code. Try again." : message);
      }
    } finally {
      setLoading(false);
    }
  }, [otpArray, verifyOtp, tempUserId, navigation]);

  const handleResend = async () => {
    if (!canResend) return;
    setCanResend(false);
    setCountdown(RESEND_TIMER);
    setError("");

    try {
      console.log("[VerifyOTPScreen] Resend OTP initiated for tempUserId:", tempUserId);
      Alert.alert("Success", "New code sent! Check your inbox.");
    } catch (err) {
      console.error("[VerifyOTPScreen] Resend OTP failed:", err);
      setError(err?.message || "Failed to resend code. Try later.");
    }
    inputRefs.current[0]?.focus();
  };

  const renderOtpInputs = () =>
    otpArray.map((digit, index) => (
      <TextInput
        key={index}
        ref={(ref) => (inputRefs.current[index] = ref)}
        style={styles.otpInputBox}
        keyboardType="number-pad"
        maxLength={1}
        value={digit}
        onChangeText={(text) => handleOtpChange(text, index)}
        onKeyPress={(e) => handleKeyPress(e, index)}
        selectTextOnFocus
        contextMenuHidden
      />
    ));

  return (
    <LinearGradient colors={["#0f2027", "#203a43", "#2c5364"]} style={styles.container}>
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <Animated.View style={[styles.card, { opacity: fadeAnim }]}>
          <Ionicons name="shield-checkmark" size={48} color="#00eaff" style={styles.icon} />
          <Text style={styles.title}>Secure Verification</Text>
          <Text style={styles.subtitle}>
            Enter the {OTP_LENGTH}-digit code sent to your <Text style={styles.highlight}>{via}</Text> at:
          </Text>
          <Text style={styles.contactDisplay}>{formattedContact}</Text>

          <View style={styles.otpContainer}>{renderOtpInputs()}</View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading || otpArray.join("").length !== OTP_LENGTH}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading || otpArray.join("").length !== OTP_LENGTH ? ["#4A6B79", "#3A5A69"] : ["#00c6ff", "#0072ff"]}
              style={styles.verifyButton}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.verifyText}>Verify Account</Text>}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.resendContainer}>
            <Text style={styles.footerText}>Didn't receive the code?</Text>
            {canResend ? (
              <TouchableOpacity onPress={handleResend} style={{ marginLeft: 5 }}>
                <Text style={[styles.footerText, styles.linkText]}>Resend Code</Text>
              </TouchableOpacity>
            ) : (
              <Text style={styles.footerText}>
                Resend in <Text style={styles.timerText}>{countdown}s</Text>
              </Text>
            )}
          </View>
        </Animated.View>
      </TouchableWithoutFeedback>
    </LinearGradient>
  );
};

export default VerifyOTPScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  card: {
    width: "90%",
    maxWidth: 400,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 30,
    shadowColor: "#00eaff",
    shadowOpacity: 0.3,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 10,
    elevation: 10,
  },
  icon: { alignSelf: "center", marginBottom: 10 },
  title: { fontSize: 26, fontWeight: "bold", color: "#fff", textAlign: "center", marginBottom: 8 },
  subtitle: { fontSize: 14, color: "#aaa", textAlign: "center" },
  contactDisplay: { fontSize: 16, color: "#fff", fontWeight: "600", textAlign: "center", marginBottom: 28 },
  highlight: { color: "#00eaff", fontWeight: "bold" },
  otpContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20, width: "100%" },
  otpInputBox: { width: 45, height: 55, backgroundColor: "rgba(255,255,255,0.15)", color: "#fff", padding: 10, borderRadius: 10, borderWidth: 2, borderColor: "rgba(0,234,255,0.5)", fontSize: 20, fontWeight: "bold", textAlign: "center" },
  verifyButton: { marginTop: 20, padding: 14, borderRadius: 10, alignItems: "center" },
  verifyText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  errorText: { color: "#ff4d4d", fontWeight: "bold", textAlign: "center", marginBottom: 12 },
  resendContainer: { flexDirection: "row", justifyContent: "center", marginTop: 20, alignItems: "center" },
  footerText: { color: "#ccc", fontSize: 14 },
  timerText: { color: "#aaa", fontWeight: "bold" },
  linkText: { color: "#00eaff", fontWeight: "bold" },
});
