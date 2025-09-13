import React, { useEffect, useRef } from "react";
import {
  View,
  StyleSheet,
  StatusBar,
  Animated,
  Easing,
  ActivityIndicator,
} from "react-native";
import Svg, { Rect, Text } from "react-native-svg";
import { useAuth } from "../AuthContext";

// Animated SVG components
const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedText = Animated.createAnimatedComponent(Text);

const SplashScreen = ({ navigation }) => {
  const leftAnim = useRef(new Animated.Value(-80)).current;
  const rightAnim = useRef(new Animated.Value(80)).current;
  const middleScale = useRef(new Animated.Value(0.8)).current;
  const { user, loading } = useAuth();


  

  useEffect(() => {
  let timer;
  if (!loading) {
    // Play animations
    Animated.parallel([
      Animated.timing(leftAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.timing(rightAnim, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
      Animated.spring(middleScale, {
        toValue: 1,
        friction: 4,
        tension: 80,
        delay: 200,
        useNativeDriver: true,
      }),
    ]).start();

    // Ensure splash shows at least 1.5s
    timer = setTimeout(() => {
      if (user) navigation.replace("MainApp");
      else navigation.replace("Welcome");
    }, 2500);
  }

  return () => clearTimeout(timer);
}, [loading, user]);


  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#232323" />

      {/* Logo lower on the screen */}
      <View style={styles.logoWrapper}>
        <Svg width="160" height="70" viewBox="0 0 160 70">
          {/* Left box (slanted) */}
          <AnimatedRect
            x={10}
            y={20}
            width={30}
            height={30}
            fill="#6EC6FF"
            stroke="#FF3B3B"
            strokeWidth={2}
            transform={[
              { translateX: leftAnim },
              { rotate: "-10deg" }, // slant left
            ]}
            rx={6}
            ry={6}
          />
          <AnimatedText
            x={25}
            y={42}
            fontSize="18"
            fontWeight="bold"
            fill="#fff"
            textAnchor="middle"
            transform={[{ translateX: leftAnim }, { rotate: "-10deg" }]}
          >
            L
          </AnimatedText>

          {/* Middle "umina" */}
          <AnimatedText
            x={80}
            y={45}
            fontSize="20"
            fontWeight="bold"
            fill="#FFFFFF"
            textAnchor="middle"
            transform={[{ scale: middleScale }]}
          >
            umina
          </AnimatedText>

          {/* Right box (same size as left, slanted) */}
          <AnimatedRect
            x={120}
            y={20}
            width={30}
            height={30}
            fill="#6EC6FF"
            stroke="#FF3B3B"
            strokeWidth={2}
            transform={[
              { translateX: rightAnim },
              { rotate: "10deg" }, // slant right
            ]}
            rx={6}
            ry={6}
          />
          <AnimatedText
            x={135}
            y={42}
            fontSize="18"
            fontWeight="bold"
            fill="#fff"
            textAnchor="middle"
            transform={[{ translateX: rightAnim }, { rotate: "10deg" }]}
          >
            N
          </AnimatedText>
        </Svg>

        {/* Loading Indicator */}
        <ActivityIndicator
          size="small"
          color="#6EC6FF"
          style={{ marginTop: 15 }}
        />
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#232323",
    justifyContent: "flex-end", // push things lower
    alignItems: "center",
    paddingBottom: 120, // control how far from bottom
  },
  logoWrapper: {
    alignItems: "center",
  },
});
