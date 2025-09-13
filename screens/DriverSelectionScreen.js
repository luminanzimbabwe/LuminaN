// screens/DriverSelect.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  TextInput,
  Modal,
} from "react-native";
import { useAuth } from "../AuthContext";

const { width } = Dimensions.get("window");
const BACKEND_URL = "http://localhost:8000/drivers/list/";

const DriverSelect = ({ navigation, route }) => {
  const { orderId, weight } = route.params; // total weight from ConfirmOrder
  const { authToken } = useAuth();

  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const res = await fetch(BACKEND_URL, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        const driversList = data.drivers || [];
        setDrivers(driversList);
        setFilteredDrivers(driversList);
      } catch (err) {
        console.error("Failed to fetch drivers:", err);
        alert("Failed to fetch drivers.");
      } finally {
        setLoading(false);
      }
    };
    fetchDrivers();
  }, [authToken]);

  // Filter drivers by search query (location)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredDrivers(drivers);
    } else {
      const filtered = drivers.filter((d) =>
        d.location?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredDrivers(filtered);
    }
  }, [searchQuery, drivers]);

  // Assign driver to order
  const handleSelectDriver = async (driver) => {
    setAssigning(true);
    try {
      const res = await fetch(`http://localhost:8000/orders/assign/${orderId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ driver_id: driver.driver_id }),
      });

      const data = await res.json();

      if (res.ok) {
        setSelectedDriver(driver);
        setSuccessModal(true);
        setTimeout(() => {
          setSuccessModal(false);
          navigation.navigate("OrderSuccess", { orderId, driver });
        }, 1500);
      } else {
        alert(data.error || "Failed to assign order.");
      }
    } catch (err) {
      console.error("Driver assignment failed:", err);
      alert("Something went wrong.");
    } finally {
      setAssigning(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00eaff" />
        <Text style={styles.loadingText}>Fetching drivers...</Text>
      </View>
    );
  }

  if (!filteredDrivers.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.noDriversText}>No drivers match your search.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search by operational area"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Drivers List */}
      <ScrollView contentContainerStyle={styles.container}>
        {filteredDrivers.map((driver) => {
          const pricePerKg = driver.price_per_kg || 0;
          const totalPrice = (weight || 1) * pricePerKg;

          return (
            <View key={driver.driver_id} style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.name}>{driver.username}</Text>
                <Text style={styles.company}>
                  {driver.company?.company_name?.toUpperCase() || "UNKNOWN COMPANY"}
                </Text>
              </View>

              <Text style={styles.text}>Phone: {driver.phone || "N/A"}</Text>
              <Text style={styles.text}>Operational Area: {driver.location || "N/A"}</Text>
              <Text style={styles.text}>Price per kg: ${pricePerKg.toFixed(2)}</Text>
              <Text style={styles.text}>Estimated Total: ${totalPrice.toFixed(2)}</Text>

              <TouchableOpacity
                style={styles.selectButton}
                onPress={() => handleSelectDriver(driver)}
                disabled={assigning}
              >
                {assigning ? (
                  <ActivityIndicator color="#000" />
                ) : (
                  <Text style={styles.selectText}>Select Driver</Text>
                )}
              </TouchableOpacity>
            </View>
          );
        })}
      </ScrollView>

      {/* Success Modal */}
      <Modal transparent visible={successModal} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.successText}>
              Driver {selectedDriver?.username} assigned successfully!
            </Text>
            <Text style={styles.successCompany}>
              {selectedDriver?.company?.company_name?.toUpperCase() || "UNKNOWN COMPANY"}
            </Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DriverSelect;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#121212" },
  container: { paddingTop: 20, alignItems: "center", paddingBottom: 40 },
  searchContainer: { padding: 12, backgroundColor: "#1a2332" },
  searchInput: { backgroundColor: "rgba(255,255,255,0.08)", borderRadius: 10, padding: 10, color: "#fff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#121212" },
  loadingText: { color: "#00eaff", marginTop: 8 },
  noDriversText: { color: "#ff5555", fontSize: 18, fontWeight: "600" },
  card: { width: width * 0.85, backgroundColor: "#1a2332", padding: 16, marginBottom: 20, borderRadius: 12, alignItems: "center" },
  cardHeader: { alignItems: "center", marginBottom: 10 },
  name: { color: "#00eaff", fontWeight: "700", fontSize: 16 },
  company: { color: "#fff", fontSize: 20, fontWeight: "800" },
  text: { color: "#fff", fontSize: 14, marginBottom: 4 },
  selectButton: { marginTop: 10, paddingVertical: 10, paddingHorizontal: 20, borderRadius: 10, backgroundColor: "#00eaff", alignItems: "center", minWidth: 120 },
  selectText: { fontWeight: "700", color: "#000" },
  modalContainer: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center" },
  modalContent: { backgroundColor: "#1a2332", padding: 20, borderRadius: 12, alignItems: "center" },
  successText: { color: "#00eaff", fontSize: 18, fontWeight: "600" },
  successCompany: { color: "#fff", fontSize: 22, fontWeight: "900", marginTop: 5 },
});
