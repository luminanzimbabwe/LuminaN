import React, { createContext, useState, useContext, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [authToken, setAuthToken] = useState(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFirstTime, setIsFirstTime] = useState(false); // 👈 NEW FLAG
  const BACKEND_URL = "https://backend-luminan.onrender.com";

  /** Sign in: stores auth token and user */
  const signIn = async (token, userData, firstTime = false) => {
    if (!token || !userData) return;

    setAuthToken(token);
    setUser(userData);
    setIsFirstTime(firstTime); // 👈 set onboarding flag

    await AsyncStorage.setItem("authToken", token);
    await AsyncStorage.setItem("userData", JSON.stringify(userData));

    // Persist firstTime flag only if it's true
    if (firstTime) {
      await AsyncStorage.setItem("isFirstTime", "true");
    }
  };

  /** Sign out */
  const signOut = async () => {
    setAuthToken(null);
    setUser(null);
    setIsFirstTime(false);

    await AsyncStorage.removeItem("authToken");
    await AsyncStorage.removeItem("userData");
    await AsyncStorage.removeItem("isFirstTime");
  };

  /** Mark onboarding complete */
  const markOnboardingComplete = async () => {
    setIsFirstTime(false);
    await AsyncStorage.setItem("isFirstTime", "false");
  };

  /** Validate token with backend */
  const validateToken = async (token) => {
    try {
      const res = await fetch(`${BACKEND_URL}/profile/`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      if (!res.ok) return false;

      const data = await res.json();
      setUser(data); // set user from backend
      return true;
    } catch (err) {
      console.error("Token validation failed:", err);
      return false;
    }
  };

  /** Initialize auth */
  const initAuth = async () => {
    setLoading(true);

    const token = await AsyncStorage.getItem("authToken");
    const savedFirstTime = await AsyncStorage.getItem("isFirstTime");

    if (token) {
      const valid = await validateToken(token);
      if (valid) {
        setAuthToken(token);
        setIsFirstTime(savedFirstTime === "true"); // restore onboarding state
      } else {
        await signOut();
      }
    } else {
      await signOut();
    }

    setLoading(false);
  };

  useEffect(() => {
    initAuth();
  }, []);

  /** Fetch wrapper for user API calls */
  const fetchUserAPI = async (endpoint, options = {}) => {
    if (!authToken) throw new Error("User not signed in");

    const method = options.method || "GET";
    try {
      const res = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
          ...options.headers,
        },
        body:
          method !== "GET" && options.body
            ? JSON.stringify(options.body)
            : null,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || "Request failed");
      }

      return res.json();
    } catch (error) {
      console.error("Fetch request failed:", error);
      throw error;
    }
  };

  const isLoggedIn = !!authToken;

  return (
    <AuthContext.Provider
      value={{
        authToken,
        user,
        loading,
        isLoggedIn,
        isFirstTime,              // 👈 flag
        signIn,
        signOut,
        fetchUserAPI,
        initAuth,
        markOnboardingComplete,   // 👈 clean exposed fn
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/** Custom hook */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
