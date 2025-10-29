import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native'; // Import Animated and Easing
import Svg, { Path, Defs, LinearGradient, Stop } from 'react-native-svg';

const GasLtLogo = ({ width = 300, height = 80, color = '#FFB800' }) => {
  // --- COLOR PALETTE TO MATCH UPLOADED LOGO ---
  const SILVER_TEXT_COLOR = '#C0C0C0';
  const TAGLINE_COLOR = '#D0D0D0';
  
  const GOLD_STOP_0 = '#FFEC00'; 
  const GOLD_STOP_50 = '#FFA500'; 
  const GOLD_STOP_100 = '#D49500'; 

  // --- ANIMATION SETUP FOR THE FLAME ---
  const flameAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Define the animation sequence
    Animated.loop(
      Animated.sequence([
        // Phase 1: Grow slightly, move up, fade slightly
        Animated.timing(flameAnimation, {
          toValue: 1,
          duration: 700, // Speed of flicker
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        // Phase 2: Shrink back, move down, reset opacity
        Animated.timing(flameAnimation, {
          toValue: 0,
          duration: 700, // Speed of flicker
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Cleanup on unmount
    return () => flameAnimation.stopAnimation();
  }, []);

  // Interpolate values for flame animation
  const animatedScale = flameAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.05], // Scale up to 105%
  });

  const animatedTranslateY = flameAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -2], // Move up by 2 units
  });

  const animatedOpacity = flameAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0.95], // Subtle fade
  });

  return (
    <View style={{
      width: width,
      height: height,
      flexDirection: 'row',
      alignItems: 'center'
    }}>
      {/* Logo Container */}
      <View style={{
        width: height * 1.2,
        height: height,
        position: 'relative',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {/* Gear SVG */}
        <Svg
          width={height * 0.85}
          height={height * 0.85}
          viewBox="0 0 32 32"
          style={{
            position: 'absolute',
            bottom: height * 0.05, 
            zIndex: 1
          }}
        >
          <Path
            fill={SILVER_TEXT_COLOR} 
            d="M16 24c-4.4 0-8-3.6-8-8s3.6-8 8-8 8 3.6 8 8-3.6 8-8 8zm0-14c-3.3 0-6 2.7-6 6s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6z"
          />
          <Path
            fill={SILVER_TEXT_COLOR}
            d="M28.5 16c0-1.1-.9-2-2-2h-1.4c-.2-.7-.4-1.4-.8-2l1-1c.8-.8.8-2 0-2.8l-1.4-1.4c-.8-.8-2-.8-2.8 0l-1 1c-.6-.4-1.3-.6-2-.8V5.5c0-1.1-.9-2-2-2h-2c-1.1 0-2 .9-2 2v1.4c-.7.2-1.4.4-2 .8l-1-1c-.8-.8-2-.8-2.8 0L5.9 8.1c-.8.8-.8 2 0 2.8l1 1c-.4.6-.6 1.3-.8 2H4.7c-1.1 0-2 .9-2 2v2c0 1.1.9 2 2 2h1.4c.2.7.4 1.4.8 2l-1 1c-.8.8-.8 2 0 2.8l1.4 1.4c.8.8 2 .8 2.8 0l1-1c.6.4 1.3.6 2 .8v1.4c0 1.1.9 2 2 2h2c1.1 0 2-.9 2-2v-1.4c.7-.2 1.4-.4 2-.8l1 1c.8.8 2 .8 2.8 0l1.4-1.4c.8-.8.8-2 0-2.8l-1-1c.4-.6.6-1.3.8-2h1.4c1.1 0 2-.9 2-2v-2z"
          />
        </Svg>

        {/* Animated Flame SVG */}
        <Animated.View // Wrap Svg in Animated.View to apply transforms
          style={{
            position: 'absolute',
            zIndex: 2,
            transform: [{ scale: animatedScale }, { translateY: animatedTranslateY }],
            opacity: animatedOpacity,
          }}
        >
          <Svg width={height * 0.9} height={height} viewBox="0 0 32 40">
            <Defs>
              <LinearGradient id="flameGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <Stop offset="0%" stopColor={GOLD_STOP_0} />
                <Stop offset="50%" stopColor={GOLD_STOP_50} />
                <Stop offset="100%" stopColor={GOLD_STOP_100} />
              </LinearGradient>
            </Defs>
            <Path
              fill="url(#flameGradient)"
              d="M16 2c-0.5 0-9 10.5-9 18c0 7 4.5 11 9 11s9-4 9-11C25 12.5 16.5 2 16 2z"
            />
          </Svg>
        </Animated.View>
      </View>

      {/* Text Container */}
      <View style={{
        height: height,
        justifyContent: 'center',
        marginLeft: -height * 0.18 
      }}>
        <Text style={{
          fontSize: height * 0.42,
          fontWeight: 'bold',
          color: SILVER_TEXT_COLOR,
          letterSpacing: height * 0.02,
          marginBottom: height * 0.06
        }}>
          GAS LT
        </Text>
        <Text style={{
          fontSize: height * 0.17,
          color: TAGLINE_COLOR,
          fontWeight: '400',
          letterSpacing: height * 0.01,
          marginTop: 2
        }}>
          Service You Can Trust
        </Text>
      </View>
    </View>
  );
};

export default GasLtLogo;