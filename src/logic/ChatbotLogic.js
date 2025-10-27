import React, { useState, useCallback } from "react";
import { Linking } from "react-native";
import Chatbot from '../screens/ChatbotScreen'; // Import the UI component

// --- CONSTANTS & KNOWLEDGE BASE (THE CHATBOT'S BRAIN) ---
const CHAT_SCREENS = {
    MAIN_MENU: 'MAIN_MENU',
    CHAT_VIEW: 'CHAT_VIEW',
};

const CONTEXT_STATES = {
    INITIAL: 'INITIAL',
    AWAITING_FOLLOWUP: 'AWAITING_FOLLOWUP',
};

// Only includes necessary English content now.
const KNOWLEDGE_BASE_EN = {
    initial: "Hi! I'm PrivateZen, your guide to gas services. I can assist you in **English** (currently). Please start chatting about your gas needs! 🇿🇼",
    greetings: "Hello! Welcome! I'm here to explain how you can order gas or check our services. What information do you need today? 😊",
    
    // ... (All other identity and service responses like isaac_ngirazi, order, delivery, etc., remain here) ...
    isaac_ngirazi: "Isaac Ngirazi is the passionate young Zimbabwean entrepreneur and technologist who conceived and built PrivateZen. ... (full story here)",
    // ...
    
    non_english_feedback: "I appreciate your enthusiasm! I am still working diligently to offer support in **Shona and Ndebele**. For now, please communicate with me in **English**!",
    follow_up: "Great! Do you have any other questions about prices, delivery, or safety, or are you ready to place an order via the app?",
    clarification: "I'm here to provide instructions and information. Please use keywords like **order, price, delivery, or safety**!",
};

// --- UTILITY FUNCTIONS (The same logic as before, using KNOWLEDGE_BASE_EN) ---
const getResponseKey = (text) => {
    // ... (Your existing logic for identifying keywords remains here) ...
};

// --- LOGIC CONTAINER COMPONENT ---
const ChatbotLogicScreen = () => {
    
    // --- STATES ---
    const [chatScreen, setChatScreen] = useState(CHAT_SCREENS.MAIN_MENU);
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState("");
    const [context, setContext] = useState(CONTEXT_STATES.INITIAL);
    const [isTyping, setIsTyping] = useState(false);
    
    // --- MESSAGE HANDLERS (Same as before) ---
    
    const sendInitialGreeting = useCallback(() => {
        // ... (Your existing logic to send initial messages) ...
    }, []);

    const processMessage = useCallback((messageText) => {
        // ... (Your existing logic to process messages and send bot response) ...
    }, []);

    const handleSend = useCallback((textToSend = inputText) => {
        const trimmedText = textToSend.trim();
        if (trimmedText.length === 0) return;

        // 1. Add User Message
        const newUserMessage = {
            id: Date.now(),
            text: trimmedText,
            user: true,
            timestamp: Date.now(),
        };
        setMessages((prev) => [...prev, newUserMessage]);
        setInputText(""); // Clear input

        // 2. Process Bot Response
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            
            // Check for non-English input keywords (A simple check for now)
            const lowerText = trimmedText.toLowerCase();
            if (lowerText.includes('shona') || lowerText.includes('ndebele') || lowerText.includes('tanga') || lowerText.includes('kutaura') || lowerText.includes('qala') || lowerText.includes('ukukhuluma')) {
                 const langFeedbackMessage = {
                    id: Date.now() + 1,
                    text: KNOWLEDGE_BASE_EN.non_english_feedback,
                    user: false,
                    timestamp: Date.now() + 500,
                };
                setMessages((prev) => [...prev, langFeedbackMessage]);

            } else {
                 processMessage(trimmedText);
            }

        }, 1500);

    }, [inputText, processMessage]);

    // --- UI ACTION HANDLERS ---

    const handleMenuSelection = useCallback((key) => {
        if (key === 'Shona' || key === 'Ndebele') {
            // Give feedback for non-English selection (even if button is disabled in UI)
            const langFeedbackMessage = {
                id: Date.now(),
                text: KNOWLEDGE_BASE_EN.non_english_feedback,
                user: false,
                timestamp: Date.now(),
            };
            setMessages([langFeedbackMessage]);
            setChatScreen(CHAT_SCREENS.CHAT_VIEW); 
            return;
        }

        setChatScreen(CHAT_SCREENS.CHAT_VIEW);
        
        setTimeout(() => {
            if (key === 'English') {
                sendInitialGreeting();
            } else if (key === 'features') {
                sendInitialGreeting();
                setTimeout(() => {
                    handleSend('app features'); 
                }, 500); 
            }
        }, 300);
    }, [sendInitialGreeting, handleSend]);

    const handleCallSupport = useCallback(() => {
        Linking.openURL(`tel:0785748130`); // Hardcoded support number
    }, []);

    // --- RENDER ---
    return (
        <Chatbot 
            // States (Props)
            chatScreen={chatScreen}
            messages={messages}
            inputText={inputText}
            isTyping={isTyping}
            knowledgeBase={KNOWLEDGE_BASE_EN}
            
            // Handlers (Callbacks)
            onSetInputText={setInputText}
            onHandleSend={handleSend}
            onSetChatScreen={setChatScreen}
            onHandleMenuSelection={handleMenuSelection}
            onCallSupport={handleCallSupport}
        />
    );
};

export default ChatbotLogicScreen;