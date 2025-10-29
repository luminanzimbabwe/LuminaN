import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL, ENDPOINTS } from '../config/api.config';

const ACCESS_TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

// Global token variable for synchronous interceptor
let currentToken = null;

// --- Axios Instance ---
const axiosInstance = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
});

// Initialize token on first request
let tokenInitialized = false;
const initializeToken = async () => {
  if (tokenInitialized) return;
  try {
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    currentToken = token;
    tokenInitialized = true;
  } catch (err) {
    console.warn('[API] Failed to initialize token', err);
  }
};

// --- Request Interceptor ---
axiosInstance.interceptors.request.use(
  async (config) => {
    await initializeToken(); // Ensure token is initialized before first request
    let token = currentToken;
    if (!token) {
      try {
        token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
        currentToken = token;
      } catch (err) {
        console.warn('[API] Failed to get token from storage', err);
      }
    }
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
      // Debug: show that token was attached to request (masked)
      try {
        const masked = `${token.substring(0, 8)}...${token.substring(Math.max(token.length - 8, 0))}`;
        // eslint-disable-next-line no-console
        console.log('[API] Attaching token to request:', masked, '->', config.url);
      } catch (e) {}
    } else {
      // eslint-disable-next-line no-console
      console.log('[API] No token found for request ->', config.url);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// --- Response Interceptor ---
axiosInstance.interceptors.response.use(
  response => response,
  async (error) => {
    console.error(
      `[API Error] Path: ${error.config?.url}`,
      `Status: ${error.response?.status || 'Network Error'}`,
      `Message: ${error.message}`,
      `Data:`, error.response?.data
    );

    // If 401/403 and we have a refresh token, try to refresh
    if ((error.response?.status === 401 || error.response?.status === 403) && error.config) {
      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const refreshed = await apiRefreshToken(refreshToken);
          const newAccess = refreshed?.accessToken ?? refreshed?.access;
          if (newAccess) {
            await AsyncStorage.setItem(ACCESS_TOKEN_KEY, newAccess);
            currentToken = newAccess;
            setApiToken(newAccess);
            // Retry the original request with new token
            error.config.headers['Authorization'] = `Bearer ${newAccess}`;
            return axiosInstance(error.config);
          }
        }
      } catch (refreshError) {
        console.warn('[API] Token refresh failed:', refreshError);
      }
    }

    return Promise.reject(error.response || error);
  }
);

// --- Token Management ---
export const setApiToken = async (token) => {
  if (token) {
    currentToken = token;
    axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // Debug: log token set (masked)
    try {
      const masked = `${token.substring(0, 8)}...${token.substring(Math.max(token.length - 8, 0))}`;
      // eslint-disable-next-line no-console
      console.log('[API] setApiToken called, token set:', masked);
    } catch (e) {}
    await AsyncStorage.setItem(ACCESS_TOKEN_KEY, token);
  } else {
    currentToken = null;
    delete axiosInstance.defaults.headers.common['Authorization'];
    await AsyncStorage.removeItem(ACCESS_TOKEN_KEY);
  }
};

// --- Authentication API Functions ---
export const apiLoginUser = async (identifier, password) => {
  const candidates = [];
  if (ENDPOINTS?.AUTH?.LOGIN) candidates.push(ENDPOINTS.AUTH.LOGIN);
  // Legacy fallback used elsewhere in the project
  candidates.push('user/login/');

  let lastError = null;

  for (const url of candidates) {
    try {
      const resolvedUrl = url.startsWith('http') ? url : `${BASE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
      const response = await axiosInstance.post(resolvedUrl, { identifier, password });
      return response.data;
    } catch (err) {
      lastError = err;
      const status = err?.response?.status;
      // If 404, try next candidate; for other statuses, capture and stop trying
      if (status && status !== 404) break;
      // otherwise continue to next candidate
    }
  }

  // If we get here, all candidates failed
  const data = lastError?.response?.data ?? lastError?.data ?? null;
  console.error('[apiLoginUser] final error:', data || lastError?.message || lastError);
  const message = data?.error || data?.detail || lastError?.message || 'Login failed';
  throw new Error(message);
};

export const apiLogoutUser = async () => {
  try {
    const url = ENDPOINTS?.AUTH?.LOGOUT ?? '/auth/logout';
    const response = await axiosInstance.post(url);
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    return response.data;
  } catch (err) {
    console.warn('[apiLogoutUser] error', err);
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    return null;
  }
};

export const apiDeleteAccount = async (password) => {
  try {
    const url = ENDPOINTS?.AUTH?.DELETE_ACCOUNT ?? '/user/delete';

    // Get stored access token
    const token = await AsyncStorage.getItem(ACCESS_TOKEN_KEY);
    const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`;

    // Debug logging (masked)
    if (token) {
      const masked = `${token.substring(0, 8)}...${token.substring(Math.max(token.length - 8, 0))}`;
      console.log('[apiDeleteAccount] Using token:', masked);
    }
    console.log('[apiDeleteAccount] Deleting account at:', fullUrl);

    // Perform the request
    const response = await axios.delete(fullUrl, {
      data: { password },
      headers: {
        Authorization: token ? `Bearer ${token}` : undefined,
        'Content-Type': 'application/json',
      },
    });

    // On success, clear tokens and user data
    await AsyncStorage.multiRemove([ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
    return response.data;

  } catch (err) {
    console.warn('[apiDeleteAccount] error', err);
    console.log('[apiDeleteAccount] Error response:', err.response?.data);
    throw err;
  }
};

export const apiGetCurrentUser = async (token) => {
  if (token) await setApiToken(token);
  // Ensure we pass a relative path to axiosInstance so instance defaults/interceptors apply
  let url = ENDPOINTS?.AUTH?.PROFILE ?? '/auth/me';
  if (url.startsWith(BASE_URL)) {
    url = url.substring(BASE_URL.length) || '/';
  }
  // Debug
  // eslint-disable-next-line no-console
  console.log('[API] apiGetCurrentUser calling ->', url);
  const response = await axiosInstance.get(url);
  return response.data;
};

export const apiRegisterUser = async (payload) => {
  const url = ENDPOINTS?.AUTH?.REGISTER ?? '/auth/register';
  const response = await axiosInstance.post(url, payload);
  return response.data;
};

export const apiVerifyOtp = async (tempUserId, otpCode) => {
  const url = ENDPOINTS?.AUTH?.VERIFY_OTP ?? '/auth/verify-otp';
  const response = await axiosInstance.post(url, { temp_user_id: tempUserId, otp_code: otpCode });
  return response.data;
};

export const apiRefreshToken = async (refreshToken) => {
  const url = ENDPOINTS?.AUTH?.REFRESH_TOKEN ?? '/auth/refresh-token';
  const response = await axiosInstance.post(url, { refreshToken });
  return response.data;
};

// --- Notifications API ---
export const apiListNotifications = async (params = {}) => {
  let url = ENDPOINTS?.NOTIFICATIONS?.LIST ?? '/notifications/';
  if (url.startsWith(BASE_URL)) url = url.substring(BASE_URL.length) || '/';
  const response = await axiosInstance.get(url, { params });
  return response.data;
};

export const apiMarkNotificationRead = async (notifId) => {
  if (!notifId) throw new Error('notifId required');
  const urlTpl = ENDPOINTS?.NOTIFICATIONS?.MARK_READ;
  const fullUrl = typeof urlTpl === 'function' ? urlTpl(notifId) : (urlTpl ?? `/notifications/${notifId}/read/`);
  const url = fullUrl.startsWith(BASE_URL) ? fullUrl.substring(BASE_URL.length) : fullUrl;
  const response = await axiosInstance.patch(url);
  return response.data;
};

export const apiMarkAllNotificationsRead = async () => {
  let url = ENDPOINTS?.NOTIFICATIONS?.MARK_ALL_READ ?? '/notifications/mark-all-read/';
  if (url.startsWith(BASE_URL)) url = url.substring(BASE_URL.length) || '/';
  const response = await axiosInstance.post(url);
  return response.data;
};

export const apiDeleteNotification = async (notifId) => {
  if (!notifId) throw new Error('notifId required');
  let url = `${ENDPOINTS?.NOTIFICATIONS?.LIST ?? '/notifications/'}${notifId}/`;
  if (url.startsWith(BASE_URL)) url = url.substring(BASE_URL.length) || '/';
  const response = await axiosInstance.delete(url);
  return response.data;
};

// --- Orders API ---
export const apiListUserOrders = async (params = {}) => {
  let url = ENDPOINTS?.ORDERS?.LIST_USER ?? '/orders/my-orders/';
  if (url.startsWith(BASE_URL)) url = url.substring(BASE_URL.length) || '/';
  const response = await axiosInstance.get(url, { params });
  return response.data;
};

export const apiGetOrderDetail = async (orderId) => {
  if (!orderId) throw new Error('orderId required');
  const urlTpl = ENDPOINTS?.ORDERS?.DETAIL;
  const fullUrl = typeof urlTpl === 'function' ? urlTpl(orderId) : (urlTpl ?? `/orders/${orderId}/`);
  const url = fullUrl.startsWith(BASE_URL) ? fullUrl.substring(BASE_URL.length) : fullUrl;
  const response = await axiosInstance.get(url);
  return response.data;
};

export const apiCancelOrder = async (orderId) => {
  if (!orderId) throw new Error('orderId required');
  const urlTpl = ENDPOINTS?.ORDERS?.CANCEL;
  const fullUrl = typeof urlTpl === 'function' ? urlTpl(orderId) : (urlTpl ?? `/orders/${orderId}/cancel/`);
  const url = fullUrl.startsWith(BASE_URL) ? fullUrl.substring(BASE_URL.length) : fullUrl;
  const response = await axiosInstance.post(url);
  return response.data;
};

export const apiTrackOrder = async (orderId) => {
  if (!orderId) throw new Error('orderId required');
  const urlTpl = ENDPOINTS?.ORDERS?.TRACK;
  const fullUrl = typeof urlTpl === 'function' ? urlTpl(orderId) : (urlTpl ?? `/orders/${orderId}/track/`);
  const url = fullUrl.startsWith(BASE_URL) ? fullUrl.substring(BASE_URL.length) : fullUrl;
  const response = await axiosInstance.get(url);
  return response.data;
};

export default axiosInstance;
