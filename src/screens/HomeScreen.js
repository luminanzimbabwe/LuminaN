// screens/HomeScreen.js

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Animated,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useAuth } from "../context/AuthContext";
import { apiGetCurrentUser } from "../services/auth.service";
import GasLtLogo from '../components/GasLtLogo';

const { width, height } = Dimensions.get("window");

// Products aligned with backend MongoDB _id values
const PRODUCTS = [
  { id: "68c606a1ac29609e11f8f941", name: "5kg Cylinder", weight: 5, description: "Ideal for small households", surcharge: 0 },
  { id: "68c606a1ac29609e11f8f942", name: "7kg Cylinder", weight: 7, description: "Perfect for medium usage", surcharge: 0 },
  { id: "68c606a1ac29609e11f8f943", name: "9kg Cylinder", weight: 9, description: "Great for larger families", surcharge: 0 },
  { id: "68c606a1ac29609e11f8f944", name: "14kg Cylinder", weight: 14, description: "Best for heavy usage", surcharge: 0 },
  { id: "68c606a1ac29609e11f8f945", name: "45kg Cylinder", weight: 45, description: "Commercial use", surcharge: 0 },
];

// Build UI packages from PRODUCTS so each package carries the real product id
const packages = PRODUCTS.map((p, idx) => ({
  id: p.id, // Mongo ObjectId string
  weight: `${p.weight}kg`,
  description: `${p.weight}kg cylinder`,
  icon: "flame",
  popular: idx === 2,
  // display price computed from price_per_kg * weight for UI only
 // price: (Number(p.price_per_kg || 0) * Number(p.weight || 1)).toFixed(2),
}));

const HomeScreen = ({ navigation }) => {
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [customNotes, setCustomNotes] = useState("");
  const [customCylinders, setCustomCylinders] = useState("");
  const [customWeight, setCustomWeight] = useState("");
  const [unreadCount, setUnreadCount] = useState(0);
  const [showCustomForm, setShowCustomForm] = useState(false);

  const { user, token, isLoading, isAuthenticated } = useAuth();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const customFormAnim = useRef(new Animated.Value(0)).current;
  const packageAnimations = useRef(packages.map(() => new Animated.Value(0))).current;
  const confirmButtonScale = useRef(new Animated.Value(1)).current;





  


 
  useEffect(() => {
    
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { 
        toValue: 0, 
        tension: 50, 
        friction: 8, 
        useNativeDriver: true 
      }),
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        ])
      ),
    ]).start();

    // Staggered package card animations
    const packageStagger = packageAnimations.map((anim, index) =>
      Animated.timing(anim, {
        toValue: 1,
        duration: 600,
        delay: index * 150,
        useNativeDriver: true,
      })
    );
    
    Animated.stagger(100, packageStagger).start();
    
  }, []);

  // Refresh profile/unread count when token is present
  useEffect(() => {
    let mounted = true;
    const refresh = async () => {
      try {
        if (!token) return;
        const profile = await apiGetCurrentUser(token);
        if (!mounted) return;
       
        const unread = profile?.unread_notifications ?? profile?.unreadCount ?? 0;
        setUnreadCount(unread);
      } catch (err) {
        console.warn('[HomeScreen] failed to refresh profile:', err?.message || err);
        // If token turned out to be invalid, navigate to Welcome to force re-auth
        if (err && err.status === 401) {
          navigation.replace('Welcome');
        }
      }
    };

    refresh();

    return () => { mounted = false; };
  }, [token]);





  
  




  const animateConfirmButton = () => {
    Animated.sequence([
      Animated.timing(confirmButtonScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
      Animated.timing(confirmButtonScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();
  };

  const handleConfirm = () => {
  animateConfirmButton();

  setTimeout(() => {
    if (showCustomForm) {
      // Convert to number safely
      const weightValue = parseFloat(customWeight);

      console.log("DEBUG customWeight final:", customWeight, "type:", typeof customWeight, "parsed:", weightValue);

      // Validate weight
      if (isNaN(weightValue) || weightValue <= 0) {
        alert("Please enter a valid weight for custom order.");
        return;
      }

      // Navigate with custom order details
      navigation.navigate("ConfirmOrder", {
        package: "Custom Order",
        customCylinders,
        customWeight: weightValue, // numeric value
        customNotes,
      });
    } else if (selectedPackage) {
      // Navigate with selected package
      navigation.navigate("ConfirmOrder", {
        package: selectedPackage,
        customNotes: "",
      });
    } else {
      alert("Please select a package or enter a custom order.");
    }
  }, 200);
};


  const handlePackageSelect = (pkg) => {
    setSelectedPackage(pkg);
    setCustomNotes("");
    setCustomCylinders("");
    setCustomWeight("");
    setShowCustomForm(false);
    
    // Animate custom form collapse
    Animated.timing(customFormAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  };

  const handleCustomPackageToggle = () => {
    const newShowState = !showCustomForm;
    setShowCustomForm(newShowState);
    setSelectedPackage(null);
    
    Animated.timing(customFormAnim, {
      toValue: newShowState ? 1 : 0,
      duration: 400,
      useNativeDriver: false,
    }).start();
  };

  const handleCustomNotesChange = (text) => {
    setCustomNotes(text);
    if (!showCustomForm) {
      setShowCustomForm(true);
      Animated.timing(customFormAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: false,
      }).start();
    }
  };

  const handleChatbotToggle = () => {
    navigation.navigate('ChatbotScreen');
  };





  const PackageCard = ({ pkg, index }) => {
    const cardScale = useRef(new Animated.Value(1)).current;
    const isSelected = selectedPackage?.id === pkg.id;

    const handlePress = () => {
      Animated.sequence([
        Animated.timing(cardScale, { toValue: 0.95, duration: 100, useNativeDriver: true }),
        Animated.timing(cardScale, { toValue: 1, duration: 100, useNativeDriver: true }),
      ]).start();
      
      setTimeout(() => handlePackageSelect(pkg), 150);
    };

    return (
      <Animated.View
        style={[
          {
            opacity: packageAnimations[index],
            transform: [
              { scale: cardScale },
              {
                translateY: packageAnimations[index].interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                }),
              },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.packageCard,
            pkg.popular && styles.popularPackageCard,
            isSelected && styles.packageSelected,
          ]}
          onPress={handlePress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={
              isSelected
                ? ["rgba(0,234,255,0.3)", "rgba(0,234,255,0.1)"]
                : pkg.popular
                ? ["rgba(250,204,21,0.2)", "rgba(250,204,21,0.05)"]
                : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.02)"]
            }
            style={styles.cardGradient}
          >
            {pkg.popular && (
              <View style={styles.popularRibbon}>
                <Text style={styles.popularRibbonText}>POPULAR</Text>
              </View>
            )}
            
            <View style={styles.iconContainer}>
              <View style={styles.iconBackground}>
                <Ionicons name={pkg.icon} size={pkg.popular ? 50 : 45} color="#00eaff" />
              </View>
            </View>
            
            <Text style={[styles.packageWeight, pkg.popular && styles.popularWeight]}>
              {pkg.weight}
            </Text>
            <Text style={styles.packagePrice}>{pkg.price}</Text>
            <Text style={styles.packageDescription}>{pkg.description}</Text>
            
            <View style={styles.cardFooter}>
              <View style={styles.verifiedContainer}>
                <MaterialIcons name="verified" size={16} color="#22c55e" />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
              {isSelected && (
                <View style={styles.selectedIndicator}>
                  <Ionicons name="checkmark-circle" size={20} color="#00eaff" />
                </View>
              )}
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <LinearGradient colors={["#0a0e27", "#16213e", "#1a2332"]} style={styles.container}>
        <ScrollView
          contentContainerStyle={{ paddingBottom: 100 }}
          showsVerticalScrollIndicator={false}
        >
        {/* Animated Header */}
        <Animated.View 
          style={[
            styles.topBar,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <GasLtLogo />
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity
              style={styles.notification}
              onPress={() => navigation.navigate("Notification")}
            >
              <LinearGradient
                colors={["rgba(0,234,255,0.2)", "rgba(0,234,255,0.05)"]}
                style={styles.notificationGradient}
              >
                <Ionicons name="notifications-outline" size={28} color="#00eaff" />
              </LinearGradient>
              {unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>
        </Animated.View>

        {/* Welcome Section */}
        <Animated.View
          style={[
            styles.welcomeSection,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(0,234,255,0.1)", "rgba(110,198,255,0.05)"]}
            style={styles.welcomeGradient}
          >
            <Text style={styles.welcomeText}>Welcome back!</Text>
            <Text style={styles.quoteText}>
              "For it's like magic, but powered by code, logic, networks, and a bit of mystery."
            </Text>
            <Text style={styles.authorText}>— thisismeprivateisaacngirazi</Text>

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Ionicons name="flash" size={20} color="#facc15" />
                <Text style={styles.statText}>Fast Delivery</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="shield-checkmark" size={20} color="#22c55e" />
                <Text style={styles.statText}>Secure</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="star" size={20} color="#ff6b6b" />
                <Text style={styles.statText}>Premium</Text>
              </View>
            </View>
          </LinearGradient>

          {/* Emergency Gas Delivery Button 
          <View style={styles.emergencyButtonContainer}>
            <TouchableOpacity
              style={styles.emergencyButton}
              onPress={() => {
                Linking.openURL('tel:0785748130/29');
              }}
            >
              <LinearGradient
                colors={["#FF3B3B", "#FF6B6B"]}
                style={styles.emergencyGradient}
              >
                <Ionicons name="warning" size={16} color="#fff" />
                <Text style={styles.emergencyText}>🚨 Emergency Gas</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View> */}
        </Animated.View> 

        {/* Trusted by Users Section */}
        <View style={styles.trustedSection}>
          <TouchableOpacity style={styles.trustedButton}>
            <LinearGradient
              colors={["rgba(34,197,94,0.2)", "rgba(34,197,94,0.05)"]}
              style={styles.trustedGradient}
            >
              <Ionicons name="shield-checkmark" size={24} color="#22c55e" />
              <Text style={styles.trustedText}>Trusted by Thousands of Users</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Packages Section */}
        <View style={styles.packagesSection}>
          <Text style={styles.sectionTitle}>Available Packages</Text>
          <Text style={styles.sectionSubtitle}>Choose the perfect gas package for your needs</Text>
          
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.packagesContainer}
          >
            {packages.map((pkg, index) => (
              <PackageCard key={pkg.id} pkg={pkg} index={index} />
            ))}
          </ScrollView>
        </View>

        {/* Custom Package Toggle */}
        <View style={styles.customToggleSection}>
          <TouchableOpacity 
            style={styles.customToggleButton}
            onPress={handleCustomPackageToggle}
          >
            <LinearGradient
              colors={showCustomForm ? ["#ff6b6b", "#ff8e8e"] : ["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
              style={styles.toggleGradient}
            >
              <Ionicons 
                name={showCustomForm ? "remove-circle-outline" : "add-circle-outline"} 
                size={24} 
                color={showCustomForm ? "#fff" : "#00eaff"} 
              />
              <Text style={[styles.toggleText, showCustomForm && styles.toggleTextActive]}>
                {showCustomForm ? "Hide Custom Package" : "Create Custom Package"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Animated Custom Package Section */}
        <Animated.View
          style={[
            styles.customPackageSection,
            {
              maxHeight: customFormAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 400],
              }),
              opacity: customFormAnim,
            },
          ]}
        >
          <LinearGradient
            colors={["rgba(255,107,107,0.1)", "rgba(255,107,107,0.02)"]}
            style={styles.customFormGradient}
          >
            <Text style={styles.customTitle}>Custom Package Builder</Text>
            <Text style={styles.customInfoText}>
              Design your perfect gas package with custom specifications
            </Text>
            
            <View style={styles.customOptionsRow}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Cylinders</Text>
                <TextInput
                  style={styles.customInputSmall}
                  placeholder="0"
                  placeholderTextColor="#888"
                  keyboardType="numeric"
                  value={customCylinders}
                  onChangeText={(text) => {
                    setCustomCylinders(text);
                    setSelectedPackage(null);
                  }}
                />
              </View>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Weight (kg)</Text>
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <TextInput
                    style={[styles.customInputSmall, { flex: 1 }]}
                    placeholder="0"
                    placeholderTextColor="#888"
                    keyboardType="numeric"
                    value={customWeight}
                    onChangeText={(text) => {
                      // Allow only numbers and a single decimal point
                      const cleaned = text.replace(/[^0-9.]/g, "");
                      setCustomWeight(cleaned);
                      setSelectedPackage(null);
                      console.log("DEBUG customWeight raw:", text, "| cleaned:", cleaned);
                    }}
                  />
                  <Text style={{ color: "#fff", marginLeft: 8, fontWeight: "600" }}>kg</Text>
                </View>
              </View>
            </View>

            <View style={styles.notesContainer}>
              <Text style={styles.inputLabel}>Additional Notes</Text>
              <TextInput
                style={styles.customInput}
                placeholder="Special requirements, delivery instructions..."
                placeholderTextColor="#888"
                value={customNotes}
                onChangeText={handleCustomNotesChange}
                multiline
                numberOfLines={3}
              />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Safety Section */}
        <View style={styles.safetySection}>
          <LinearGradient
            colors={["rgba(34,197,94,0.15)", "rgba(34,197,94,0.05)"]}
            style={styles.safetyGradient}
          >
            <View style={styles.safetyHeader}>
              <Ionicons name="shield-checkmark" size={24} color="#22c55e" />
              <Text style={styles.safetyTitle}>Safety First</Text>
            </View>
            <Text style={styles.safetyText}>
              Always store cylinders upright in a cool, well-ventilated area away from direct sunlight and heat sources.
            </Text>
          </LinearGradient>
        </View>

        {/* Animated Confirm Button */}
        <Animated.View style={{ transform: [{ scale: confirmButtonScale }] }}>
          <TouchableOpacity style={styles.confirmButton} onPress={handleConfirm}>
            <LinearGradient
              colors={["#00eaff", "#0ea5e9"]}
              style={styles.confirmGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#fff" />
              <Text style={styles.confirmText}>Confirm Order</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>

      {/* Floating Chatbot Button */}
      <TouchableOpacity
        style={styles.chatbotButton}
        onPress={handleChatbotToggle}
      >
        <LinearGradient
          colors={["#000000", "#000000"]}
          style={styles.chatbotGradient}
        >
          <Ionicons name="chatbubbles" size={30} color="#00eaff" />
        </LinearGradient>
      </TouchableOpacity>
    </LinearGradient>
  </SafeAreaView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  notification: { position: "relative" },
  notificationGradient: {
    padding: 12,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  badge: { 
    position: "absolute", 
    top: -2, 
    right: -2, 
    backgroundColor: "#FF3B3B", 
    borderRadius: 10, 
    paddingHorizontal: 6,
    paddingVertical: 2,
    minWidth: 20,
    alignItems: "center",
  },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "bold" },
  
  welcomeSection: { marginHorizontal: 20, marginBottom: 30, position: 'relative' },
  welcomeGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(0,234,255,0.2)",
  },
  welcomeText: {
    color: "#facc15",
    fontSize: 18,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8
  },
  quoteText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 4,
    lineHeight: 18,
  },
  authorText: {
    color: "#888",
    fontSize: 12,
    textAlign: "center",
    fontStyle: "italic",
    marginBottom: 15,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  statItem: {
    alignItems: "center",
    gap: 5,
  },
  statText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },

  // Emergency Button Styles
  emergencyButton: {
    position: "absolute",
    top: '50%',
    left: '50%',
    transform: [{ translateX: '-50%' }, { translateY: '-50%' }],
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#FF3B3B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
   
  },
  emergencyGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 10,
    gap: 5,
  },
  emergencyText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  // Trusted by Users Section
  trustedSection: { marginHorizontal: 20, marginBottom: 20 },
  trustedButton: {
    borderRadius: 15,
    overflow: "hidden",
  
  },
  trustedGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    gap: 10,
  },
  trustedText: {
    color: "#22c55e",
    fontSize: 16,
    fontWeight: "600",
  },

  packagesSection: { marginBottom: 20 },
  sectionTitle: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
    marginHorizontal: 20,
    marginBottom: 5,
  },
  sectionSubtitle: {
    color: "#888",
    fontSize: 14,
    marginHorizontal: 20,
    marginBottom: 15,
  },
  packagesContainer: {
    paddingHorizontal: 20,
    gap: 15,
  },
  
  packageCard: {
    width: width * 0.75,
    height: 320,
    marginRight: 15,
    borderRadius: 15,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  popularPackageCard: {
    width: width * 0.8,
    height: 340,
    elevation: 12,
    shadowOpacity: 0.4,
  },
  packageSelected: {
    borderWidth: 2,
    borderColor: "#00eaff",
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: "space-between",
  },
  popularRibbon: {
    position: "absolute",
    top: 15,
    right: -30,
    backgroundColor: "#facc15",
    paddingHorizontal: 40,
    paddingVertical: 5,
    transform: [{ rotate: "45deg" }],
  },
  popularRibbonText: {
    color: "#000",
    fontSize: 10,
    fontWeight: "bold",
  },
  
  iconContainer: { alignItems: "center", marginBottom: 15 },
  iconBackground: {
    backgroundColor: "rgba(0,234,255,0.1)",
    padding: 15,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(0,234,255,0.3)",
  },
  packageWeight: { 
    color: "#fff", 
    fontSize: 28, 
    fontWeight: "bold", 
    textAlign: "center",
    marginBottom: 5,
  },
  popularWeight: { fontSize: 32 },
  packagePrice: {
    color: "#00eaff",
    fontSize: 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
  },
  packageDescription: { 
    color: "#e5e7eb", 
    fontSize: 16, 
    textAlign: "center", 
    marginBottom: 20,
    lineHeight: 22,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  verifiedContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  verifiedText: { 
    color: "#22c55e", 
    fontSize: 14, 
    fontWeight: "600" 
  },
  selectedIndicator: {
    backgroundColor: "rgba(0,234,255,0.2)",
    padding: 5,
    borderRadius: 15,
  },
  
  customToggleSection: { marginHorizontal: 20, marginBottom: 20 },
  customToggleButton: {
    borderRadius: 15,
    overflow: "hidden",
  },
  toggleGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 15,
    gap: 10,
  },
  toggleText: {
    color: "#00eaff",
    fontSize: 16,
    fontWeight: "600",
  },
  toggleTextActive: { color: "#fff" },
  
  customPackageSection: { 
    marginHorizontal: 20, 
    overflow: "hidden",
    marginBottom: 20,
  },
  customFormGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,107,107,0.2)",
  },
  customTitle: {
    color: "#ff6b6b",
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
  },
  customInfoText: { 
    color: "#e5e7eb", 
    fontSize: 16, 
    marginBottom: 20,
    lineHeight: 22,
  },
  customOptionsRow: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    marginBottom: 20,
    gap: 15,
  },
  inputContainer: { flex: 1 },
  inputLabel: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 8,
  },
  customInputSmall: { 
    backgroundColor: "rgba(255,255,255,0.05)", 
    color: "#fff", 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "rgba(255,107,107,0.3)",
    fontSize: 16,
  },
  notesContainer: { marginBottom: 10 },
  customInput: { 
    backgroundColor: "rgba(255,255,255,0.05)", 
    color: "#fff", 
    padding: 15, 
    borderRadius: 12, 
    borderWidth: 1, 
    borderColor: "rgba(255,107,107,0.3)", 
    minHeight: 80,
    textAlignVertical: "top",
    fontSize: 16,
  },
  
  safetySection: { 
    marginHorizontal: 20, 
    marginBottom: 30,
  },
  safetyGradient: {
    padding: 20,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
  },
  safetyHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  safetyTitle: { 
    color: "#22c55e", 
    fontSize: 18, 
    fontWeight: "bold",
  },
  safetyText: { 
    color: "#fff", 
    fontSize: 16,
    lineHeight: 22,
  },
  
  confirmButton: {
    marginHorizontal: 20,
    marginBottom: 40,
    borderRadius: 20,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#00eaff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    gap: 10,
  },
  confirmText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },

  // Chatbot Styles
  chatbotButton: {
    position: "absolute",
    bottom: 80,
    right: 20,
    borderRadius: 50,
    overflow: "hidden",
    elevation: 8,
    shadowColor: "#00eaff",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  chatbotGradient: {
    padding: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  chatbotModal: {
    height: "70%",
    backgroundColor: "#0a0e27",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  chatbotHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  chatbotHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  chatbotTitle: {
    color: "#00eaff",
    fontSize: 18,
    fontWeight: "bold",
  },
  messagesList: {
    flex: 1,
    padding: 10,
  },
  messagesContainer: {
    paddingBottom: 10,
  },
  messageContainer: {
    marginBottom: 10,
    maxWidth: "80%",
  },
  userMessage: {
    alignSelf: "flex-end",
  },
  botMessage: {
    alignSelf: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 15,
    maxWidth: "100%",
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 22,
  },
  userMessageText: {
    color: "#0a0e27",
  },
  inputArea: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.1)",
    gap: 10,
  },
  chatInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    color: "#fff",
    padding: 12,
    borderRadius: 20,
    fontSize: 16,
  },
  sendButton: {
    padding: 10,
  },
});
