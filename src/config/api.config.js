// src/config/api.config.js


export const BASE_URL = 'https://backend-luminan.onrender.com/api/v1';

export const WS_BASE_URL = 'wss://backend-luminan.onrender.com';

export const ENDPOINTS = {
  AUTH: {
    REGISTER: 'user/register/',
    VERIFY_OTP: 'user/verify/', 
    LOGIN: 'user/login/',
    LOGOUT: 'user/logout/',
    PROFILE: 'user/profile/',
    REFRESH_TOKEN: 'user/refresh/',
    DELETE_ACCOUNT: '/user/delete-account/',
    FORGOT_PASSWORD: 'user/forgot-password/',
    RESET_PASSWORD: 'user/reset-password/',
  },

  ORDERS: {
    START_QUOTE: 'orders/start/',
    FINALIZE: 'orders/finalize/',
    LIST_USER: 'orders/my-orders/',
    DETAIL: (orderId) => `orders/${orderId}/`,
    CANCEL: (orderId) => `orders/${orderId}/cancel/`,
    TRACK: (orderId) => `orders/${orderId}/track/`,
    STATUS: (orderId) => `orders/${orderId}/status/`,
  },

  NOTIFICATIONS: {
    LIST: 'notifications/',
    MARK_ALL_READ: 'notifications/mark-all-read/',
    MARK_READ: (notifId) => `notifications/${notifId}/read/`,
  },

  UTILITIES: {
    LIST_DRIVERS: 'drivers/list/',
  },

  CHATBOT: {
    CHAT_GPT: 'chat-gpt/',
  },
};
