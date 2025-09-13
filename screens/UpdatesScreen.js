// screens/UpdatesScreen.js
import React from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const UpdatesScreen = () => {
  return (
    <LinearGradient colors={["#0f2027", "#203a43", "#2c5364"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        {/* Center Card */}
        <View style={styles.centerCard}>
          <Ionicons name="notifications-off-outline" size={60} color="#00eaff" />
          <Text style={styles.title}>No Updates for Now</Text>
          <Text style={styles.message}>
            LuminaN is always working to bring you the latest news, promotions, and gas price updates.
            Check back soon for any updates!
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

export default UpdatesScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  centerCard: {
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 30,
    borderRadius: 20,
    alignItems: "center",
    shadowColor: "#00eaff",
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 16,
    textAlign: "center",
  },
  message: {
    color: "#e5e7eb",
    fontSize: 16,
    marginTop: 12,
    textAlign: "center",
  },
});
