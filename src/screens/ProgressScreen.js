import React, {
  useEffect,
  useState,
  useRef,
  useCallback,
  memo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Animated,
  RefreshControl,
  Dimensions,
  Platform,
  Vibration,
  Pressable,
  Linking, 
} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Stop,
} from "react-native-svg";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { apiListUserOrders, apiTrackOrder, apiCancelOrder } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

// --- Constants & Config ---
const { width, height } = Dimensions.get("window");

const NEON_BLUE = "#00eaff";
const BACKGROUND_GRADIENT = ["#0a0e27", "#16213e", "#1a2332"];

// Support Numbers (The Fix)
const SUPPORT_NUMBERS = ["0785748130/29", "0785748130/29"];

// Order Status Configuration
const STATUS_CONFIG = {
  pending: {
    color: "#facc15",
    gradient: ["#facc15", "#f59e0b"],
    icon: "time-outline",
    progress: 0.25,
    label: "Processing",
    description: "Your order is being prepared and verified.",
  },
  confirmed: {
    color: "#3b82f6",
    gradient: ["#3b82f6", "#1d4ed8"],
    icon: "car-outline",
    progress: 0.5,
    label: "Confirmed",
    description: "Driver is on the way to your location.",
  },
  out_for_delivery: {
    color: "#3b82f6",
    gradient: ["#3b82f6", "#1d4ed8"],
    icon: "car-outline",
    progress: 0.75,
    label: "On the Way",
    description: "Driver is heading to your location now.",
  },
  delivered: {
    color: "#22c55e",
    gradient: ["#22c55e", "#16a34a"],
    icon: "checkmark-circle-outline",
    progress: 1.0,
    label: "Delivered",
    description: "Order completed successfully. Enjoy!",
  },
  cancelled: {
    color: "#ef4444",
    gradient: ["#ef4444", "#dc2626"],
    icon: "close-circle-outline",
    progress: 0,
    label: "Cancelled",
    description: "Order was cancelled. Contact support for details.",
  },
};

// Mock Data (Refined for better demonstration)
const MOCK_ORDERS = [
  {
    order_id: "654321b1-2a9d-4c3e-9f0a-1b2c3d4e5f6a",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    total_price: 45.0,
    order_status: "out_for_delivery",
    notes: "Please call on arrival, gate code 1234.",
    items: [{ name: "15kg Propane", qty: 1 }],
  },
  {
    order_id: "987654c2-3b8c-5d4e-0a1b-2c3d4e5f6a7b",
    created_at: new Date(Date.now() - 86400000).toISOString(),
    total_price: 32.5,
    order_status: "delivered",
    notes: "Left behind the shed as requested.",
    items: [{ name: "10kg Butane", qty: 1 }],
  },
  {
    order_id: "321098d3-4c7b-6e5f-1b0a-3d4e5f6a7b8c",
    created_at: new Date(Date.now() - 1800000).toISOString(),
    total_price: 60.0,
    order_status: "pending",
    notes: "",
    items: [
      { name: "20kg Propane", qty: 2 },
      { name: "Regulator", qty: 1 },
    ],
  },
  {
    order_id: "135792e4-5d6a-7f8c-2c1b-4e5f6a7b8c9d",
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    total_price: 15.99,
    order_status: "cancelled",
    notes: "Address conflict resolved by customer.",
    items: [{ name: "Gas Hose", qty: 1 }],
  },
];

// --- Sub Components (Memoized for Performance) ---

/**
 * Animated Progress Ring using SVG
 */
const ProgressRing = ({ progress, size = 60, strokeWidth = 6, color }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDasharray = `${circumference} ${circumference}`;
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Svg
      width={size}
      height={size}
      style={{ transform: [{ rotate: "-90deg" }] }}
    >
      <Defs>
        {/* Use a unique ID for the gradient based on color */}
        <SvgLinearGradient id={`progressGrad-${color}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <Stop offset="100%" stopColor={color} stopOpacity="1" />
        </SvgLinearGradient>
      </Defs>
      <Circle
        stroke="rgba(255,255,255,0.1)"
        fill="transparent"
        strokeWidth={strokeWidth}
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
      <Circle
        stroke={`url(#progressGrad-${color})`}
        fill="transparent"
        strokeWidth={strokeWidth}
        strokeDasharray={strokeDasharray}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        r={radius}
        cx={size / 2}
        cy={size / 2}
      />
    </Svg>
  );
};

/**
 * Memoized Filter Chip Component
 */
const FilterChip = memo(({ status, label, count, isActive, onPress }) => {
  const activeColors = [NEON_BLUE, "#0ea5e9"];
  const inactiveColors = ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"];

  return (
    <TouchableOpacity
      style={styles.filterChip}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        colors={isActive ? activeColors : inactiveColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.filterChipGradient,
          isActive && styles.filterChipActiveGradient,
        ]}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {label}
        </Text>
        {count > 0 && (
          <View
            style={[
              styles.filterChipBadge,
              isActive && styles.filterChipBadgeActive,
            ]}
          >
            <Text
              style={[
                styles.filterChipBadgeText,
                isActive && styles.filterChipBadgeTextActive,
              ]}
            >
              {count}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
});

/**
 * Order Card Component with Expansion Logic
 */
const OrderCard = ({ order, isExpanded, handleOrderPress, orderAnimations, handleContactSupport, handleTrackOrder, handleConfirmOrder, handleMarkDelivered, handleCancelOrder }) => {
  const config = STATUS_CONFIG[order.order_status] || STATUS_CONFIG.pending;

  // Helper function to calculate total weight from items or use provided weight
  const calculateTotalWeight = (order) => {
    if (order.weight && order.weight > 0) {
      return order.weight;
    }
    if (!Array.isArray(order.items)) return 0;
    return order.items.reduce((total, item) => {
      const match = item.name.match(/(\d+)kg/);
      if (match) {
        return total + parseInt(match[1]) * item.qty;
      }
      return total;
    }, 0);
  };

  // Get pre-prepared animations
  const anim = orderAnimations.current[order.order_id] || {
    scale: new Animated.Value(1),
    opacity: new Animated.Value(1),
    translateY: new Animated.Value(0),
  };

  // Animation for order details
  const detailsOpacity = useRef(new Animated.Value(isExpanded ? 1 : 0)).current;
  const detailsTranslateY = useRef(new Animated.Value(isExpanded ? 0 : 10)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(detailsOpacity, {
        toValue: isExpanded ? 1 : 0,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(detailsTranslateY, {
        toValue: isExpanded ? 0 : 10,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, [isExpanded, detailsOpacity, detailsTranslateY]);

  return (
    <Animated.View
      style={[
        styles.orderCardContainer,
        {
          opacity: anim.opacity,
          transform: [{ scale: anim.scale }, { translateY: anim.translateY }],
        },
      ]}
    >
      <Pressable
        style={styles.orderCardWrapper}
        onPress={() => handleOrderPress(order)}
        android_ripple={{ color: "rgba(0,234,255,0.1)" }}
      >
        <LinearGradient
          colors={["rgba(255,255,255,0.08)", "rgba(255,255,255,0.02)"]}
          style={[styles.cardGradient, isExpanded && styles.cardGradientExpanded]}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 0.9, y: 0.9 }}
        >
          {/* Status Indicator */}
          <View style={[styles.statusIndicator, { backgroundColor: config.color }]} />

          {/* Card Header & Progress */}
          <View style={styles.cardHeader}>
            <View style={styles.orderInfo}>
              <View style={styles.orderIdContainer}>
                <MaterialIcons name="receipt" size={20} color={NEON_BLUE} />
                <Text style={styles.orderIdText}>
                  #{order.order_id.slice(-6).toUpperCase()}
                </Text>
              </View>
              <Text style={styles.orderDate}>
                {new Date(order.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                })}{" "}
                {" at "}
                {new Date(order.created_at).toLocaleTimeString("en-US", {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </Text>
            </View>

            <View style={styles.progressContainer}>
              <ProgressRing
                progress={config.progress}
                color={config.color}
                size={50}
                strokeWidth={4}
              />
              <View style={styles.progressIcon}>
                <Ionicons name={config.icon} size={20} color={config.color} />
              </View>
            </View>
          </View>

          {/* Status Info */}
          <View style={styles.statusInfo}>
            <View style={styles.statusLabelContainer}>
              <Text style={[styles.statusLabel, { color: config.color }]}>
                {config.label}
              </Text>
              <View style={[styles.statusDot, { backgroundColor: config.color }]} />
            </View>
            <Text style={styles.statusDescription}>{config.description}</Text>
          </View>

          {/* Order Details Preview */}
          <Animated.View
            style={[
              styles.orderDetails,
              {
                opacity: detailsOpacity,
                transform: [{ translateY: detailsTranslateY }],
              },
            ]}
          >
            <View style={styles.detailItem}>
              <Ionicons name="receipt-outline" size={16} color={NEON_BLUE} />
              <Text style={[styles.detailText, { color: NEON_BLUE }]}>Order ID: {order.order_id}</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="cash-outline" size={16} color="#22c55e" />
              <Text style={[styles.detailText, { color: "#22c55e" }]}>
                Total: ${order.total_price?.toFixed(2) || 'N/A'}
              </Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="barbell-outline" size={16} color="#f59e0b" />
              <Text style={[styles.detailText, { color: "#f59e0b" }]}>Weight: {calculateTotalWeight(order)}kg</Text>
            </View>
            <View style={styles.detailItem}>
              <Ionicons name="id-card-outline" size={16} color="#3b82f6" />
              <Text style={[styles.detailText, { color: "#3b82f6" }]}>Driver ID: {order.assigned_driver_id || 'Not Assigned'}</Text>
            </View>
            {order.driver?.username && (
              <View style={styles.detailItem}>
                <Ionicons name="person-outline" size={16} color="#8b5cf6" />
                <Text style={[styles.detailText, { color: "#8b5cf6" }]}>Driver: {order.driver.username}</Text>
              </View>
            )}
            {order.notes && (
              <View style={[styles.detailItem, styles.detailItemNotes]}>
                <Ionicons name="document-text-outline" size={16} color="#ef4444" />
                <Text style={[styles.detailText, { color: "#ef4444" }]} numberOfLines={2}>Notes: {order.notes}</Text>
              </View>
            )}
          </Animated.View>

          {/* Expanded Content - Animated */}
          <Animated.View style={{ height: isExpanded ? null : 0, overflow: 'hidden' }}>
            <View style={styles.divider} />

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              {order.order_status === 'out_for_delivery' && (
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 1 }]}
                  onPress={() => handleMarkDelivered(order.order_id)}
                >
                  <LinearGradient
                    colors={STATUS_CONFIG.delivered.gradient}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="checkmark-done-circle-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Mark Delivered</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {config.progress < 1.0 && config.progress > 0 && (
                <TouchableOpacity
                  style={[styles.actionButton, { flex: 2 }]}
                  onPress={() => handleTrackOrder(order.order_id)}
                >
                  <LinearGradient
                    colors={config.gradient}
                    style={styles.actionButtonGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Ionicons name="navigate-outline" size={20} color="#fff" />
                    <Text style={styles.actionButtonText}>Track Order</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>

            {/* Order Items List */}
            <View style={styles.itemsList}>
                <Text style={styles.timelineTitle}>Items</Text>
                {(order.items && Array.isArray(order.items) ? order.items : []).map((item, index) => (
                    <View key={index} style={styles.itemRow}>
                        <Text style={styles.itemQty}>{item.qty}x</Text>
                        <Text style={styles.itemText}>{item.name}</Text>
                    </View>
                ))}
            </View>


            {/* Note Detail */}
            {order.notes ? (
              <View style={{ marginTop: 10 }}>
                <Text style={styles.timelineTitle}>Delivery Notes</Text>
                <Text style={styles.detailText}>{order.notes}</Text>
              </View>
            ) : null}
          </Animated.View>

          {/* Expand Indicator */}
          <Animated.View
            style={[
              styles.expandIndicator,
              { transform: [{ rotate: isExpanded ? "180deg" : "0deg" }] },
            ]}
          >
            <Ionicons
              name="chevron-down-circle-outline"
              size={24}
              color={NEON_BLUE}
            />
          </Animated.View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
};


// --- Main Component Start ---

const OrderProgressScreen = ({ navigation }) => {
  const { user } = useAuth();

  // --- State and Refs ---
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const headerScale = useRef(new Animated.Value(0.9)).current;
  const filterAnim = useRef(new Animated.Value(-width)).current;
  const orderAnimations = useRef({}); 

  // --- Utility & Handlers ---

  // *** Contact Support Handler ***
  const handleContactSupport = useCallback(() => {
    Vibration.vibrate(20);

    const supportNumber = "0785748130/29";

    const callNumber = () => {
      const url = `tel:${supportNumber}`;
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Error", "Phone calling is not supported on this device.");
        }
      }).catch(err => console.error('Error with calling:', err));
    };

    const openWhatsApp = () => {
      const url = `whatsapp://send?phone=${supportNumber}`;
      Linking.canOpenURL(url).then(supported => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Alert.alert("Error", "WhatsApp is not installed on this device.");
        }
      }).catch(err => console.error('Error with WhatsApp:', err));
    };

    Alert.alert(
      "Contact Support",
      "Choose how to contact support:",
      [
        {
          text: "Call",
          onPress: callNumber,
        },
        {
          text: "WhatsApp",
          onPress: openWhatsApp,
        },
        {
          text: "Cancel",
          style: "cancel",
        },
      ]
    );
  }, []);

  const prepareAnimations = useCallback((ordersList) => {
    // Only create refs for new/unseen orders
    ordersList.forEach((order) => {
      if (!orderAnimations.current[order.order_id]) {
        orderAnimations.current[order.order_id] = {
          opacity: new Animated.Value(1),
          scale: new Animated.Value(1),
          translateY: new Animated.Value(0),
        };
      }
    });
  }, []);

  const animateHeaderIn = useCallback(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
      Animated.spring(headerScale, { toValue: 1, tension: 100, friction: 8, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, slideAnim, headerScale]);

  const animateFiltersIn = useCallback(() => {
    Animated.timing(filterAnim, { toValue: 0, duration: 600, delay: 400, useNativeDriver: true }).start();
  }, [filterAnim]);

  const animateOrdersIn = useCallback((ordersList) => {
    const anims = ordersList.map((order, index) => {
      const anim = orderAnimations.current[order.order_id];
      if (!anim) return null;
      return Animated.parallel([
        Animated.timing(anim.opacity, { toValue: 1, duration: 700, delay: index * 120, useNativeDriver: true }),
        Animated.spring(anim.scale, { toValue: 1, tension: 60, friction: 8, delay: index * 120, useNativeDriver: true }),
        Animated.timing(anim.translateY, { toValue: 0, duration: 700, delay: index * 120, useNativeDriver: true }),
      ]);
    }).filter(a => a !== null);

    Animated.stagger(50, anims).start();
  }, []);

  const loadOrders = useCallback(async () => {
    setLoading(true);
    try {
      // First, load from AsyncStorage
      let localOrders = [];
      try {
        const storedOrders = await AsyncStorage.getItem('localOrders');
        if (storedOrders) {
          localOrders = JSON.parse(storedOrders);
        }
      } catch (storageError) {
        console.error('Error loading local orders:', storageError);
      }

      
      setOrders(localOrders);
      prepareAnimations(localOrders);
      setLoading(false);
      animateHeaderIn();
      animateFiltersIn();
      animateOrdersIn(localOrders);

      
      try {
        const ordersData = await apiListUserOrders();
        const ordersArray = Array.isArray(ordersData) ? ordersData : ordersData?.orders || [];

        
        if (ordersArray.length > 0) {
          await AsyncStorage.setItem('localOrders', JSON.stringify(ordersArray));
          setOrders(ordersArray);
          prepareAnimations(ordersArray);
          animateOrdersIn(ordersArray);
        }
      } catch (apiError) {
        console.error('API sync failed, using local orders:', apiError);
        
      }
    } catch (error) {
      console.error('Failed to load orders:', error);
      setLoading(false);
      Alert.alert('Error', 'Failed to load orders. Please try again.');
    }
  }, [prepareAnimations, animateHeaderIn, animateFiltersIn, animateOrdersIn]);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const ordersData = await apiListUserOrders();
      const ordersArray = Array.isArray(ordersData) ? ordersData : ordersData?.orders || [];

      
      await AsyncStorage.setItem('localOrders', JSON.stringify(ordersArray));

      setOrders(ordersArray);
      setRefreshing(false);
      animateOrdersIn(ordersArray); 
    } catch (error) {
      console.error('Failed to refresh orders:', error);
      setRefreshing(false);
      Alert.alert('Error', 'Failed to refresh orders. Please try again.');
    }
  }, [animateOrdersIn]);

  const refreshOrders = useCallback(async () => {
    try {
      const ordersData = await apiListUserOrders();
      const ordersArray = Array.isArray(ordersData) ? ordersData : ordersData?.orders || [];
      setOrders(ordersArray);
      prepareAnimations(ordersArray);
      animateOrdersIn(ordersArray);
    } catch (error) {
      console.error('Failed to refresh orders:', error);
      Alert.alert('Error', 'Failed to refresh orders.');
    }
  }, [prepareAnimations, animateOrdersIn]);

  const handleConfirmOrder = useCallback((orderId) => {
    Alert.alert("Confirm Order", "Order confirmed successfully!", [
      { text: "OK", onPress: () => refreshOrders() }
    ]);
  }, [refreshOrders]);

  const handleMarkDelivered = useCallback((orderId) => {
    Alert.alert("Mark Delivered", "Order marked as delivered!", [
      { text: "OK", onPress: () => refreshOrders() }
    ]);
  }, [refreshOrders]);

  const handleCancelOrder = useCallback(async (orderId) => {
    Alert.alert("Cancel Order", "Are you sure you want to cancel this order?", [
      { text: "Cancel", style: "cancel" },
      { text: "Yes", onPress: async () => {
        try {
          await apiCancelOrder(orderId);
          Alert.alert("Success", "Order cancelled successfully!");
          refreshOrders();
        } catch (error) {
          console.error('Failed to cancel order:', error);
          Alert.alert('Error', 'Failed to cancel order.');
        }
      }}
    ]);
  }, [refreshOrders]);

  const handleTrackOrder = useCallback((orderId) => {
    // Haptic Feedback
    if (Platform.OS === "ios") {
      Vibration.vibrate([10, 50, 10]);
    } else {
      Vibration.vibrate(20);
    }
    Alert.alert("Navigation", `Simulating navigation to OrderTracking for Order ID: ${orderId.slice(-6).toUpperCase()}`);
     navigation.navigate("OrderTracking", { orderId });
  }, []);

  const handleOrderPress = useCallback((order) => {
    // Haptic Feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    } else {
      Vibration.vibrate(20);
    }
    // Toggle expanded state
    setExpandedOrder(prevId => prevId === order.order_id ? null : order.order_id);
  }, []);

  // --- Filtering & Counting ---
  const allowedStatuses = ['pending', 'confirmed', 'out_for_delivery', 'cancelled', 'delivered'];
  const filteredOrders = orders.filter(order => {
    if (!allowedStatuses.includes(order.order_status)) return false;
    if (selectedFilter === "all") return true;
    return order.order_status === selectedFilter;
  });

  const getFilterCount = useCallback((status) => {
    const filtered = orders.filter(order => allowedStatuses.includes(order.order_status));
    if (status === "all") return filtered.length;
    return filtered.filter(order => order.order_status === status).length;
  }, [orders]);

  // --- Render ---

  if (loading) {
    return (
      <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={NEON_BLUE} />
          <Text style={styles.loadingText}>Synthesizing cosmic orders...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={BACKGROUND_GRADIENT} style={styles.container}>
      {/* Animated Header (Glassmorphic Card) */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }, { scale: headerScale }],
          },
        ]}
      >
        <BlurView intensity={30} style={styles.headerBlur}>
          <Text style={styles.headerTitle}>My Orders ✨</Text>
          <Text style={styles.headerSubtitle}>Your journey for gas delivery</Text>

          {/* Stats */}
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{orders.length}</Text>
              <Text style={styles.statLabel}>Total</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: STATUS_CONFIG.delivered.color }]}>
                {getFilterCount('delivered')}
              </Text>
              <Text style={styles.statLabel}>Delivered</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={[styles.statNumber, { color: STATUS_CONFIG.out_for_delivery.color }]}>
                {getFilterCount('out_for_delivery')}
              </Text>
              <Text style={styles.statLabel}>Active</Text>
            </View>
          </View>
        </BlurView>
      </Animated.View>
      
      {/* --- Horizontal Filter Chips --- */}
      <Animated.View
        style={[
          styles.filterContainer,
          {
            transform: [{ translateX: filterAnim }],
          },
        ]}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
        <FilterChip
          status="all"
          label="All"
          count={getFilterCount("all")}
          isActive={selectedFilter === "all"}
          onPress={() => setSelectedFilter("all")}
        />
        <FilterChip
          status="confirmed"
          label="Confirmed"
          count={getFilterCount("confirmed")}
          isActive={selectedFilter === "confirmed"}
          onPress={() => setSelectedFilter("confirmed")}
        />
        <FilterChip
          status="pending"
          label="Pending"
          count={getFilterCount("pending")}
          isActive={selectedFilter === "pending"}
          onPress={() => setSelectedFilter("pending")}
        />
        <FilterChip
          status="delivered"
          label="Delivered"
          count={getFilterCount("delivered")}
          isActive={selectedFilter === "delivered"}
          onPress={() => setSelectedFilter("delivered")}
        />
        <FilterChip
          status="cancelled"
          label="Cancelled"
          count={getFilterCount("cancelled")}
          isActive={selectedFilter === "cancelled"}
          onPress={() => setSelectedFilter("cancelled")}
        />
      </ScrollView>
      </Animated.View>

      {/* --- Orders List --- */}
      <ScrollView
        style={styles.ordersContainer}
        contentContainerStyle={styles.ordersContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[NEON_BLUE]}
            tintColor={NEON_BLUE}
            title="Pull to refresh"
            titleColor="#fff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredOrders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["rgba(0,234,255,0.15)", "rgba(0,234,255,0.05)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyGradient}
            >
              <Ionicons name="receipt-outline" size={80} color={NEON_BLUE} />
              <Text style={styles.emptyTitle}>No Orders Found</Text>
              <Text style={styles.emptyText}>
                {selectedFilter === "all"
                  ? "Time to place your first gas delivery order!"
                  : `No ${selectedFilter.replace('_', ' ')} orders right now.`}
              </Text>
              <TouchableOpacity
                style={styles.emptyButton}
                onPress={() => Alert.alert("Navigate", "Simulating navigation to Home Screen.")}
              >
                <LinearGradient
                  colors={[NEON_BLUE, "#0ea5e9"]}
                  style={styles.emptyButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.emptyButtonText}>Go to Home</Text>
                </LinearGradient>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        ) : (
          filteredOrders.map((order) => (
            <OrderCard
              key={order.order_id}
              order={order}
              isExpanded={expandedOrder === order.order_id}
              handleOrderPress={handleOrderPress}
              orderAnimations={orderAnimations}
              handleTrackOrder={handleTrackOrder}
              handleContactSupport={handleContactSupport}
              handleConfirmOrder={handleConfirmOrder}
              handleMarkDelivered={handleMarkDelivered}
              handleCancelOrder={handleCancelOrder}
            />
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default OrderProgressScreen;

// --- Stylesheet ---

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? 25 : 0, 
  },
  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 20,
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "500",
  },
  // Header (Glassmorphism)
  header: {
    marginTop: Platform.OS === 'ios' ? 50 : 30,
    marginHorizontal: 16,
    marginBottom: 15,
    borderRadius: 25,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: 'rgba(0,234,255,0.1)', // Subtle border
    elevation: 5, // Android shadow
    shadowColor: NEON_BLUE, // iOS shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  headerBlur: {
    padding: 20,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  headerTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    textShadowColor: 'rgba(0,234,255,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 8,
  },
  headerSubtitle: {
    color: "#a0a0a0",
    fontSize: 14,
    textAlign: "center",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: NEON_BLUE,
    fontSize: 24,
    fontWeight: "900", // Extra bold
  },
  statLabel: {
    color: "#888",
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
  },
  // Filter Chips
  filterContainer: {
    maxHeight: 45,
    marginBottom: 10,
  },
  filterContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  filterChip: {
    borderRadius: 20,
    overflow: 'hidden',
    height: 35,
  },
  filterChipGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    gap: 6,
    height: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  filterChipActiveGradient: {
    borderColor: NEON_BLUE,
    borderWidth: 1.5, // Slightly thicker border when active
  },
  filterChipText: {
    color: "#a0a0a0",
    fontSize: 13,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "700",
  },
  filterChipBadge: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 6,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipBadgeActive: {
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  filterChipBadgeText: {
    color: "#e5e7eb",
    fontSize: 11,
    fontWeight: "bold",
    lineHeight: 14,
  },
  filterChipBadgeTextActive: {
    color: "#fff",
  },

  // Orders
  ordersContainer: {
    flex: 1,
  },
  ordersContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
  },
  orderCardContainer: {
    marginBottom: 15,
  },
  orderCardWrapper: {
    borderRadius: 20,
    overflow: "hidden",
  },
  cardGradient: {
    padding: 6,
    position: "relative",
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  cardGradientExpanded: {
    borderColor: NEON_BLUE, // Stronger border on expansion
    borderWidth: 1.5,
  },
  statusIndicator: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 15,
  },
  orderInfo: { flex: 1 },
  orderIdContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  orderIdText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  orderDate: { color: "#888", fontSize: 13 },
  progressContainer: { position: "relative", alignItems: "center", justifyContent: "center" },
  progressIcon: { position: "absolute" },

  // Status Info
  statusInfo: { marginBottom: 15 },
  statusLabelContainer: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 },
  statusLabel: { fontSize: 15, fontWeight: "800", textTransform: 'uppercase', letterSpacing: 0.5 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  statusDescription: { color: "#b0b0b0", fontSize: 13, lineHeight: 18 },

  // Order Details Preview
  orderDetails: { flexDirection: 'column', gap: 8, marginBottom: 10 },
  detailItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  detailItemNotes: { flexDirection: "row", alignItems: "flex-start", gap: 6 },
  detailText: { color: "#e5e7eb", fontSize: 13, flexShrink: 1 },

  // Expanded Content
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.15)", marginVertical: 10 },
  actionButtons: { flexDirection: "row", gap: 10, marginBottom: 15 },
  actionButton: { flex: 1, borderRadius: 14, overflow: "hidden", elevation: 3 },
  actionButtonGradient: { flexDirection: "row", alignItems: "center", justifyContent: "center", padding: 12, gap: 8 },
  actionButtonText: { color: "#fff", fontSize: 13, fontWeight: "700" },
  actionButtonSecondary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    gap: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: NEON_BLUE,
    backgroundColor: 'rgba(0,234,255,0.08)',
  },
  actionButtonSecondaryText: { color: NEON_BLUE, fontSize: 13, fontWeight: "700" },

  // Items List (New addition)
  itemsList: {
    marginTop: 5,
    marginBottom: 10,
    paddingLeft: 5,
  },
  itemRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  itemQty: {
    color: NEON_BLUE,
    fontSize: 13,
    fontWeight: '700',
    width: 20,
  },
  itemText: {
    color: "#e5e7eb",
    fontSize: 13,
    flex: 1,
  },

  timelineTitle: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 8, marginTop: 5 },

  // Expand Indicator
  expandIndicator: {
    position: "absolute",
    bottom: 12,
    right: 12,
    backgroundColor: 'rgba(10,14,39,0.5)', // Backdrop for better visibility
    borderRadius: 15,
  },
  // Empty State
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", paddingVertical: 40, marginTop: 20 },
  emptyGradient: {
    alignItems: "center",
    padding: 40,
    borderRadius: 25,
    width: "100%",
    borderWidth: 1,
    borderColor: 'rgba(0,234,255,0.2)',
  },
  emptyTitle: { color: "#fff", fontSize: 22, fontWeight: "bold", marginTop: 20, marginBottom: 8 },
  emptyText: { color: "#a0a0a0", fontSize: 15, textAlign: "center", lineHeight: 20, marginBottom: 30 },
  emptyButton: { borderRadius: 14, overflow: "hidden", elevation: 5 },
  emptyButtonGradient: { paddingHorizontal: 25, paddingVertical: 12 },
  emptyButtonText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});