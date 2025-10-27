import React, { createContext, useContext, useState, useEffect } from 'react';
import { AsyncStorage } from 'react-native';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [tempUser, setTempUser] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  // Debug logging to observe auth state changes
  useEffect(() => {
    console.warn('[AuthContext] state:', {
      token: !!token,
      tokenPreview: token ? String(token).slice(0,8)+'...' : null,
      tempUser,
      isSetupComplete,
    });
  }, [token, tempUser, isSetupComplete]);

  // Ensure token => treat as setup-complete (avoids GettingReady redirect on reload).
  // Adjust this guard if you need real onboarding for new users.
  useEffect(() => {
    if (token && isSetupComplete !== true) {
      // set to true when token exists so AppNavigator will show MainTabs
      setIsSetupComplete(true);
    }
  }, [token, isSetupComplete]);

  // ...existing auth context logic (e.g., login, logout, etc.)...

  const authContextValue = {
    isLoading,
    token,
    tempUser,
    isSetupComplete,
    setToken,
    setTempUser,
    setIsSetupComplete,
    // ...other exposed values...
  };

  return (
    <AuthContext.Provider value={authContextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};