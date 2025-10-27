import React, { useState, useRef, useEffect, useCallback } from "react";
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
    Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useAuth } from "../context/AuthContext";

const RegisterScreen = ({ navigation }) => {
    const { register, persistTempUser } = useAuth(); 

    const [formData, setFormData] = useState({
        username: "",
        email: "",
        phoneNumber: "",
        password: "",
        confirmPassword: "",
        preferred_contact: "email",
    });
    const [errors, setErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);

    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;

    // Animate form on mount
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true }),
        ]).start();
    }, [fadeAnim, slideAnim]);

    const handleChange = (name, value) => {
        setFormData({ ...formData, [name]: value });
        setErrors({ ...errors, [name]: "" });
    };

    const validate = useCallback(() => {
        let temp = {};
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        const phoneRegex = /^[0-9]{9,10}$/;

        if (!formData.username.trim()) temp.username = "Username is required";
        if (!formData.email.trim()) temp.email = "Email is required";
        else if (!emailRegex.test(formData.email.trim())) temp.email = "Invalid email address";

        if (!formData.phoneNumber.trim()) temp.phoneNumber = "Phone number is required";
        else if (!phoneRegex.test(formData.phoneNumber.trim()))
            temp.phoneNumber = "Phone number must be 9-10 digits (excluding +263 prefix)";

        if (!formData.password) temp.password = "Password is required";
        else if (formData.password.length < 6) temp.password = "Password must be at least 6 characters";

        if (!formData.confirmPassword || formData.password !== formData.confirmPassword)
            temp.confirmPassword = "Passwords do not match";

        setErrors(temp);
        return Object.keys(temp).length === 0;
    }, [formData]);

    const handleRegister = useCallback(async () => {
        if (!validate()) return;
        setLoading(true);
        Keyboard.dismiss();

        const payload = {
            username: formData.username.trim(),
            email: formData.email.trim(),
            phone_number: `+263${formData.phoneNumber.trim()}`,
            password: formData.password,
            preferred_contact: formData.preferred_contact,
        };

        try {
            console.log("REGISTER PAYLOAD SENT:", payload);
            const result = await register(payload);

            if (result && (result.tempUserId || result.temp_user_id)) {
               
                await persistTempUser(result);

                navigation.reset({
                    index: 0,
                    routes: [{ name: "VerifyOTP" }],
                });
                return;
            }

            setErrors({ general: "Registration succeeded, but verification data is missing." });

        } catch (error) {
            console.error("Registration Error:", error);
            let errorMessage = "An unexpected error occurred.";
            let fieldErrors = {};

            if (error && typeof error === 'object' && error.error) {
                errorMessage = error.error;
            } else if (error && typeof error === 'object' && Object.keys(error).length > 0) {
                fieldErrors = error;
                errorMessage = fieldErrors.non_field_errors?.[0] || fieldErrors.detail || "Validation failed. Please review your input.";
            } else if (error && error.message) {
                errorMessage = error.message;
            } else {
                errorMessage = String(error);
            }

            if (errorMessage.includes('Network') || errorMessage.includes('failed to fetch')) {
                errorMessage = "Network connection failed. Please check your internet and server status.";
            } else if (errorMessage.includes("Server returned non-JSON error")) {
                errorMessage = "Internal Server Error (500). Please check the backend console.";
            }

            if (Object.keys(fieldErrors).length > 0) {
                setErrors({ ...fieldErrors, general: errorMessage });
            } else {
                setErrors({ general: errorMessage });
            }

        } finally {
            setLoading(false);
        }
    }, [formData, validate, register, persistTempUser, navigation]);

    return (
        <>
            <LinearGradient colors={["#0f2027", "#203a43", "#2c5364"]} style={styles.container}>
                <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: "center" }}>
                    <Animated.View style={[styles.card, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
                        <Text style={styles.title}>Register for GasLT</Text>
                        <Text style={styles.subtitle}>
                            Join GasLT, Zimbabwe’s most reliable gas delivery service.
                        </Text>

                        <TextInput
                            style={styles.input}
                            placeholder="Username"
                            placeholderTextColor="#bbb"
                            value={formData.username}
                            onChangeText={(v) => handleChange("username", v)}
                        />
                        {errors.username && <Text style={styles.errorText}>{errors.username}</Text>}

                        <TextInput
                            style={styles.input}
                            placeholder="Email"
                            placeholderTextColor="#bbb"
                            keyboardType="email-address"
                            autoCapitalize="none"
                            value={formData.email}
                            onChangeText={(v) => handleChange("email", v)}
                        />
                        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

                        <View style={styles.phoneContainer}>
                            <TextInput style={styles.countryCodeInput} value="+263" editable={false} />
                            <TextInput
                                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                                placeholder="Phone Number"
                                placeholderTextColor="#bbb"
                                keyboardType="phone-pad"
                                value={formData.phoneNumber}
                                onChangeText={(v) => handleChange("phoneNumber", v)}
                            />
                        </View>
                        {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

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

                        <TextInput
                            style={styles.input}
                            placeholder="Confirm Password"
                            placeholderTextColor="#bbb"
                            secureTextEntry={!showPassword}
                            value={formData.confirmPassword}
                            onChangeText={(v) => handleChange("confirmPassword", v)}
                        />
                        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

                        {errors.general && <Text style={[styles.errorText, { marginTop: 10 }]}>{errors.general}</Text>}

                        <TouchableOpacity onPress={handleRegister} disabled={loading} activeOpacity={0.85}>
                            <LinearGradient colors={["#00c6ff", "#0072ff"]} style={styles.registerButton}>
                                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.registerText}>Register</Text>}
                            </LinearGradient>
                        </TouchableOpacity>

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>Already have an account?</Text>
                            <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                                <Text style={[styles.footerText, { color: "#00eaff", marginLeft: 5 }]}>Login</Text>
                            </TouchableOpacity>
                        </View>
                    </Animated.View>
                </ScrollView>
            </LinearGradient>

            {loading && (
                <Modal transparent animationType="fade">
                    <View style={styles.overlay}>
                        <ActivityIndicator size="large" color="#00eaff" />
                        <Text style={styles.loadingText}>Creating your account...</Text>
                    </View>
                </Modal>
            )}
        </>
    );
};

export default RegisterScreen;

const styles = StyleSheet.create({
    container: { flex: 1 },
    card: {
        marginHorizontal: 20,
        backgroundColor: "rgba(255,255,255,0.05)",
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
        flex: 1,
        backgroundColor: "rgba(255,255,255,0.1)",
        color: "#fff",
        padding: 12,
        borderRadius: 10,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: "rgba(0,234,255,0.5)",
    },
    phoneContainer: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
    countryCodeInput: {
        width: 80,
        marginRight: 10,
        backgroundColor: "rgba(255,255,255,0.1)",
        color: "#fff",
        padding: 12,
        borderRadius: 10,
        borderWidth: 1,
        borderColor: "rgba(0,234,255,0.5)",
        marginBottom: 8,
    },
    passwordContainer: { position: "relative", marginBottom: 8 },
    eyeButton: { position: "absolute", right: 12, top: 14 },
    registerButton: {
        marginTop: 12,
        padding: 14,
        borderRadius: 10,
        alignItems: "center",
        shadowColor: "#00eaff",
        shadowOpacity: 0.6,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 0 },
    },
    registerText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
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
});
