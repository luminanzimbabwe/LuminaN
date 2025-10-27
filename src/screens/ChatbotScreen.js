import React, { useState, useRef, useEffect, useCallback } from "react";
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TextInput,
    TouchableOpacity,
    Animated,
    Dimensions,
    Platform,
    Linking,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Rect, Text as SvgText, Defs, RadialGradient, Stop } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import { BASE_URL, ENDPOINTS } from "../config/api.config";

const { width, height } = Dimensions.get("window");

// --- PLACEHOLDER FOR GEMINI API SETUP ---
// const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY"; // REPLACE WITH YOUR ACTUAL KEY
// const ai = new GoogleGenAI(GEMINI_API_KEY);

// --- LOGO COMPONENT --- (Keep as is)
const Logo = () => (
    <Svg width="40" height="40" viewBox="0 0 100 100">
        <Defs>
            <RadialGradient id="grad1" cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor="#00eaff" />
                <Stop offset="100%" stopColor="#00baff" />
            </RadialGradient>
        </Defs>
        {/* Placeholder: Use SvgText for SVG components */}
        <Rect width="100" height="100" rx="20" fill="url(#grad1)" />
        <SvgText x="50" y="35" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#0a0e27">L</SvgText>
        <SvgText x="50" y="55" textAnchor="middle" fontSize="20" fontWeight="bold" fill="#0a0e27">N</SvgText>
    </Svg>
);

// --- CONTEXT STATES (Simplified) --- (Keep as is)
const CONTEXT_STATES = {
    INITIAL: 'INITIAL',
    AWAITING_FOLLOWUP: 'AWAITING_FOLLOWUP',
};

// --- CONSOLIDATED MULTI-LINGUAL KNOWLEDGE BASE --- (Keep as is)
const KNOWLEDGE_BASE = {
    // ... (Your entire KNOWLEDGE_BASE object goes here) ...
    // Note: I'll include just a few to keep the response short, but use your full list.
    initial: {
        en: "Hi! I'm PrivateZen, your guide to gas services. I can assist you in **English, Shona, or Ndebele**. Please start chatting in your preferred language about your gas needs! 🇿🇼",
        sn: "Mhoro! Ndini PrivateZen, mutungamiri wenyu kune gasi. Tanga kutaura neMutauro waunoda nezvegasi!",
        nd: "Sawubona! NginguPrivateZen, umqondisi wakho wegesi. Qala ukukhuluma ngolimi olukhethayo mayelana legesi!",
    },
    greetings: {
        en: "Hello! Welcome! What information do you need today? 😊",
        sn: "Mhoro! Mauya! Ndeipi ruzivo rwamunoda nhasi? 😊",
        nd: "Sawubona! Wamukelekile! Ulwazi olunjani oludingayo lamuhla? 😊",
    },
    order: {
        en: "To place a gas order:\n1. Open the main **Order** tab in the app.\n2. Select your required **Cylinder Size**.\n3. Choose **Refill** or **Swap/New Cylinder**.\n4. Enter your **address and payment method**.\n\nAlternatively, you can call us directly at **0785748130/29**.",
        sn: "Kuti mu-order gasi:\n1. Vhura iyo main **Order** tab mu-app. 2. Sarudza **size ye cylinder** (5kg, 9kg, etc.) yamunoda. 3. Sarudza **Refill** kana **Swap/Cylinder Itsva**.\n\nKana kuti, fonera **0785748130/29**.",
        nd: "Uku-oda igesi:\n1. Vula i **Order** tab enkulu ku-app. 2. Khetha **ubukhulu be-cylinder** (5kg, 9kg, njl.) oludingayo. 3. Khetha **Ukugcwalisa (Refill)** loba **Ukutshintsha/Cylinder Entsha**.\n\nLoba, shayela ngqo ku **0785748130/29**.",
    },
    // ... (rest of KNOWLEDGE_BASE)
    support_options: {
        en: "For support: Call **0785748130/29** for urgent issues or human help. Email **support@luminan.co.zw** for non-urgent queries.",
        sn: "Kuti uwane support: Fonera **0785748130/29** kune zvinodhaka. Email **support@luminan.co.zw**.",
        nd: "Ngosizo: Shayela **0785748130/29** ngezinkinga eziphuthumayo. I-email **support@luminan.co.zw**.",
    },
    clarification: {
        en: "I'm here to provide instructions and information. Please use keywords like **Order, Prices, Delivery, or Safety**.",
        sn: "Ndapota, bvunza nezve **How to Order, Mitengo, kana Delivery**!",
        nd: "Sicela ubuze imibuzo nge **Uku-Oda, Amanani, loba i-Delivery**!",
    },
};

// --- HELPER FUNCTIONS ---

// 1. Language Detection & Extraction (Simplified)
// A real LLM can detect the language from the prompt. We'll use a simple rule-based approach first.
const detectLanguage = (text) => {
    const lowerText = text.toLowerCase();
    if (lowerText.includes("mhoro") || lowerText.includes("shona") || lowerText.includes("ndabata")) return 'sn';
    if (lowerText.includes("sawubona") || lowerText.includes("ndebele") || lowerText.includes("ngiyeswa")) return 'nd';
    return 'en'; // Default to English
};

// 2. Keyword/Intent Matcher (Now more like a Tool-Selector)
const findBestIntent = (text) => {
    const lowerText = text.toLowerCase();

    if (lowerText.includes("order") || lowerText.includes("how to buy") || lowerText.includes("ndingatenga sei")) return 'order';
    if (lowerText.includes("price") || lowerText.includes("cost") || lowerText.includes("mitengo") || lowerText.includes("amanani")) return 'prices';
    if (lowerText.includes("delivery") || lowerText.includes("nguva") || lowerText.includes("kusvitsa")) return 'delivery';
    if (lowerText.includes("safety") || lowerText.includes("leak") || lowerText.includes("kuchengetedza")) return 'cylinder_safety_checks';
    if (lowerText.includes("support") || lowerText.includes("help") || lowerText.includes("fonera")) return 'support_options';
    if (lowerText.includes("who made you") || lowerText.includes("isaac") || lowerText.includes("luminan")) return 'about';
    if (lowerText.includes("emergency") || lowerText.includes("moto")) return 'emergency';

    return null; // No direct match, needs LLM processing
};

// 3. ChatGPT API Call
const callChatGPTAPI = async (userMessage) => {
    try {
        const response = await fetch(`${BASE_URL}${ENDPOINTS.CHATBOT.CHAT_GPT}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ message: userMessage }),
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.status}`);
        }

        const data = await response.json();
        return data.reply;
    } catch (error) {
        console.error("ChatGPT API Error:", error);
        return "Sorry, I'm having trouble connecting right now. Please try again later or contact support at 0785748130.";
    }
};

// --- CHATBOT LOGIC (THE BRAIN) ---
const processMessage = async (text) => {
    // Use ChatGPT API for all responses
    const botResponse = await callChatGPTAPI(text);
    return botResponse;
};


// --- MAIN CHATBOT COMPONENT (Keep rendering logic as is) ---
const Chatbot = () => {
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [currentContext, setCurrentContext] = useState(CONTEXT_STATES.INITIAL);
    const [currentLanguage, setCurrentLanguage] = useState('en');
    const [isTyping, setIsTyping] = useState(false);
    const flatListRef = useRef(null);
    const fadeAnim = useRef(new Animated.Value(0)).current;

    // ... (Your useEffect for initial message and other hooks remain) ...
    useEffect(() => {
        // Initial bot message on load
        const initialLanguage = detectLanguage("Hi");
        const initialText = KNOWLEDGE_BASE.initial[initialLanguage];
        setCurrentLanguage(initialLanguage);
        
        setMessages([
            {
                id: Date.now().toString() + 'bot',
                text: initialText,
                sender: "bot",
                timestamp: Date.now(),
            },
        ]);

        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
        }).start();
    }, []);

    useEffect(() => {
        if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: true });
        }
    }, [messages]);


    const handleSend = useCallback(async () => {
        if (inputText.trim() === "") return;

        const newUserMessage = {
            id: Date.now().toString() + 'user',
            text: inputText.trim(),
            sender: "user",
            timestamp: Date.now(),
        };

        // 1. Add user message
        setMessages((prevMessages) => [...prevMessages, newUserMessage]);
        
        // 2. Clear input and show typing indicator
        setInputText("");
        setIsTyping(true);

        // 3. Update language based on user's current message
        const detectedLang = detectLanguage(newUserMessage.text);
        setCurrentLanguage(detectedLang);

        // 4. *** THE NEW API PROCESSING STEP ***
        const botResponseText = await processMessage(newUserMessage.text);
        // ***************************************

        // 5. Add bot message
        setIsTyping(false);
        const newBotMessage = {
            id: Date.now().toString() + 'bot',
            text: botResponseText,
            sender: "bot",
            timestamp: Date.now() + 1,
        };

        setMessages((prevMessages) => [...prevMessages, newBotMessage]);
    }, [inputText, messages]);
    
    // ... (Rest of the component: renderMessage, TypingIndicator, styles, etc. - should be similar to your original code, just use SvgText instead of Text inside Svg)
    
    // --- MESSAGE RENDERING ---
    const renderMessage = ({ item }) => {
        const isUser = item.sender === "user";
        const messageStyle = isUser ? styles.userMessage : styles.botMessage;
        const textStyle = isUser ? styles.userText : styles.botText;
        const wrapperStyle = isUser ? styles.userWrapper : styles.botWrapper;
        const timestamp = new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        return (
            <View style={wrapperStyle}>
                <View style={[messageStyle, isUser ? styles.userColor : styles.botColor]}>
                    <Text style={textStyle}>{item.text}</Text>
                    <Text style={[styles.timestamp, isUser ? styles.userTimestamp : styles.botTimestamp]}>
                        {timestamp}
                    </Text>
                </View>
                {!isUser && (
                    <View style={styles.avatar}>
                        <Logo />
                    </View>
                )}
            </View>
        );
    };
    
    // --- TYPING INDICATOR ---
    const TypingIndicator = () => (
        <View style={styles.botWrapper}>
            <View style={[styles.botMessage, styles.botColor, { maxWidth: 80, paddingVertical: 10 }]}>
                <Animated.View style={{ opacity: fadeAnim }}>
                    <Text style={styles.botText}>...</Text>
                </Animated.View>
            </View>
            <View style={styles.avatar}><Logo /></View>
        </View>
    );

    // --- MAIN RENDER ---
    return (
        <LinearGradient
            colors={["#0a0e27", "#1e2a4a"]}
            style={styles.container}
        >
            {/* Header/Top Bar (Optional) */}
            <View style={styles.header}>
                <Text style={styles.headerTitle}>PrivateZen Chatbot</Text>
            </View>

            {/* Message List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderMessage}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.messagesContainer}
            />

            {/* Typing Indicator */}
            {isTyping && <TypingIndicator />}

            {/* Input Area */}
            <View style={styles.inputContainer}>
                <TextInput
                    style={styles.textInput}
                    value={inputText}
                    onChangeText={setInputText}
                    placeholder={`Type your message in ${currentLanguage === 'sn' ? 'Shona' : currentLanguage === 'nd' ? 'Ndebele' : 'English'}...`}
                    placeholderTextColor="#999"
                    multiline
                />
                <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={isTyping || inputText.trim() === ""}>
                    <Ionicons name="send" size={24} color="#0a0e27" />
                </TouchableOpacity>
            </View>
        </LinearGradient>
    );
};

// --- STYLES (Adjusted for better dark mode look) ---
const styles = StyleSheet.create({
    container: {
        flex: 1,
        paddingTop: Platform.OS === 'ios' ? 50 : 30,
    },
    header: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#1e2a4a',
        backgroundColor: 'rgba(0, 0, 0, 0.2)',
        alignItems: 'center',
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#00eaff',
    },
    messagesContainer: {
        paddingHorizontal: 10,
        paddingBottom: 20,
    },
    // User Message Styles
    userWrapper: {
        flexDirection: 'row',
        justifyContent: 'flex-end',
        marginVertical: 5,
    },
    userMessage: {
        maxWidth: width * 0.75,
        padding: 12,
        borderRadius: 15,
        borderTopRightRadius: 2,
        elevation: 1,
    },
    userColor: {
        backgroundColor: '#00baff', // Bright blue
    },
    userText: {
        color: '#0a0e27',
        fontSize: 15,
    },
    userTimestamp: {
        color: 'rgba(10, 14, 39, 0.7)',
    },
    // Bot Message Styles
    botWrapper: {
        flexDirection: 'row',
        justifyContent: 'flex-start',
        marginVertical: 5,
    },
    botMessage: {
        maxWidth: width * 0.75,
        padding: 12,
        borderRadius: 15,
        borderTopLeftRadius: 2,
        elevation: 1,
        marginLeft: 8,
    },
    botColor: {
        backgroundColor: '#3a4a6e', // Darker slate blue
    },
    botText: {
        color: '#fff',
        fontSize: 15,
    },
    botTimestamp: {
        color: 'rgba(255, 255, 255, 0.5)',
    },
    timestamp: {
        fontSize: 10,
        textAlign: 'right',
        marginTop: 5,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        overflow: 'hidden',
        alignSelf: 'flex-end',
    },
    inputContainer: {
        flexDirection: "row",
        alignItems: "center",
        padding: 10,
        borderTopWidth: 1,
        borderTopColor: '#3a4a6e',
        backgroundColor: '#0a0e27',
    },
    textInput: {
        flex: 1,
        backgroundColor: "#1e2a4a",
        borderRadius: 25,
        paddingHorizontal: 15,
        paddingTop: 10,
        paddingBottom: 10,
        marginRight: 10,
        maxHeight: 100,
        color: '#fff',
        fontSize: 16,
    },
    sendButton: {
        backgroundColor: "#00eaff",
        width: 45,
        height: 45,
        borderRadius: 22.5,
        justifyContent: "center",
        alignItems: "center",
    },
});

export default Chatbot;