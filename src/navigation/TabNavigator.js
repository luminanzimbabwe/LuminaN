import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context"; 

// 🧭 Import Main Tab Screens
import HomeScreen from "../screens/HomeScreen";
import UpdatesScreen from "../screens/UpdatesScreen";
import ProgressScreen from "../screens/ProgressScreen";
import ProfileScreen from "../screens/ProfileScreen"; 

const Tab = createBottomTabNavigator();

/**
 * @description Defines the primary four screens accessible via the bottom tab bar,
 * with explicit safe area handling.
 */
const TabNavigator = () => {
    // Use the hook to get the bottom safe area inset value
    const insets = useSafeAreaInsets();
    
    return (
        <Tab.Navigator
            initialRouteName="Home"
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarShowLabel: true,
                
                // Dynamically apply the tab bar style with the safe area inset
                tabBarStyle: {
                    ...styles.tabBar,
                    // Add the bottom safe area inset to the custom base height (60)
                    height: 60 + insets.bottom, 
                },

                tabBarActiveTintColor: "#00eaff",
                tabBarInactiveTintColor: "#888",
                tabBarLabelStyle: { fontSize: 10, fontWeight: '600' }, // Smaller font size
                
                tabBarIcon: ({ focused, color }) => {
                    let iconName;
                    const iconSize = 20; // Smaller icon size
                    
                    if (route.name === "Home") iconName = focused ? "home" : "home-outline";
                    else if (route.name === "Updates") iconName = focused ? "notifications" : "notifications-outline";
                    else if (route.name === "Progress") iconName = focused ? "pulse" : "pulse-outline";
                    else if (route.name === "Profile") iconName = focused ? "person" : "person-outline"; // Profile icon logic

                    return <Ionicons name={iconName} size={iconSize} color={color} />;
                },
            })}
        >
            <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
            <Tab.Screen name="Updates" component={UpdatesScreen} options={{ title: 'Updates' }} />
            <Tab.Screen name="Progress" component={ProgressScreen} options={{ title: 'Progress' }} />
            <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Profile' }} />
        </Tab.Navigator>
    );
};

export default TabNavigator;

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: "#18181b",
        borderTopColor: "#00eaff",
        borderTopWidth: 0.5,
        height: 60, // Base height before safe area inset is added dynamically
        paddingBottom: 4, 
        paddingTop: 4,
        position: "absolute", // Keeps it floating/fixed at the bottom
    },
});
