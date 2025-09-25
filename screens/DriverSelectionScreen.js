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
import { useAuth } from "../AuthContext"; // Ensure you are using the correct auth context

const { width } = Dimensions.get("window");
const BACKEND_URL = "https://backend-luminan.onrender.com/drivers/list/";

const DriverSelect = ({ navigation, route }) => {
  const { orderId, weight } = route.params; // total weight from ConfirmOrder
  const { authToken } = useAuth(); // Access token for authentication

  // States for drivers, filtered drivers, loading, assigning, modals
  const [drivers, setDrivers] = useState([]);
  const [filteredDrivers, setFilteredDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Fetch drivers when the component mounts
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

  // Assign driver to the order
  const handleSelectDriver = async (driver) => {
  setAssigning(true);
  try {
    // Debugging: log the driver object and its ID
    console.log("Selected Driver:", driver);
    console.log("Driver ID:", driver.driver_id);  // Log driver driver_id for debugging

    // Check if driver.driver_id exists and is valid
    if (!driver.driver_id) {
      alert("Driver ID is invalid.");
      return;
    }

    // Construct the request URL for POST method (assigning driver)
    const url = `https://backend-luminan.onrender.com/orders/assign/`;  // No need for orderId here if it's passed in the body
    console.log("Request URL:", url);
    console.log("Sending Driver ID:", driver.driver_id); // Log the ID being sent in the request

    const res = await fetch(url, {
      method: "POST",  // Use POST instead of PATCH
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      body: JSON.stringify({ 
        driver_id: driver.driver_id,
        order_id: orderId,  // You can send orderId in the body instead of the URL
      }), 
    });

    if (!res.ok) {
      const errorData = await res.text();
      console.error("Error response:", errorData);
      alert(errorData || "Failed to assign order.");
      return;
    }

    const data = await res.json();
    setSelectedDriver(driver);
    setSuccessModal(true);

    setTimeout(() => {
      setSuccessModal(false);
      navigation.navigate("OrderSuccess", { orderId, driver });
    }, 1500);
  } catch (err) {
    console.error("Driver assignment failed:", err);
    alert("Something went wrong: " + err.message);
  } finally {
    setAssigning(false);
  }
};


  // Loading state while fetching drivers
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00eaff" />
        <Text style={styles.loadingText}>Fetching drivers...</Text>
      </View>
    );
  }

  // If no drivers are available
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
            <View key={driver.driver_id} style={styles.card}> {/* Use driver.driver_id as the key */}
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
