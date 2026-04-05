import { initializeApp, getApps } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

// Analytics (僅在客戶端且支援時啟動)
export const analytics = typeof window !== "undefined" ? isSupported().then(yes => yes ? getAnalytics(app) : null) : null;

export const requestForToken = async (retryCount = 0) => {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return null;

  try {
    const messaging = getMessaging(app);
    
    // 1. 請求通知權限
    const status = await Notification.requestPermission();
    if (status !== 'granted') {
      console.warn('Notification permission not granted');
      return null;
    }

    // 2. 等待 Service Worker Ready，確保 Registration 穩定
    // 先註冊（如果尚未註冊）
    await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    // 等待 Ready 狀態
    const registration = await navigator.serviceWorker.ready;

    // 3. 取得 Token 並傳入 registration
    const currentToken = await getToken(messaging, {
      vapidKey: process.env.NEXT_PUBLIC_FIREBASE_VAPID_KEY,
      serviceWorkerRegistration: registration
    });

    if (currentToken) {
      return currentToken;
    } else {
      throw new Error('No registration token available.');
    }
  } catch (error) {
    // 針對 AbortError 或常見推播註冊錯誤進行重試
    const isRetryable = error.name === 'AbortError' || error.message.includes('push service error');
    
    if (isRetryable && retryCount < 3) {
      const nextRetry = retryCount + 1;
      const delay = 1000 * nextRetry;
      console.warn(`FCM Token Error: ${error.message}. Retrying in ${delay}ms... (Attempt ${nextRetry}/3)`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
      return requestForToken(nextRetry);
    }

    console.error('FCM Token Final Error:', error);
    return null;
  }
};

export const onMessageListener = () =>
  new Promise((resolve) => {
    const messaging = getMessaging(app);
    onMessage(messaging, (payload) => resolve(payload));
  });
