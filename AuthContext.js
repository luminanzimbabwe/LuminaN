import React, { createContext, useState, useEffect, useContext } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null); // { id, username, email, phone_number, role, verified }
  const [authToken, setAuthToken] = useState(null); // Single token
  const [loading, setLoading] = useState(true); // Loading state for auth check

  const BACKEND_URL = "https://backend-luminan.onrender.com";

  // Load stored auth state on app start
  useEffect(() => {
    const loadAuth = async () => {
      try {
        const savedToken = await AsyncStorage.getItem("authToken");
        const savedUser = await AsyncStorage.getItem("user");

        if (savedToken && savedUser) {
          // If token and user data are found, set them to state
          setAuthToken(savedToken);
          setUser(JSON.parse(savedUser));

          // Validate token with backend
          try {
            const res = await fetch(`${BACKEND_URL}/profile/`, {
              headers: { Authorization: `Bearer ${savedToken}` },
            });

            if (!res.ok) {
              console.warn("Invalid token, signing out");
              await signOut();
            } else {
              const data = await res.json();
              const freshUser = data.user || data.profile || data; // Fallback to `data`
              setUser(freshUser);
              await AsyncStorage.setItem("user", JSON.stringify(freshUser)); // Update stored user
            }
          } catch (err) {
            console.warn("Backend unreachable, using cached user", err);
          }
        }
      } catch (e) {
        console.error("Failed to load auth from storage", e);
      } finally {
        setLoading(false); // Set loading to false when auth check is complete
      }
    };

    loadAuth();
  }, []); // Run only on mount

  // Sign in - Save token and user to state and AsyncStorage
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

  // Sign out - Clear token and user from state and AsyncStorage
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

  // Fetch wrapper with auth token included
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

    // Handle non-2xx responses here, if necessary
    if (!res.ok) {
      throw new Error(`Request failed with status ${res.status}`);
    }

    return res;
  };

  // Refresh user profile from the backend
  const refreshUser = async () => {
    if (!authToken) return;
    try {
      const res = await fetchWithAuth(`${BACKEND_URL}/profile/`);
      const data = await res.json();
      const latestUser = data.user || data.profile || data;
      setUser(latestUser);
      await AsyncStorage.setItem("user", JSON.stringify(latestUser)); // Update stored user data
    } catch (e) {
      console.error("Failed to refresh user", e);
    }
  };

  // Check if user is logged in
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

/** Custom hook to use the AuthContext */
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};
