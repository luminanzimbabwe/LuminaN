// screens/GettingReadyScreen.js
import React, { useEffect, useRef, useState } from "react";
import {
    View,
    Text,
    StyleSheet,
    Animated,
    Easing,
    Dimensions,
    Platform,
    Vibration,
    TouchableOpacity,
    Pressable,
    ScrollView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import Svg, { Circle, Line, G, Defs, Stop, LinearGradient as SvgLinearGradient } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

// 💡 NEW: Import the useAuth hook
import { useAuth } from '../AuthContext'; 

// --- Responsive Setup ---
const { width, height } = Dimensions.get("window");
// Check if screen height is smaller than 700px (e.g., iPhone SE/mini size)
const IS_SMALL_SCREEN = height < 700; 
const SIZE = Math.min(width * 0.7, 280); // Enhanced responsive sizing (kept original logic)

// 💡 FIX: Create the animated versions of the SVG components using the helper
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedLine = Animated.createAnimatedComponent(Line);

// Use Animated.ScrollView instead of Animated.View for scrollable content
const AnimatedScrollView = Animated.createAnimatedComponent(ScrollView);


const GettingReadyScreen = ({ navigation }) => {
    // 💡 NEW: Access user state from AuthContext
    const { user, markOnboardingComplete } = useAuth();
    

    const [seconds, setSeconds] = useState(0);
    const [currentStep, setCurrentStep] = useState(0);
    const [showTooltip, setShowTooltip] = useState(false);
    const [tooltipContent, setTooltipContent] = useState("");
    const [canSkip, setCanSkip] = useState(false);

    
    // Animation Refs
    const progressAnim = useRef(new Animated.Value(0)).current;
    const handAnim = useRef(new Animated.Value(0)).current;
    const pulseAnim = useRef(new Animated.Value(1)).current;
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const slideAnim = useRef(new Animated.Value(50)).current;
    const particleAnimations = useRef([]).current;
    const stepAnimations = useRef([]).current;
    const tooltipAnim = useRef(new Animated.Value(0)).current;
    const skipButtonAnim = useRef(new Animated.Value(0)).current;
    const glowAnim = useRef(new Animated.Value(0)).current;

    // Setup Steps Data
    const setupSteps = [
        {
            id: 0,
            title: "Verifying Account",
            description: "Authenticating your credentials securely",
            icon: "shield-checkmark",
            color: "#3b82f6",
            duration: 15,
        },
        {
            id: 1,
            title: "Setting Up Profile",
            description: "Personalizing your LuminaN experience",
            icon: "person-circle",
            color: "#8b5cf6",
            duration: 20,
        },
        {
            id: 2,
            title: "Optimizing Performance",
            description: "Configuring app settings for best experience",
            icon: "speedometer",
            color: "#f59e0b",
            duration: 15,
        },
        {
            id: 3,
            title: "Finalizing Setup",
            description: "Almost ready! Just a few more seconds",
            icon: "checkmark-circle",
            color: "#22c55e",
            duration: 10,
        },
    ];

    // --- Utility Functions (Omitted for brevity, kept original functions) ---

    const handleComplete = () => {
    if (Platform.OS === 'ios') {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    // ✅ Mark onboarding done
    markOnboardingComplete();

    // 🚀 Then navigate to main app
    const destination = user ? "MainApp" : "Welcome";
    navigation.replace(destination);
    };


    const handleSkip = () => {
        if (Platform.OS === 'ios') {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
            Vibration.vibrate(100);
        }
        handleComplete();
    };

    const startEntranceAnimations = () => { 
        Animated.parallel([
            Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
            Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
        ]).start();
    };

    const startParticleAnimations = () => {
        particleAnimations.forEach((anim, index) => {
            Animated.loop(
                Animated.timing(anim, {
                    toValue: 1,
                    duration: 3000 + index * 200,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();
        });
    };

    const startGlowAnimation = () => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(glowAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(glowAnim, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ])
        ).start();
    };

    const animateStepTransition = (stepIndex) => {
        Animated.spring(stepAnimations[stepIndex], {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };

    const animateSkipButton = () => {
        Animated.spring(skipButtonAnim, {
            toValue: 1,
            tension: 50,
            friction: 8,
            useNativeDriver: true,
        }).start();
    };
    
    const showStepTooltip = (step) => {
        setTooltipContent(`${step.title}: ${step.description}`);
        setShowTooltip(true);
        
        Animated.spring(tooltipAnim, {
            toValue: 1,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
        }).start();

        setTimeout(() => {
            Animated.timing(tooltipAnim, {
                toValue: 0,
                duration: 300,
                useNativeDriver: true,
            }).start(() => setShowTooltip(false));
        }, 3000);
    };


    // --- Master useEffect for Timers and Initial Animations (kept original logic) ---

    useEffect(() => {
        // Initialize refs
        for (let i = 0; i < 12; i++) {
            particleAnimations[i] = new Animated.Value(0);
        }
        for (let i = 0; i < setupSteps.length; i++) {
            stepAnimations[i] = new Animated.Value(0);
        }

        // Start background animations
        startEntranceAnimations();
        startParticleAnimations();
        startGlowAnimation();

        // Timer & dynamic step progression
        const interval = setInterval(() => {
            setSeconds((prev) => {
                const next = prev + 1;
                
                if (next === 60) {
                    clearInterval(interval);
                    handleComplete();
                    return next;
                }

                if (next === 30 && !canSkip) {
                    setCanSkip(true);
                    animateSkipButton();
                }

                let newStep = 0;
                let totalTime = 0;
                for (let i = 0; i < setupSteps.length; i++) {
                    totalTime += setupSteps[i].duration;
                    if (next <= totalTime) {
                        newStep = i;
                        break;
                    }
                }

                if (newStep !== currentStep) {
                    setCurrentStep(newStep);
                    animateStepTransition(newStep);
                    
                    if (Platform.OS === 'ios') {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    } else {
                        Vibration.vibrate(50);
                    }
                }

                return next;
            });
        }, 1000);

        // Progress Ring and Watch Hands Animation
        Animated.timing(progressAnim, {
            toValue: 360,
            duration: 60000, 
            easing: Easing.linear,
            useNativeDriver: false,
        }).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(handAnim, { toValue: 1, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
                Animated.timing(handAnim, { toValue: 0, duration: 1200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
            ])
        ).start();

        Animated.loop(
            Animated.sequence([
                Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, }),
                Animated.timing(pulseAnim, { toValue: 1, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true, }),
            ])
        ).start();

        return () => clearInterval(interval);
    }, [currentStep, user]); // Added user to dependency array to satisfy ESLint and ensure re-run if auth state changes

    // --- Interpolations and Calculations (kept original logic) ---

    const handRotate = handAnim.interpolate({
        inputRange: [0, 1],
        outputRange: ["-20deg", "20deg"],
    });

    const radius = SIZE / 2 - 15;
    const circumference = 2 * Math.PI * radius;
    
    const strokeDashoffset = progressAnim.interpolate({
        inputRange: [0, 360],
        outputRange: [circumference, 0],
    });

    const currentStepData = setupSteps[currentStep];
    const progressPercentage = Math.round((seconds / 60) * 100);

    // --- Sub-Components (kept original logic) ---

    const FloatingParticles = () => (
        <View style={styles.particlesContainer}>
            {particleAnimations.map((anim, index) => {
                const translateY = anim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [height + 50, -50],
                });
                
                const translateX = anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, Math.sin(index) * 30, Math.sin(index + 1) * 20],
                });

                const opacity = anim.interpolate({
                    inputRange: [0, 0.1, 0.9, 1],
                    outputRange: [0, 0.8, 0.8, 0],
                });

                const scale = anim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1, 0.3],
                });

                return (
                    <Animated.View
                        key={index}
                        style={[
                            styles.particle,
                            {
                                left: `${5 + index * 8}%`,
                                transform: [
                                    { translateY },
                                    { translateX },
                                    { scale },
                                ],
                                opacity,
                                backgroundColor: index % 2 === 0 ? '#00eaff' : '#FF3B3B',
                            },
                        ]}
                    />
                );
            })}
        </View>
    );

    const EnhancedWatch = () => (
        <Animated.View
            style={[
                styles.watchContainer,
                {
                    transform: [{ scale: pulseAnim }],
                },
            ]}
        >
            <Svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
                <Defs>
                    <SvgLinearGradient id="watchGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor="#00eaff" stopOpacity="0.3" />
                        <Stop offset="70%" stopColor="#00eaff" stopOpacity="0.1" />
                        <Stop offset="100%" stopColor="#00eaff" stopOpacity="0" />
                    </SvgLinearGradient>
                    <SvgLinearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <Stop offset="0%" stopColor={currentStepData.color} stopOpacity="1" />
                        <Stop offset="100%" stopColor="#FF3B3B" stopOpacity="0.8" />
                    </SvgLinearGradient>
                </Defs>

                {/* Glow effect */}
                <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={radius + 20}
                    fill="url(#watchGlow)"
                />

                {/* Outer decorative ring */}
                <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={radius + 10}
                    stroke="rgba(0,234,255,0.2)"
                    strokeWidth={2}
                    fill="none"
                    strokeDasharray="5,5"
                />

                {/* Base ring */}
                <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={radius}
                    stroke="rgba(0,234,255,0.3)"
                    strokeWidth={6}
                    fill="none"
                />

                {/* Progress ring */}
                <AnimatedCircle 
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={radius}
                    stroke="url(#progressGrad)"
                    strokeWidth={8}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
                />

                {/* Center dot */}
                <Circle
                    cx={SIZE / 2}
                    cy={SIZE / 2}
                    r={8}
                    fill={currentStepData.color}
                />

                {/* Watch hands */}
                <G transform={`translate(${SIZE / 2}, ${SIZE / 2})`}>
                    <AnimatedLine
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={-radius * 0.6}
                        stroke="#00eaff"
                        strokeWidth={6}
                        strokeLinecap="round"
                        transform={[{ rotate: handRotate }]}
                    />
                    <AnimatedLine
                        x1={0}
                        y1={0}
                        x2={0}
                        y2={-radius * 0.4}
                        stroke={currentStepData.color}
                        strokeWidth={4}
                        strokeLinecap="round"
                        transform={[{ rotate: handRotate }]}
                    />
                </G>

                {/* Hour markers */}
                {[...Array(12)].map((_, i) => {
                    const angle = (i * 30) * (Math.PI / 180);
                    const x1 = SIZE / 2 + (radius - 15) * Math.cos(angle - Math.PI / 2);
                    const y1 = SIZE / 2 + (radius - 15) * Math.sin(angle - Math.PI / 2);
                    const x2 = SIZE / 2 + (radius - 5) * Math.cos(angle - Math.PI / 2);
                    const y2 = SIZE / 2 + (radius - 5) * Math.sin(angle - Math.PI / 2);

                    return (
                        <Line
                            key={i}
                            x1={x1}
                            y1={y1}
                            x2={x2}
                            y2={y2}
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth={i % 3 === 0 ? 3 : 1}
                        />
                    );
                })}
            </Svg>
        </Animated.View>
    );

    const StepIndicator = () => (
        <View style={styles.stepIndicator}>
            {setupSteps.map((step, index) => (
                <Pressable
                    key={step.id}
                    style={styles.stepItem}
                    onPress={() => showStepTooltip(step)}
                >
                    <Animated.View
                        style={[
                            styles.stepDot,
                            {
                                backgroundColor: index <= currentStep ? step.color : 'rgba(255,255,255,0.2)',
                                transform: [
                                    {
                                        scale: stepAnimations[index]?.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [0.8, 1],
                                        }) || 0.8,
                                    },
                                ],
                            },
                        ]}
                    >
                        <Ionicons 
                            name={step.icon} 
                            size={16} 
                            color={index <= currentStep ? "#fff" : "#888"} 
                        />
                    </Animated.View>
                    <Text style={[
                        styles.stepLabel,
                        { color: index === currentStep ? step.color : '#888' }
                    ]}>
                        {step.title}
                    </Text>
                </Pressable>
            ))}
        </View>
    );

    const Tooltip = () => {
        if (!showTooltip) return null;

        return (
            <Animated.View
                style={[
                    styles.tooltip,
                    {
                        opacity: tooltipAnim,
                        transform: [
                            {
                                scale: tooltipAnim.interpolate({
                                    inputRange: [0, 1],
                                    outputRange: [0.8, 1],
                                }),
                            },
                        ],
                    },
                ]}
            >
                <BlurView intensity={30} style={styles.tooltipBlur}>
                    <Text style={styles.tooltipText}>{tooltipContent}</Text>
                </BlurView>
            </Animated.View>
        );
    };
    
    // --- Main Render ---
    
    return (
        <LinearGradient 
            colors={["#0a0e27", "#16213e", "#1a2332"]} 
            style={styles.container}
        >
            <FloatingParticles />
            
            {/* ScrollView Container for the main content */}
            <AnimatedScrollView
                contentContainerStyle={styles.content} // Content-specific styles here
                style={[ // ScrollView-specific styles (like flex and animation) here
                    {
                        opacity: fadeAnim,
                        transform: [{ translateY: slideAnim }],
                        flexGrow: 1, // Ensures the scroll view can grow
                        width: '100%',
                    },
                ]}
                showsVerticalScrollIndicator={false}
            >
                {/* Enhanced Header */}
                <View style={styles.header}>
                    <Animated.View
                        style={[
                            styles.titleContainer,
                            {
                                transform: [
                                    {
                                        scale: glowAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [1, 1.02],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <Text style={styles.title}>Almost There!</Text>
                        <View style={styles.titleUnderline} />
                    </Animated.View>
                    
                    <Text style={styles.subtitle}>
                        Setting up your premium LuminaN experience
                    </Text>
                </View>

                {/* Enhanced Watch */}
                <EnhancedWatch />

                {/* Progress Info */}
                <View style={styles.progressInfo}>
                    <View style={styles.timerContainer}>
                        <Text style={styles.timer}>{seconds}s</Text>
                        <Text style={styles.timerSeparator}>/</Text>
                        <Text style={styles.timerTotal}>60s</Text>
                        <Text style={styles.percentage}>({progressPercentage}%)</Text>
                    </View>
                    
                    <View style={styles.currentStepContainer}>
                        <View style={[styles.stepIcon, { backgroundColor: `${currentStepData.color}20` }]}>
                            <Ionicons name={currentStepData.icon} size={20} color={currentStepData.color} />
                        </View>
                        <View style={styles.stepText}>
                            <Text style={[styles.stepTitle, { color: currentStepData.color }]}>
                                {currentStepData.title}
                            </Text>
                            <Text style={styles.stepDescription}>
                                {currentStepData.description}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Step Indicator */}
                <StepIndicator />

                {/* Enhanced Note */}
                <View style={styles.noteContainer}>
                    <LinearGradient
                        colors={["rgba(0,234,255,0.1)", "rgba(0,234,255,0.05)"]}
                        style={styles.noteGradient}
                    >
                        <Ionicons name="information-circle" size={20} color="#00eaff" />
                        <Text style={styles.note}>
                            Your account is being secured with enterprise-grade encryption. 
                            Experience the magic of LuminaN!
                        </Text>
                    </LinearGradient>
                </View>

                {/* Skip Button */}
                {canSkip && (
                    <Animated.View
                        style={[
                            styles.skipContainer,
                            {
                                opacity: skipButtonAnim,
                                transform: [
                                    {
                                        translateY: skipButtonAnim.interpolate({
                                            inputRange: [0, 1],
                                            outputRange: [50, 0],
                                        }),
                                    },
                                ],
                            },
                        ]}
                    >
                        <TouchableOpacity
                            style={styles.skipButton}
                            onPress={handleSkip}
                            activeOpacity={0.8}
                        >
                            <LinearGradient
                                colors={["rgba(255,255,255,0.1)", "rgba(255,255,255,0.05)"]}
                                style={styles.skipGradient}
                            >
                                <Ionicons name="play-forward" size={16} color="#888" />
                                <Text style={styles.skipText}>Skip Setup</Text>
                            </LinearGradient>
                        </TouchableOpacity>
                    </Animated.View>
                )}
            </AnimatedScrollView>

            {/* Tooltip */}
            <Tooltip />
        </LinearGradient>
    );
};

export default GettingReadyScreen;

// --- Styles ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "flex-start",
        padding: 20,
    },
    
    // Particles
    particlesContainer: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 0,
    },
    particle: {
        position: "absolute",
        width: 4,
        height: 4,
        borderRadius: 2,
    },
    
    // Content
    content: {
        alignItems: "center",
        width: "100%",
        zIndex: 1,
        paddingBottom: 50,
    },
    
    // --- RESPONSIVE ADJUSTMENTS START HERE ---
    
    // Header: Reduced margins for smaller screens
    header: {
        alignItems: "center",
        marginTop: IS_SMALL_SCREEN ? 10 : 20, 
        marginBottom: IS_SMALL_SCREEN ? 15 : 30, 
    },
    titleContainer: {
        alignItems: "center",
        marginBottom: 8,
    },
    // Title: Reduced font size for smaller screens
    title: {
        color: "#fff",
        fontSize: IS_SMALL_SCREEN ? 28 : 32, // Adaptive size
        fontWeight: "bold",
        textAlign: "center",
        letterSpacing: 1,
        textShadowColor: "rgba(0,234,255,0.3)",
        textShadowOffset: { width: 0, height: 2 },
        textShadowRadius: 10,
    },
    titleUnderline: {
        width: 60,
        height: 3,
        backgroundColor: "#00eaff",
        borderRadius: 2,
        marginTop: 8,
    },
    subtitle: {
        color: "#888",
        fontSize: 16,
        textAlign: "center",
        letterSpacing: 0.5,
    },
    
    // Watch: Reduced vertical margins for smaller screens
    watchContainer: {
        marginVertical: IS_SMALL_SCREEN ? 15 : 30, // Adaptive size
        alignItems: "center",
        justifyContent: "center",
    },
    
    // Progress Info: Reduced margins for smaller screens
    progressInfo: {
        alignItems: "center",
        marginBottom: IS_SMALL_SCREEN ? 15 : 30, // Adaptive size
        width: "100%",
    },
    timerContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        marginBottom: 20,
    },
    // Timer: Reduced font size for smaller screens
    timer: {
        color: "#00eaff",
        fontSize: IS_SMALL_SCREEN ? 24 : 28, // Adaptive size
        fontWeight: "bold",
    },
    timerSeparator: {
        color: "#888",
        fontSize: 20,
        marginHorizontal: 8,
    },
    timerTotal: {
        color: "#888",
        fontSize: 20,
    },
    percentage: {
        color: "#00eaff",
        fontSize: 16,
        marginLeft: 8,
        fontWeight: "600",
    },
    
    // Current Step (no significant changes needed, layout is flexible)
    currentStepContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "rgba(255,255,255,0.05)",
        borderRadius: 16,
        padding: 16,
        width: "100%",
        borderWidth: 1,
        borderColor: "rgba(0,234,255,0.2)",
    },
    stepIcon: {
        width: 40,
        height: 40,
        borderRadius: 20,
        justifyContent: "center",
        alignItems: "center",
        marginRight: 12,
    },
    stepText: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: "bold",
        marginBottom: 2,
    },
    stepDescription: {
        color: "#888",
        fontSize: 14,
        lineHeight: 18,
    },
    
    // Step Indicator: Improved horizontal distribution and label handling
    stepIndicator: {
        flexDirection: "row",
        justifyContent: "space-around", // Use space-around for better spacing
        width: "100%",
        marginBottom: 30,
        paddingHorizontal: 0, // Removed padding to maximize available width
    },
    stepItem: {
        alignItems: "center",
        // Removed flex: 1 to let content determine item width, rely on 'space-around'
    },
    stepDot: {
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: "center",
        alignItems: "center",
        marginBottom: 8,
        borderWidth: 2,
        borderColor: "rgba(255,255,255,0.1)",
    },
    stepLabel: {
        fontSize: 10,
        fontWeight: "600",
        textAlign: "center",
        maxWidth: 70, // Added max-width to slightly limit the label text area
    },
    
    // Note (no significant changes needed)
    noteContainer: {
        width: "100%",
        borderRadius: 16,
        overflow: "hidden",
        marginBottom: 20,
    },
    noteGradient: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        borderWidth: 1,
        borderColor: "rgba(0,234,255,0.2)",
    },
    note: {
        color: "#e5e5e5",
        fontSize: 14,
        lineHeight: 20,
        marginLeft: 12,
        flex: 1,
    },
    
    // Skip Button (no significant changes needed)
    skipContainer: {
        width: "100%",
        alignItems: "center",
        marginBottom: 20,
    },
    skipButton: {
        borderRadius: 12,
        overflow: "hidden",
    },
    skipGradient: {
        flexDirection: "row",
        alignItems: "center",
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderWidth: 1,
        borderColor: "rgba(255,255,255,0.2)",
    },
    skipText: {
        color: "#888",
        fontSize: 14,
        fontWeight: "600",
        marginLeft: 8,
    },
    
    // Tooltip (no significant changes needed)
    tooltip: {
        position: "absolute",
        top: "40%",
        left: 20,
        right: 20,
        zIndex: 1000,
        borderRadius: 16,
        overflow: "hidden",
    },
    tooltipBlur: {
        padding: 16,
        backgroundColor: "rgba(0,0,0,0.8)",
    },
    tooltipText: {
        color: "#fff",
        fontSize: 14,
        textAlign: "center",
        lineHeight: 20,
    },
});