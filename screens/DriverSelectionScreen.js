// screens/DriverSelectScreen.js
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Dimensions,
} from "react-native";
import { useAuth } from "../AuthContext";
import Animated, { FadeIn } from "react-native-reanimated";
import { ProgressBar } from "react-native-paper";

const { width, height } = Dimensions.get("window");
const BACKEND_URL = "https://backend-luminan.onrender.com";

const DriverSelectScreen = ({ navigation, route }) => {
  const { orderId, weight } = route.params;
  const { authToken, fetchUserAPI } = useAuth();

  const [drivers, setDrivers] = useState([]);
  const [displayedDrivers, setDisplayedDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [driverProgress, setDriverProgress] = useState({});

  // Fetch drivers
  useEffect(() => {
    const fetchDrivers = async () => {
      try {
        const data = await fetchUserAPI("/drivers/list/");
        const list = data.drivers || [];
        setDrivers(list);
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch drivers:", err);
        alert("Failed to fetch drivers.");
        setLoading(false);
      }
    };
    fetchDrivers();
  }, []);

  // Show drivers gradually
  useEffect(() => {
    if (!drivers.length) return;

    let index = 0;
    const interval = setInterval(() => {
      if (index >= drivers.length) {
        clearInterval(interval);
        return;
      }

      const driver = drivers[index];
      const safeTop = Math.random() * (height - 260);
      const safeLeft = Math.random() * (width - 180);

      setDisplayedDrivers((prev) => [
        ...prev,
        { ...driver, position: { top: safeTop, left: safeLeft } },
      ]);

      setDriverProgress((prev) => ({
        ...prev,
        [driver.driver_id || driver._id]: 0,
      }));

      const progressInterval = setInterval(() => {
        setDriverProgress((prev) => {
          const id = driver.driver_id || driver._id;
          const current = prev[id] ?? 0;
          if (current >= 1) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [id]: current + 0.02 };
        });
      }, 100);

      index++;
    }, 500);
  }, [drivers]);

  // Move drivers slightly
  useEffect(() => {
    const moveInterval = setInterval(() => {
      setDisplayedDrivers((prev) =>
        prev.map((driver) => {
          const jitterX = (Math.random() - 0.5) * 10;
          const jitterY = (Math.random() - 0.5) * 10;
          return {
            ...driver,
            position: {
              top: Math.min(Math.max(driver.position.top + jitterY, 20), height - 260),
              left: Math.min(Math.max(driver.position.left + jitterX, 20), width - 180),
            },
          };
        })
      );
    }, 4000);

    return () => clearInterval(moveInterval);
  }, []);

  // Assign driver
  const handleSelectDriver = async (driver) => {
    if (!driver.driver_id && !driver._id) return alert("Invalid driver ID");
    setAssigning(true);
    try {
      const driverId = driver.driver_id || driver._id;
      const res = await fetch(`${BACKEND_URL}/orders/assign/${orderId}/`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ driver_id: driverId }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Failed to assign driver");
      }

      setSelectedDriver(driver);
      setSuccessModal(true);
      setTimeout(() => {
        setSuccessModal(false);
        navigation.navigate("OrderSuccess", { orderId, driver });
      }, 1500);
    } catch (err) {
      console.error("Driver assignment failed:", err);
      alert("Driver assignment failed: " + err.message);
    } finally {
      setAssigning(false);
    }
  };

  // Search filter
  const filteredDrivers = displayedDrivers.filter((d) => {
    const query = searchQuery.toLowerCase();
    return (
      (d.username ?? "").toLowerCase().includes(query) ||
      (d.operational_area ?? "").toLowerCase().includes(query) ||
      (d.phone ?? "").toLowerCase().includes(query) ||
      (d.status ?? "").toLowerCase().includes(query) ||
      String(d.price_per_kg ?? "").toLowerCase().includes(query) ||
      "luminan company".includes(query)
    );
  });

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#00eaff" />
        <Text style={styles.loadingText}>Loading drivers...</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Search */}
      <View style={styles.searchContainer}>
        <TextInput
          placeholder="Search driver (name, phone, area, price...)"
          placeholderTextColor="#888"
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Map simulation */}
      <View style={styles.mapContainer}>
        {filteredDrivers.length === 0 ? (
          <View style={styles.center}>
            <Text style={styles.noDriversText}>No drivers found</Text>
          </View>
        ) : (
          filteredDrivers.map((driver) => {
            const pricePerKg = driver.price_per_kg ?? 0;
            const totalPrice = (weight || 1) * pricePerKg;
            const progress = driverProgress[driver.driver_id || driver._id] ?? 0;

            return (
              <Animated.View
                key={driver.driver_id || driver._id}
                entering={FadeIn.delay(Math.random() * 500)}
                style={[
                  styles.card,
                  {
                    position: "absolute",
                    top: driver.position.top,
                    left: driver.position.left,
                  },
                ]}
              >
                <Text style={styles.name}>{driver.username}</Text>
                <Text style={styles.company}>LUMINAN COMPANY</Text>
                <Text style={styles.text}>Phone: {driver.phone ?? "Not provided"}</Text>
                <Text style={styles.text}>
                  Area: {driver.operational_area ?? "Not specified"}
                </Text>
                <Text style={styles.text}>Status: {driver.status ?? "Unknown"}</Text>
                <Text style={styles.text}>Price/kg: ${pricePerKg.toFixed(2)}</Text>
                <Text style={styles.text}>Est. Total: ${totalPrice.toFixed(2)}</Text>

                <ProgressBar
                  progress={progress}
                  color="#00eaff"
                  style={styles.progress}
                />

                <TouchableOpacity
                  style={styles.selectButtonSmall}
                  onPress={() => handleSelectDriver(driver)}
                  disabled={assigning}
                >
                  {assigning && selectedDriver?.driver_id === driver.driver_id ? (
                    <ActivityIndicator size="small" color="#000" />
                  ) : (
                    <Text style={styles.selectTextSmall}>Select</Text>
                  )}
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
      </View>

      {/* Loading Indicator for Driver Assignment */}
      {assigning && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#00eaff" />
          <Text style={styles.loadingText}>Assigning driver...</Text>
        </View>
      )}

      {/* Success Modal */}
      <Modal transparent visible={successModal} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.successText}>
              Driver {selectedDriver?.username} assigned successfully!
            </Text>
            <Text style={styles.successCompany}>LUMINAN COMPANY</Text>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DriverSelectScreen;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#121212" },
  searchContainer: { padding: 16, backgroundColor: "#1a2332", borderRadius: 8 },
  searchInput: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 12,
    padding: 12,
    color: "#fff",
    fontSize: 16,
  },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  loadingText: { color: "#00eaff", marginTop: 10, fontSize: 16 },
  noDriversText: { color: "#fff", fontSize: 16 },

  mapContainer: {
    flex: 1,
    backgroundColor: "#0d1b26",
    borderWidth: 2,
    borderColor: "#00eaff",
    margin: 10,
    borderRadius: 12,
    overflow: "hidden",
  },

  card: {
    width: 170,
    backgroundColor: "#1a2332",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    shadowColor: "#00eaff",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    marginBottom: 12,
  },
  name: { color: "#00eaff", fontWeight: "700", fontSize: 16 },
  company: { color: "#00aaff", fontWeight: "800", fontSize: 14, marginVertical: 2 },
  text: { color: "#fff", fontSize: 12, marginTop: 2 },
  progress: { height: 4, borderRadius: 4, marginTop: 6, alignSelf: "stretch" },

  selectButtonSmall: {
    marginTop: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "#00eaff",
  },
  selectTextSmall: { fontWeight: "700", color: "#000", fontSize: 14 },

  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
  },

  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#1a2332",
    padding: 25,
    borderRadius: 16,
    alignItems: "center",
  },
  successText: { color: "#00eaff", fontSize: 20, fontWeight: "700" },
  successCompany: { color: "#00aaff", fontSize: 24, fontWeight: "900", marginTop: 8 },
});