// firebase-messaging-sw.js
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyD9O_XS5H6Dyxcobatfiynb3yjPgqMPKPg",
    authDomain: "newservereg.firebaseapp.com",
    projectId: "newservereg",
    storageBucket: "newservereg.firebasestorage.app",
    messagingSenderId: "654100030822",
    appId: "1:654100030822:web:326da7f89ca132f83d94a7",
    measurementId: "G-JCYNXK3G8D"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    console.log('[SW] إشعار في الخلفية:', payload);
    
    const title = payload.notification?.title || payload.data?.title || 'إشعار جديد';
    const body = payload.notification?.body || payload.data?.body || '';
    
    return self.registration.showNotification(title, {
        body: body,
        icon: 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
        badge: 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
        data: { url: payload.data?.url || '/2026/' },
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200],
        requireInteraction: true
    });
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data?.url || '/2026/';
    event.waitUntil(clients.openWindow(url));
});

self.addEventListener('install', (e) => self.skipWaiting());
self.addEventListener('activate', (e) => e.waitUntil(clients.claim()));
