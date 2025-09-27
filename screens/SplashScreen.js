import React, { useEffect, useRef } from "react";
import { View, StyleSheet, StatusBar, Animated, Easing, ActivityIndicator } from "react-native";
import Svg, { Rect, Text } from "react-native-svg";
import { useAuth } from "../AuthContext";

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedText = Animated.createAnimatedComponent(Text);

const SplashScreen = () => {
  const leftAnim = useRef(new Animated.Value(-80)).current;
  const rightAnim = useRef(new Animated.Value(80)).current;
  const middleScale = useRef(new Animated.Value(0.8)).current;
  const { loading } = useAuth();

  useEffect(() => {
    if (loading) return;

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
  }, [loading]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#232323" />
      <View style={styles.logoWrapper}>
        <Svg width="160" height="70" viewBox="0 0 160 70">
          <AnimatedRect x={10} y={20} width={30} height={30} fill="#6EC6FF" stroke="#FF3B3B" strokeWidth={2} transform={[{ translateX: leftAnim }, { rotate: "-10deg" }]} rx={6} ry={6} />
          <AnimatedText x={25} y={42} fontSize="18" fontWeight="bold" fill="#fff" textAnchor="middle" transform={[{ translateX: leftAnim }, { rotate: "-10deg" }]}>L</AnimatedText>
          <AnimatedText x={80} y={45} fontSize="20" fontWeight="bold" fill="#fff" textAnchor="middle" transform={[{ scale: middleScale }]}>umina</AnimatedText>
          <AnimatedRect x={120} y={20} width={30} height={30} fill="#6EC6FF" stroke="#FF3B3B" strokeWidth={2} transform={[{ translateX: rightAnim }, { rotate: "10deg" }]} rx={6} ry={6} />
          <AnimatedText x={135} y={42} fontSize="18" fontWeight="bold" fill="#fff" textAnchor="middle" transform={[{ translateX: rightAnim }, { rotate: "10deg" }]}>N</AnimatedText>
        </Svg>

        {loading && <ActivityIndicator size="small" color="#6EC6FF" style={{ marginTop: 15 }} />}
      </View>
    </View>
  );
};

export default SplashScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#232323", justifyContent: "center", alignItems: "center" },
  logoWrapper: { alignItems: "center" },
});
