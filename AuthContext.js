// AuthContext.js
import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, username, email, phone_number, role, verified }
  const [authToken, setAuthToken] = useState(null); // single token
  const [loading, setLoading] = useState(true);

  const BACKEND_URL = "http://localhost:8000";

  /** Load stored auth on app start */
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("authToken");
        const savedUser = await AsyncStorage.getItem("user");

        if (savedToken && savedUser) {
          setAuthToken(savedToken);
          setUser(JSON.parse(savedUser));

          // validate token with backend
          try {
            const res = await fetch(`${BACKEND_URL}/profile/`, {
              headers: { Authorization: `Bearer ${savedToken}` },
            });
            if (!res.ok) {
              console.warn("Invalid token, signing out");
              await signOut();
            } else {
              const data = await res.json();
              const freshUser = data.user || data.profile || data;
              setUser(freshUser);
              await AsyncStorage.setItem("user", JSON.stringify(freshUser));
            }
          } catch {
            console.warn("Backend unreachable, using cached user");
          }
        }
      } catch (e) {
        console.error("Failed to load auth from storage", e);
      } finally {
        setLoading(false);
      }
    };
    loadAuth();
  }, []);

  /** Sign in */
  const signIn = async (token, userData) => {
    if (!token || !userData) return;
    setAuthToken(token);
    setUser(userData);
    try {
      await AsyncStorage.setItem("authToken", token);
      await AsyncStorage.setItem("user", JSON.stringify(userData));
    } catch (e) {
      console.error("Failed to save auth to storage", e);
    }
  };

  /** Sign out */
  const signOut = async () => {
    setAuthToken(null);
    setUser(null);
    try {
      await AsyncStorage.removeItem("authToken");
      await AsyncStorage.removeItem("user");
    } catch (e) {
      console.error("Failed to clear auth storage", e);
    }
  };


  /** Fetch wrapper with auth header */
  const fetchWithAuth = async (url, options = {}) => {
    if (!authToken) throw new Error("No auth token available");

    const res = await fetch(url, {
      ...options,
      headers: { ...options.headers, Authorization: `Bearer ${authToken}` },
    });

    // Sign out if token is invalid
    if (res.status === 401 || res.status === 403) {
      await signOut();
      throw new Error("Unauthorized or expired token");
    }

    return res;
  };

  /** Refresh user profile from backend */
  const refreshUser = async () => {
    if (!authToken) return;
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/profile/`);
      const data = await res.json();
      const latestUser = data.user || data.profile || data;
      setUser(latestUser);
      await AsyncStorage.setItem("user", JSON.stringify(latestUser));
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  const isLoggedIn = !!user && !!authToken;

  return (
    <AuthContext.Provider
      value={{
        user,
        authToken,
        loading,
        isLoggedIn,
        signIn,
        signOut,
        refreshUser,
        fetchWithAuth,
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
