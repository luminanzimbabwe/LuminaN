// screens/NotificationScreen.js
import React, { useEffect, useState, useRef, useCallback } from "react";
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
  TextInput,
  SafeAreaView, 
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { apiListNotifications, apiMarkNotificationRead, apiMarkAllNotificationsRead, apiDeleteNotification } from '../services/auth.service';
import { useAuth } from '../context/AuthContext';

const { width, height } = Dimensions.get("window");

// --- DUMMY DATA FOR REFINEMENT ---
const DUMMY_NOTIFICATIONS = [
  {
    id: "sys:profile:setup",
    title: "Complete Your Profile",
    message: "Add your delivery address and payment methods to speed up your ordering process. Go to Profile >  to get started.",
    read: false,
    type: "system",
    timestamp: new Date(Date.now() - 2 * 60 * 60000).toISOString(), // 2 hours ago
    priority: "normal",
    _local: true,
  },
  {
    id: "sys:orders:howto",
    title: "How to Place an Order",
    message: "Browse packages, select items, choose delivery options, and confirm with driver quotes. It's that simple!",
    read: false,
    type: "system",
    timestamp: new Date(Date.now() - 4 * 60 * 60000).toISOString(), // 4 hours ago
    priority: "normal",
    _local: true,
  },
  {
    id: "sys:custom:packages",
    title: "Custom Packages Feature",
    message: "Create personalized packages by toggling 'Custom Package' in the order flow. Mix and match items for your specific needs.",
    read: true,
    type: "system",
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60000).toISOString(), // 1 day ago
    priority: "normal",
    _local: true,
  },
  {
    id: "sys:driver:quotes",
    title: "Driver Quotes Explained",
    message: "After confirming an order, you'll receive quotes from available drivers. Compare prices and ETAs before selecting.",
    read: false,
    type: "system",
    timestamp: new Date(Date.now() - 6 * 60 * 60000).toISOString(), 
    priority: "normal",
    _local: true,
  },
  {
    id: "sys:tracking:feature",
    title: "Real-Time Tracking",
    message: "Once your order is assigned, track your driver in real-time through the app. Get live updates on delivery progress.",
    read: false,
    type: "system",
    timestamp: new Date(Date.now() - 8 * 60 * 60000).toISOString(), // 8 hours ago
    priority: "normal",
    _local: true,
  },
  {
    id: "sys:support:contact",
    title: "Need Help?",
    message: "Contact our support team anytime through the app. We're here to assist with orders, deliveries, or any questions.",
    read: true,
    type: "system",
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60000).toISOString(), // 2 days ago
    priority: "normal",
    _local: true,
  },
  {
    id: "sys:ratings:importance",
    title: "Rate Your Experience",
    message: "After delivery, please rate your driver and leave feedback. This helps us maintain high service standards.",
    read: false,
    type: "system",
    timestamp: new Date(Date.now() - 12 * 60 * 60000).toISOString(), // 12 hours ago
    priority: "normal",
    _local: true,
  },
  {
    id: "sys:safety:tips",
    title: "Safety First",
    message: "Always verify your delivery details and communicate directly through the app for secure transactions.",
    read: false,
    type: "system",
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60000).toISOString(), // 3 days ago
    priority: "normal",
    _local: true,
  },
  {
    id: "sys:loyalty:program",
    title: "Loyalty Rewards",
    message: "Earn points on every order! Redeem them for discounts on future deliveries. Check your profile for current balance.",
    read: true,
    type: "system",
    timestamp: new Date(Date.now() - 5 * 24 * 60 * 60000).toISOString(), // 5 days ago
    priority: "normal",
    _local: true,
  },
  {
    id: "sys:updates:coming",
    title: "Exciting Updates Coming Soon",
    message: "We're working on new features like scheduled deliveries and bulk ordering. Stay tuned for announcements!",
    read: false,
    type: "system",
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60000).toISOString(), // 1 week ago
    priority: "normal",
    _local: true,
  },
];
// --- END DUMMY DATA ---

const notificationTypes = {
  order: {
    icon: "receipt-outline",
    color: "#3b82f6",
    gradient: ["#3b82f6", "#1d4ed8"],
    bgColor: "rgba(59, 130, 246, 0.1)",
  },
  delivery: {
    icon: "car-outline",
    color: "#22c55e",
    gradient: ["#22c55e", "#16a34a"],
    bgColor: "rgba(34, 197, 94, 0.1)",
  },
  promotion: {
    icon: "gift-outline",
    color: "#f59e0b",
    gradient: ["#f59e0b", "#d97706"],
    bgColor: "rgba(245, 158, 11, 0.1)",
  },
  system: {
    icon: "settings-outline",
    color: "#8b5cf6",
    gradient: ["#8b5cf6", "#7c3aed"],
    bgColor: "rgba(139, 92, 246, 0.1)",
  },
  alert: {
    icon: "warning-outline",
    color: "#ef4444",
    gradient: ["#ef4444", "#dc2626"],
    bgColor: "rgba(239, 68, 68, 0.1)",
  },
};

const NotificationScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedNotification, setExpandedNotification] = useState(null);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [serverError, setServerError] = useState(null); 
  const { user, isSetupComplete } = useAuth();
  
  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(-100)).current; 
  const searchAnim = useRef(new Animated.Value(0)).current;
  const notificationAnimations = useRef({}).current;
 

    // --- Real API fetch with client-side fallback ---
    const fetchNotifications = async (showRefresh = false) => {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);

      let serverItems = [];
      setServerError(null);

     
      if (user) {
        try {
          const data = await apiListNotifications();
          serverItems = Array.isArray(data) ? data : (data.results || []);
        } catch (err) {
          
          console.warn('[Notifications] server fetch failed, falling back to local items', err?.data || err);
          setServerError(err?.data?.error || err?.message || 'Server error');
        }
      } else {
        
        console.log('[Notifications] No authenticated user, showing local notifications only');
      }

      try {
       
        const systemNotifications = [];

        if (user && !isSetupComplete && user.id) {
          systemNotifications.push({
            id: `sys:welcome:${user.id}`,
            title: `Welcome to GasLT, ${user.username || user.name || 'friend'}!`,
            message: "We're glad you're here \u2014 start by placing your first order or browse packages.",
            read: false,
            type: 'system',
            timestamp: new Date().toISOString(),
            priority: 'normal',
            _local: true,
          });
        }

        systemNotifications.push({
          id: 'sys:usage:tips',
          title: 'Quick Tips',
          message: 'Tip: Use the Confirm Order flow to get driver quotes quickly. Toggle custom packages for tailored orders.',
          read: false,
          type: 'system',
          timestamp: new Date(Date.now() - 3600 * 1000).toISOString(),
          priority: 'low',
          _local: true,
        });

        
        const byId = new Map();
        [...systemNotifications, ...DUMMY_NOTIFICATIONS, ...serverItems].forEach((n) => {
          byId.set(String(n.id), n);
        });
        const merged = Array.from(byId.values()).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        // Initialize animation values for merged list
        merged.forEach((notification) => {
          if (!notificationAnimations[notification.id]) {
            notificationAnimations[notification.id] = {
              scale: new Animated.Value(0.95),
              opacity: new Animated.Value(0),
              translateY: new Animated.Value(20),
            };
          }
        });

        setNotifications(merged);

        
        if (serverError) {
         
          if (__DEV__) Alert.alert('Notifications', `Server error: ${serverError}. Showing local tips.`);
        }

        // Animate using the merged list we just set
        animateHeaderIn();
        animateNotificationsIn(merged);
      } catch (err) {
        console.warn('[Notifications] local merge failed', err);
        Alert.alert('Failed to load notifications', 'Please try again later.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  const animateHeaderIn = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 100,
        friction: 12,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const animateNotificationsIn = (notificationsList) => {
    const animations = notificationsList.map((notification, index) => {
      const anim = notificationAnimations[notification.id];
      return Animated.parallel([
        Animated.timing(anim.opacity, {
          toValue: 1,
          duration: 400,
          delay: 100 + index * 80, 
          useNativeDriver: true,
        }),
        Animated.spring(anim.scale, {
          toValue: 1,
          tension: 60,
          friction: 8,
          delay: 100 + index * 80,
          useNativeDriver: true,
        }),
        Animated.timing(anim.translateY, {
            toValue: 0,
            duration: 500,
            delay: 100 + index * 80,
            useNativeDriver: true,
        }),
      ]);
    });
    
    // Play animations in sequence with a small delay between each
    Animated.stagger(50, animations).start();
  };

  const onRefresh = useCallback(() => {
    // Reset animations for a fresh entrance
    fadeAnim.setValue(0);
    slideAnim.setValue(-100);
    Object.values(notificationAnimations).forEach(anim => {
        anim.opacity.setValue(0);
        anim.scale.setValue(0.95);
        anim.translateY.setValue(20);
    });
    
    fetchNotifications(true);
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
  }, []);

  // --- DUMMY FUNCTION REPLACEMENTS ---
  const markAsRead = async (notificationId) => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    // Optimistic update
    setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n)));

    
    const notification = notifications.find(n => n.id === notificationId);
    if (notification && notification._local) {
      
      return;
    }

    try {
      await apiMarkNotificationRead(notificationId);
    } catch (err) {
      console.warn('[Notifications] mark read failed', err?.data || err);
      // Rollback
      setNotifications((prev) => prev.map((n) => (n.id === notificationId ? { ...n, read: false } : n)));
    }
  };

  const markAllAsRead = async () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([10, 50, 10]);
    }
    // Optimistic update
    const prev = notifications;
    setNotifications(prev.map((n) => ({ ...n, read: true })));
    try {
      await apiMarkAllNotificationsRead();
    } catch (err) {
      console.warn('[Notifications] mark all read failed', err?.data || err);
      setNotifications(prev); // rollback
    }
  };

  const deleteNotification = async (notificationId) => {
    const notification = notifications.find(n => n.id === notificationId);
    const anim = notificationAnimations[notificationId];
    // Optimistic remove locally after animation
    const performRemove = () => {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      delete notificationAnimations[notificationId];
    };

    try {
      if (anim) {
        Animated.timing(anim.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start(() => performRemove());
      } else {
        performRemove();
      }
     
      if (notification && !notification._local) {
        await apiDeleteNotification(notificationId);
      }
    } catch (err) {
      console.warn('[Notifications] delete failed', err?.data || err);
      Alert.alert('Delete failed', 'Unable to delete notification. Please try again later.');
      
      fetchNotifications();
    }
  };
  // --- END DUMMY FUNCTION REPLACEMENTS ---
  
  const handleNotificationPress = (notification) => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    
    // Toggle expanded state
    setExpandedNotification(
      expandedNotification === notification.id ? null : notification.id
    );
    
    // Animate item slightly when tapped
    const anim = notificationAnimations[notification.id];
    if (anim) {
        Animated.sequence([
            Animated.timing(anim.scale, { toValue: 0.98, duration: 100, useNativeDriver: true }),
            Animated.spring(anim.scale, { toValue: 1, friction: 5, tension: 100, useNativeDriver: true }),
        ]).start();
    }
    
    if (!notification.read) {
      markAsRead(notification.id);
    }
  };

  const handleSwipeAction = (notification, action) => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate([10, 30, 10]);
    }

    if (action === 'read') {
      markAsRead(notification.id);
    } else if (action === 'delete') {
      Alert.alert(
        "Delete Notification",
        "Are you sure you want to delete this notification?",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Delete", style: "destructive", onPress: () => deleteNotification(notification.id) }
        ]
      );
    }
  };

  const toggleSearch = () => {
    setShowSearch(prev => {
        const nextState = !prev;
        Animated.timing(searchAnim, {
            toValue: nextState ? 1 : 0,
            duration: 300,
            useNativeDriver: false,
        }).start();
        if (!nextState) setSearchQuery(""); 
        return nextState;
    });
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesFilter = selectedFilter === "all" || 
      (selectedFilter === "unread" && !notification.read) ||
      (selectedFilter === "read" && notification.read) ||
      notification.type === selectedFilter;
    
    const matchesSearch = searchQuery === "" || 
      notification.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
      notification.title.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesFilter && matchesSearch;
  }).sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)); 

  const getFilterCount = (filter) => {
    if (filter === "all") return notifications.length;
    if (filter === "unread") return notifications.filter(n => !n.read).length;
    if (filter === "read") return notifications.filter(n => n.read).length;
    return notifications.filter(n => n.type === filter).length;
  };

  useEffect(() => {
    fetchNotifications();
  }, []); 


  const NotificationTypeIcon = ({ type, size = 24 }) => {
    const config = notificationTypes[type] || notificationTypes.system;
    
    return (
      <View style={[styles.typeIconContainer, { backgroundColor: config.bgColor }]}>
        <Ionicons name={config.icon} size={size} color={config.color} />
      </View>
    );
  };

  const FilterChip = ({ filter, label, count, isActive, onPress }) => (
    <TouchableOpacity
      style={styles.filterChip}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <LinearGradient
        
        colors={isActive ? ["#00eaff", "#0ea5e9"] : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"]}
        start={[0, 0]}
        end={[1, 0]}
        style={[styles.filterChipGradient, isActive && styles.filterChipActiveGradient]}
      >
        <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]}>
          {label}
        </Text>
        {count > 0 && (
          <View style={[styles.filterChipBadge, isActive && styles.filterChipBadgeActive]}>
            <Text style={styles.filterChipBadgeText}>
              {count}
            </Text>
          </View>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );

  const SwipeableNotification = ({ notification }) => {
    const config = notificationTypes[notification.type] || notificationTypes.system;
    const isExpanded = expandedNotification === notification.id;
    const anim = notificationAnimations[notification.id];

    if (!anim) return null; 

    const formatTime = (timestamp) => {
      const date = new Date(timestamp);
      const now = new Date();
      const diffInMinutes = Math.floor((now - date) / (1000 * 60));
      
      if (diffInMinutes < 60) return `${diffInMinutes <= 1 ? 1 : diffInMinutes}m ago`;
      const diffInHours = Math.floor(diffInMinutes / 60);
      if (diffInHours < 24) return `${diffInHours}h ago`;
      
      // Check if it's yesterday
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      
      // Otherwise, show date
      return date.toLocaleDateString();
    };

    return (
      <Animated.View
        style={[
          styles.notificationContainer,
          {
            opacity: anim.opacity,
            transform: [
              { scale: anim.scale },
              { translateY: anim.translateY },
            ],
          },
        ]}
      >
        <Pressable
          style={[
            styles.notificationCard,
            !notification.read && styles.unreadNotification,
            isExpanded && styles.notificationExpanded,
          ]}
          onPress={() => handleNotificationPress(notification)}
          android_ripple={{ color: 'rgba(0,234,255,0.1)' }}
        >
          <LinearGradient
            colors={
              !notification.read
                ? ["rgba(0,234,255,0.08)", "rgba(0,234,255,0.02)"] // Brighter for unread
                : ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"] // Darker for read
            }
            start={[0, 0]}
            end={[1, 1]}
            style={styles.cardGradient}
          >
            {/* Card Header */}
            <View style={styles.cardHeader}>
              <NotificationTypeIcon type={notification.type} />
              
              <View style={styles.notificationInfo}>
                <View style={styles.titleRow}>
                  <Text style={styles.notificationTitle} numberOfLines={1}>
                    {notification.title || getNotificationTitle(notification.type)}
                  </Text>
                  <Text style={styles.notificationTime}>
                    {formatTime(notification.timestamp)}
                  </Text>
                  {!notification.read && <View style={styles.unreadDot} />}
                </View>
                <Text 
                    style={styles.notificationMessagePreview}
                    numberOfLines={isExpanded ? 0 : 2} // Show 2 lines max when collapsed
                >
                    {notification.message}
                </Text>
              </View>

              <Ionicons 
                name={isExpanded ? "chevron-up-outline" : "chevron-down-outline"} 
                size={24} 
                color="#888" 
                style={{ marginLeft: 8 }}
              />
            </View>

            {/* Expanded Content */}
            {isExpanded && (
              <Animated.View style={styles.expandedContent}>
                <View style={styles.divider} />
                
                <Text style={styles.expandedMessageFull}>
                    {notification.message}
                </Text>

                <View style={styles.actionButtons}>
                  <TouchableOpacity
                    style={styles.primaryAction}
                    onPress={() => {
                      Alert.alert("Action Taken", `Navigating to details for a ${notification.type} notification.`);
                    }}
                  >
                    <LinearGradient
                      colors={config.gradient}
                      start={[0, 0]}
                      end={[1, 0]}
                      style={styles.primaryActionGradient}
                    >
                      <Ionicons name="open-outline" size={18} color="#fff" />
                      <Text style={styles.primaryActionText}>View Details</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.secondaryAction}
                    onPress={() => handleSwipeAction(notification, 'delete')}
                  >
                    <Ionicons name="trash-outline" size={18} color="#ef4444" />
                    <Text style={styles.secondaryActionText}>Delete</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.secondaryAction, !notification.read && { backgroundColor: "rgba(34, 197, 94, 0.1)", borderColor: "rgba(34, 197, 94, 0.3)" }]}
                    onPress={() => handleSwipeAction(notification, 'read')}
                  >
                    <Ionicons name={!notification.read ? "checkmark-done-outline" : "close-outline"} size={18} color={!notification.read ? "#22c55e" : "#ef4444"} />
                    <Text style={[styles.secondaryActionText, !notification.read && { color: "#22c55e" }]}>
                        {notification.read ? "Unread" : "Mark Read"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* Additional Info */}
                <View style={styles.additionalInfo}>
                  <View style={styles.infoItem}>
                    <Ionicons name="time-outline" size={16} color="#888" />
                    <Text style={styles.infoText}>
                      Sent: {new Date(notification.timestamp).toLocaleString()}
                    </Text>
                  </View>
                </View>
              </Animated.View>
            )}
          </LinearGradient>
        </Pressable>
      </Animated.View>
    );
  };

  const getNotificationTitle = (type) => {
    const titles = {
      order: "Order Update",
      delivery: "Delivery Status",
      promotion: "Special Offer",
      system: "System Notification",
      alert: "Important Alert",
    };
    return titles[type] || "Notification";
  };

  if (loading) {
    return (
      <LinearGradient colors={["#0a0e27", "#16213e", "#1a2332"]} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00eaff" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={["#0a0e27", "#16213e", "#1a2332"]} style={styles.container}>
      
      {/* Animated Header */}
      <Animated.View 
        style={[
          styles.headerWrapper,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <BlurView intensity={20} style={styles.headerBlur}>
          <SafeAreaView>
            <View style={styles.headerContent}>
              <View style={styles.headerTop}>
                <Text style={styles.headerTitle}>Inbox</Text>
                <View style={styles.headerActions}>
                  <TouchableOpacity style={styles.headerButton} onPress={toggleSearch}>
                    <Ionicons name={showSearch ? "close-outline" : "search-outline"} size={24} color="#00eaff" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.headerButton} onPress={markAllAsRead}>
                    <Ionicons name="checkmark-done-outline" size={24} color="#00eaff" />
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Search Bar */}
              <Animated.View
                style={[
                  styles.searchContainer,
                  {
                    height: searchAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 50],
                    }),
                    opacity: searchAnim,
                    transform: [{
                        translateY: searchAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [-10, 0]
                        })
                    }]
                  },
                ]}
              >
                <View style={styles.searchInputContainer}>
                  <Ionicons name="search-outline" size={20} color="#888" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="Search notifications by title or content..."
                    placeholderTextColor="#888"
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                      <Ionicons name="close-circle" size={20} color="#888" />
                    </TouchableOpacity>
                  )}
                </View>
              </Animated.View>

              {/* Stats */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statNumber}>{notifications.length}</Text>
                  <Text style={styles.statLabel}>Total</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#ef4444' }]}>
                    {notifications.filter(n => !n.read).length}
                  </Text>
                  <Text style={styles.statLabel}>Unread</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={[styles.statNumber, { color: '#22c55e' }]}>
                    {notifications.filter(n => n.read).length}
                  </Text>
                  <Text style={styles.statLabel}>Read</Text>
                </View>
              </View>
            </View>
          </SafeAreaView>
        </BlurView>
      </Animated.View>

      {/* Filter Chips */}
      <Animated.View 
        style={[
            styles.filterWrapper, 
            {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
            }
        ]}
      >
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          <FilterChip label="All" count={getFilterCount("all")} isActive={selectedFilter === "all"} onPress={() => setSelectedFilter("all")} />
          <FilterChip label="Unread" count={getFilterCount("unread")} isActive={selectedFilter === "unread"} onPress={() => setSelectedFilter("unread")} />
          <FilterChip label="Orders" count={getFilterCount("order")} isActive={selectedFilter === "order"} onPress={() => setSelectedFilter("order")} />
          <FilterChip label="Delivery" count={getFilterCount("delivery")} isActive={selectedFilter === "delivery"} onPress={() => setSelectedFilter("delivery")} />
          <FilterChip label="Offers" count={getFilterCount("promotion")} isActive={selectedFilter === "promotion"} onPress={() => setSelectedFilter("promotion")} />
        </ScrollView>
      </Animated.View>

      {/* Notifications List */}
      <ScrollView
        style={styles.notificationsContainer}
        contentContainerStyle={styles.notificationsContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#00eaff"]}
            tintColor="#00eaff"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyContainer}>
            <LinearGradient
              colors={["rgba(0,234,255,0.1)", "rgba(0,234,255,0.02)"]}
              style={styles.emptyGradient}
            >
              <Ionicons name="notifications-off-outline" size={80} color="#00eaff" />
              <Text style={styles.emptyTitle}>No Notifications</Text>
              <Text style={styles.emptyText}>
                {searchQuery 
                  ? `No notifications match your search.`
                  : selectedFilter === "all" 
                    ? "You're all caught up! No notifications to show."
                    : `No ${selectedFilter} notifications found. Try a different filter.`}
              </Text>
            </LinearGradient>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <SwipeableNotification 
              key={notification.id} 
              notification={notification} 
            />
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
};

export default NotificationScreen;


const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0a0e27" },

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

  // Header

  headerWrapper: {
      marginTop: Platform.OS === 'ios' ? 50 : 30,
      marginHorizontal: 16,
      marginBottom: 15,
      borderRadius: 25,
      overflow: "hidden",
      borderWidth: 1,
      borderColor: 'rgba(0,234,255,0.1)', // Subtle border
      elevation: 5, // Android shadow
     
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 10,
    },
  
  headerBlur: {
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
  },
  headerContent: {
    padding: 16,
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16, 
  },
  headerTitle: {
    color: "#fff",
    fontSize: 32, // Larger, bolder title
    fontWeight: "800",
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    padding: 10,
    borderRadius: 14,
    backgroundColor: "rgba(0,234,255,0.1)",
  },

  // Search
  searchContainer: {
    overflow: "hidden",
    marginBottom: 16, 
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.08)", // Slightly brighter input background
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: "#fff",
    fontSize: 15,
    paddingVertical: 0, // fix for Android padding
  },

  // Stats
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#00eaff",
    fontSize: 24,
    fontWeight: "bold",
  },
  statLabel: {
    color: "#a0a0a0", // Softer gray
    fontSize: 12,
    marginTop: 2,
    fontWeight: "500",
  },

  // Filter Chips
  filterWrapper: {
    height: 48,
    marginBottom: 8,
  },
  filterContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  filterChip: {
    borderRadius: 15,
    overflow: 'hidden',
    height: 30, // Fixed height for alignment
  },
  filterChipGradient: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 4,
    height: '100%',
    gap: 6,
  },
  filterChipActiveGradient: {
    elevation: 5,
    shadowColor: '#00eaff',
    shadowOpacity: 0.5,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
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
    backgroundColor: "rgba(255,255,255,0.2)",
    borderRadius: 10,
    paddingHorizontal: 5,
    paddingVertical: 1,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  filterChipBadgeActive: {
    backgroundColor: "#fff",
  },
  filterChipBadgeText: {
    color: "#0a0e27", // Dark text on active badge
    fontSize: 11,
    fontWeight: "bold",
  },

  // Notifications List
  notificationsContainer: {
    flex: 1,
  },
  notificationsContent: {
    paddingHorizontal: 16,
    paddingBottom: 80,
  },
  notificationContainer: {
    marginBottom: 12,
  },
  notificationCard: {
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "transparent",
  },
  unreadNotification: {
    borderColor: "rgba(0,234,255,0.5)",
    shadowColor: "#00eaff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  cardGradient: {
    padding: 16,
  },

  // Card Header
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  typeIconContainer: {
    width: 44, // Slightly smaller icon container
    height: 44,
    borderRadius: 22,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  notificationInfo: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  notificationTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
    marginRight: 8,
    flexShrink: 1,
  },
  unreadDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#00eaff", // Changed dot color to theme color
    marginLeft: 8,
  },
  notificationTime: {
    color: "#888",
    fontSize: 11,
    fontWeight: '500',
    marginLeft: 'auto',
  },
  
  notificationMessagePreview: {
    color: "#e5e5e5",
    fontSize: 14,
    lineHeight: 20,
  },

  // Expanded Content
  expandedContent: {
    marginTop: 12,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 12,
  },
  expandedMessageFull: {
      color: "#e5e5e5",
      fontSize: 14,
      lineHeight: 22,
      marginBottom: 16,
  },
  actionButtons: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  primaryAction: {
    flex: 2,
    borderRadius: 12,
    overflow: "hidden",
  },
  primaryActionGradient: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 8,
  },
  primaryActionText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  secondaryAction: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(239,68,68,0.3)",
    gap: 4,
  },
  secondaryActionText: {
    color: "#ef4444",
    fontSize: 13,
    fontWeight: "600",
  },

  // Additional Info
  additionalInfo: {
    gap: 6,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(255,255,255,0.1)",
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  infoText: {
    color: "#a0a0a0",
    fontSize: 12,
  },

  // Empty State
  emptyContainer: {
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    marginTop: 40,
  },
  emptyGradient: {
    alignItems: "center",
    padding: 30,
    borderRadius: 20,
    width: "100%",
    borderWidth: 1,
    borderColor: "rgba(0,234,255,0.2)",
  },
  emptyTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    color: "#a0a0a0",
    fontSize: 14,
    textAlign: "center",
    paddingHorizontal: 10,
  },
});