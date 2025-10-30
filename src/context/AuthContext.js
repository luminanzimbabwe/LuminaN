import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  apiLoginUser,
  apiLogoutUser,
  apiGetCurrentUser,
  apiRegisterUser,
  apiVerifyOtp,
  apiRefreshToken,
  setApiToken
} from '../services/auth.service';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const SETUP_COMPLETE_KEY = 'setupComplete';
const TEMP_USER_KEY = 'tempUser';
const USER_KEY = 'user';

const AuthContext = createContext(null);

const extractTokensAndUser = (response) => {
  if (!response) return { accessToken: null, refreshToken: null, user: null };
  const accessToken = response.accessToken ?? response.access ?? response?.tokens?.access ?? null;
  const refreshToken = response.refreshToken ?? response.refresh ?? response?.tokens?.refresh ?? null;
  const user = response.user ?? null;
  return { accessToken, refreshToken, user };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tempUser, setTempUser] = useState(null);
  const [isSetupComplete, setIsSetupComplete] = useState(false);

  const isAuthenticated = !!user;

  const loadUserSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const [storedAccessToken, storedRefreshToken, storedSetupStatus, storedTempUser, storedUser] = await Promise.all([
        AsyncStorage.getItem(ACCESS_TOKEN_KEY),
        AsyncStorage.getItem(REFRESH_TOKEN_KEY),
        AsyncStorage.getItem(SETUP_COMPLETE_KEY),
        AsyncStorage.getItem(TEMP_USER_KEY),
        AsyncStorage.getItem(USER_KEY),
      ]);

      setIsSetupComplete(storedSetupStatus === 'true');
      if (storedTempUser) setTempUser(JSON.parse(storedTempUser));

      
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch {
          
          await AsyncStorage.removeItem(USER_KEY);
        }
      }

      
      if (storedAccessToken) {
        try {
          const userData = await apiGetCurrentUser(storedAccessToken);
          setToken(storedAccessToken);
          setApiToken(storedAccessToken);
          const storedUserObj = storedUser ? JSON.parse(storedUser) : {};
          const mergedUser = { ...storedUserObj, ...userData };
          setUser(mergedUser);
          await AsyncStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
         
          console.log('[Auth] Restored access token and user:', userData?.username || userData?.email || userData?.id);
          return;
        } catch (err) {
          if (err.response?.status === 401 || err.response?.status === 403) {
            console.warn('Access token invalid');
          } else if (err.code === 'ECONNABORTED' || err.message === 'Network Error' || !err.response) {
            console.warn('Offline or network error, keeping stored user');
            
            const storedUserObj = storedUser ? JSON.parse(storedUser) : {};
            setUser(storedUserObj);
            setToken(storedAccessToken);
            setApiToken(storedAccessToken);
            return;
          } else {
            console.warn('Other error, treating as invalid');
          }
        }
      }

      if (storedRefreshToken) {
        try {
          // Pass storedRefreshToken in request body for refresh
          const refreshed = await apiRefreshToken(storedRefreshToken);
          const newAccess = refreshed?.accessToken ?? refreshed?.access;
          if (newAccess) {
            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
            const userData = refreshed.user ?? await apiGetCurrentUser(newAccess);
            setToken(newAccess);
            setApiToken(newAccess);

            const storedUserObj = storedUser ? JSON.parse(storedUser) : {};
            const mergedUser = { ...storedUserObj, ...userData };
            setUser(mergedUser);
            await AsyncStorage.setItem(USER_KEY, JSON.stringify(mergedUser));
            return;
          }
        } catch {
          console.warn('Refresh token invalid');
          await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SETUP_COMPLETE_KEY]);
        }
      }

      
      setToken(null);
      setIsSetupComplete(false);
    } catch (err) {
      console.error('Failed to load session', err);
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SETUP_COMPLETE_KEY, TEMP_USER_KEY, USER_KEY]);
      setToken(null);
      setUser(null);
      setTempUser(null);
      setIsSetupComplete(false);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { loadUserSession(); }, [loadUserSession]);

  const login = async (identifier, password) => {
    try {
      const response = await apiLoginUser(identifier, password);
      console.log('Login response:', response); 

      const { accessToken, refreshToken, user: userData } = extractTokensAndUser(response);
      if (!accessToken || !refreshToken) throw new Error(response.error || 'Login failed');

      await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
      await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
      setToken(accessToken);
      setApiToken(accessToken);
      setUser(userData);

  console.log('[Auth] login stored tokens and setUser for', userData?.username || userData?.email || userData?.id);

      return userData;
    } catch (err) {
      throw new Error(err.message || 'Login failed');
    }
  };

  const logout = useCallback(async () => {
    setIsLoading(true);
    try { await apiLogoutUser(); } catch {} finally {
      await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, SETUP_COMPLETE_KEY, TEMP_USER_KEY, USER_KEY]);
      setToken(null);
      setUser(null);
      setTempUser(null);
      setIsSetupComplete(false);
      setIsLoading(false);
     
    }
  }, []);

  const register = async (payload) => {
    const response = await apiRegisterUser(payload);
    if (response?.tempUser) {
      setTempUser(response.tempUser);
      await AsyncStorage.setItem(TEMP_USER_KEY, JSON.stringify(response.tempUser));
    }
    return response;
  };

  const persistTempUser = async (tempUserObj) => {
    if (!tempUserObj) return;
    setTempUser(tempUserObj);
    await AsyncStorage.setItem(TEMP_USER_KEY, JSON.stringify(tempUserObj));
  };

  const verifyOtp = async (tempUserId, otpCode) => {
    const response = await apiVerifyOtp(tempUserId, otpCode);
    const { accessToken, refreshToken, user: userData } = extractTokensAndUser(response);
    if (!accessToken || !refreshToken) throw new Error('Verification failed');

    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    await AsyncStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(userData));
    await AsyncStorage.removeItem(TEMP_USER_KEY);

    setToken(accessToken);
    setApiToken(accessToken);
    setUser(userData);
    setTempUser(null);

    return userData;
  };

  const markSetupComplete = async () => {
    if (!user || !token) return;
    await AsyncStorage.setItem(SETUP_COMPLETE_KEY, 'true');
    setIsSetupComplete(true);
    setUser(prev => ({ ...prev, setupComplete: true }));
  };

  const updateUserProfile = async (updates) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    await AsyncStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated, isLoading, user, token, tempUser, isSetupComplete,
      login, logout, register, verifyOtp, markSetupComplete, persistTempUser, updateUserProfile,
      setToken, setApiToken, setUser
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
