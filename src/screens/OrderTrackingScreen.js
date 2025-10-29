import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
    View, 
    Text, 
    StyleSheet, 
    SafeAreaView, 
    TouchableOpacity, 
    Alert,
    Platform,
    Dimensions
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import DriverMap from './DriverMap'; 

const SCREEN_WIDTH = Dimensions.get('window').width;

// --- CONFIGURATION ---
const PRIMARY_COLOR = '#00eaff';
const ACCENT_COLOR = '#00eaff';
const BACKGROUND_COLOR = '#F4F7F9';

const UserOrderTrackingScreen = ({ navigation, route }) => {
    const { orderId } = route.params;
    const [liveOrder, setLiveOrder] = useState({
        orderId,
        driverId: '',
        driverName: 'Not yet assigned',
        driverVehicle: '',
        status: 'Pending',
        eta: 'Calculating...',
        driverLat: 0,
        driverLon: 0,
        speed: 0,
        lastUpdate: '',
        destinationLat: 0,
        destinationLon: 0,
    });

    const mapRef = useRef(null);
    const wsRef = useRef(null);

    // --- FETCH INITIAL ORDER/DRIVER DATA ---
    useEffect(() => {
        const fetchOrderDetails = async () => {
            try {
                const response = await fetch(`https://backend-luminan.onrender.com/api/v1/orders/${orderId}/tracking-details/`);
                if (!response.ok) {
                    console.error(`Server responded with status: ${response.status}`);
                    return;
                }

                const data = await response.json();
                const driverData = data.driver || {};

                setLiveOrder(prev => ({
                    ...prev,
                    driverId: driverData._id || driverData.driver_id || '',
                    driverName: driverData.username || driverData.driver_name || 'Not yet assigned',
                    driverVehicle: driverData.vehicle_number || '',
                    status: data.status || 'Pending',
                    eta: data.eta || 'Calculating...',
                    driverLat: driverData.current_location?.lat ?? prev.driverLat,
                    driverLon: driverData.current_location?.lng ?? prev.driverLon,
                }));
            } catch (err) {
                console.error("Failed to fetch order tracking details:", err);
            }
        };

        fetchOrderDetails();
    }, [orderId]);

    // --- CONNECT TO WEBSOCKET ---
    useEffect(() => {
        if (!liveOrder.driverId) return; // wait for driver assignment

        const wsUrl = `wss://backend-luminan.onrender.com/ws/track/${orderId}/`;
        wsRef.current = new WebSocket(wsUrl);

        wsRef.current.onopen = () => console.log("WebSocket connected to backend.");
        wsRef.current.onmessage = (event) => {
            console.log("WebSocket message received:", event.data);
            const data = JSON.parse(event.data);
            console.log("Parsed WebSocket data:", data);

            if (data.event === "location_update") {
                // Backend sends lat/lng at top-level, not nested
                console.log("Updating location: lat =", data.lat, "lng =", data.lng);
                setLiveOrder(prev => ({
                    ...prev,
                    driverLat: data.lat ?? prev.driverLat,
                    driverLon: data.lng ?? prev.driverLon,
                    lastUpdate: data.timestamp ?? prev.lastUpdate,
                }));
            } else if (data.event === "error") {
                console.error("WebSocket error:", data.message);
            }
        };

        wsRef.current.onerror = (error) => console.error("WebSocket connection error:", error);
        wsRef.current.onclose = () => console.log("WebSocket disconnected.");

        return () => wsRef.current?.close();
    }, [orderId, liveOrder.driverId]);

    // --- MAP REGION LOGIC ---
    const mapRegion = useMemo(() => ({
        latitude: liveOrder.driverLat || 0,
        longitude: liveOrder.driverLon || 0,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
    }), [liveOrder.driverLat, liveOrder.driverLon]);

    const reCenterMap = () => {
        if (mapRef.current && mapRef.current.animateToRegion) {
            mapRef.current.animateToRegion(mapRegion, 500);
        }
    };

    const handleChatPress = () => {
        if (!liveOrder.driverId) {
            Alert.alert("Driver not yet assigned", "Cannot contact driver until someone confirms the order.");
            return;
        }
        Alert.alert(
            "Contact Driver",
            `Simulating chat with ${liveOrder.driverName} (${liveOrder.driverId}).`
        );
        // navigation.navigate('Conversation', { driverName: liveOrder.driverName, driverId: liveOrder.driverId });
    };

    // --- ORDER INFO PANEL ---
    const OrderInfoPanel = () => (
        <View style={styles.infoPanel}>
            <Text style={styles.infoTitle}>
                <Ionicons name="receipt-sharp" size={18} color={PRIMARY_COLOR} /> 
                {' '}Order: <Text style={styles.infoTitleValue}>{liveOrder.orderId}</Text>
            </Text>

            <View style={styles.driverSection}>
                <Ionicons name="person-circle-sharp" size={40} color={ACCENT_COLOR} />
                <View style={{ flex: 1, marginLeft: 10 }}>
                    <Text style={styles.driverName}>Your Driver: {liveOrder.driverName}</Text>
                    <Text style={styles.driverVehicle}>{liveOrder.driverVehicle || "Vehicle not confirmed"}</Text>
                </View>
                <TouchableOpacity 
                    style={[styles.contactButton, !liveOrder.driverId && { backgroundColor: '#CCC' }]} 
                    onPress={handleChatPress} 
                    disabled={!liveOrder.driverId}
                >
                    <Ionicons name="chatbubbles-outline" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            <View style={styles.etaSection}>
                <View style={[styles.etaPill, { backgroundColor: PRIMARY_COLOR }]}>
                    <MaterialCommunityIcons name="clock-fast" size={20} color="#fff" />
                    <Text style={styles.etaPillText}>
                        Estimated Arrival: <Text style={styles.etaPillValue}>{liveOrder.eta}</Text>
                    </Text>
                </View>
                <TouchableOpacity style={styles.recenterButton} onPress={reCenterMap}>
                    <Ionicons name="locate-outline" size={20} color={PRIMARY_COLOR} />
                    <Text style={styles.recenterButtonText}>Recenter Map</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color="#333" />
                </TouchableOpacity>
                <Text style={styles.headerText}>Live Order Tracking</Text>
                <View style={{ width: 30 }} />
            </View>

            <OrderInfoPanel />

            <DriverMap
                selectedDriver={{ 
                    id: liveOrder.driverId, 
                    lat: liveOrder.driverLat || 0, 
                    lon: liveOrder.driverLon || 0, 
                    name: liveOrder.driverName,
                    status: liveOrder.status,
                }}
                mapRegion={mapRegion}
                drivers={[{ 
                    id: liveOrder.driverId, 
                    lat: liveOrder.driverLat || 0, 
                    lon: liveOrder.driverLon || 0, 
                    name: liveOrder.driverName,
                    status: liveOrder.status,
                }]}
                mapRef={mapRef} 
            />
        </SafeAreaView>
    );
};

// --- STYLES ---
const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: BACKGROUND_COLOR },
    header: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        paddingHorizontal: 15,
        paddingVertical: 12,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#E0E0E0',
    },
    backButton: { padding: 5 },
    headerText: { fontSize: 18, fontWeight: '800', color: '#333' },

    infoPanel: {
        backgroundColor: '#fff',
        marginHorizontal: 15,
        padding: 15,
        borderRadius: 10,
        marginVertical: 10,
        borderLeftWidth: 5,
        borderLeftColor: PRIMARY_COLOR,
        ...Platform.select({
            ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.15, shadowRadius: 4 },
            android: { elevation: 5 },
        }),
    },
    infoTitle: { fontSize: 17, fontWeight: 'bold', color: '#555', marginBottom: 10, borderBottomWidth: 1, borderBottomColor: '#EEE', paddingBottom: 8 },
    infoTitleValue: { color: PRIMARY_COLOR },
    driverSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 15 },
    driverName: { fontSize: 16, fontWeight: '700', color: '#333' },
    driverVehicle: { fontSize: 13, color: '#888', marginTop: 3 },
    contactButton: { backgroundColor: ACCENT_COLOR, padding: 10, borderRadius: 8 },
    etaSection: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderTopWidth: 1, borderTopColor: '#EEE', paddingTop: 10 },
    etaPill: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20 },
    etaPillText: { marginLeft: 8, fontSize: 14, color: '#fff', fontWeight: '500' },
    etaPillValue: { fontWeight: '800' },
    recenterButton: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: PRIMARY_COLOR },
    recenterButtonText: { marginLeft: 5, fontSize: 13, fontWeight: '600', color: PRIMARY_COLOR },
});

export default UserOrderTrackingScreen;
