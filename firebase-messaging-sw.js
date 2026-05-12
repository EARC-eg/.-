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
    console.log('[SW] Received background message:', payload);
    
    const notificationTitle = payload.notification?.title || payload.data?.title || 'إشعار جديد من EACR';
    const notificationBody = payload.notification?.body || payload.data?.body || '';
    const icon = 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png';
    const badge = 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png';
    const url = payload.data?.url || payload.data?.click_action || '/2026/';

    const notificationOptions = {
        body: notificationBody,
        icon: icon,
        badge: badge,
        tag: payload.data?.tag || 'eacr-' + Date.now(),
        data: { url: url, ...payload.data },
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true,
        silent: false,
        renotify: true,
        actions: [
            { action: 'open', title: '🔍 فتح' },
            { action: 'close', title: '✕ إغلاق' }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'close') return;
    
    const urlToOpen = event.notification.data?.url || '/2026/';
    
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(windowClients => {
            for (const client of windowClients) {
                if (client.url.includes('/2026') && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

self.addEventListener('install', (event) => {
    console.log('[SW] Installed');
    self.skipWaiting();
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activated');
    event.waitUntil(clients.claim());
});

self.addEventListener('push', (event) => {
    console.log('[SW] Push received:', event);
    
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: 'إشعار جديد', body: event.data.text() };
        }
    }
    
    const options = {
        body: data.body || '',
        icon: data.icon || 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
        badge: 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
        vibrate: [200, 100, 200],
        data: data.data || {},
        requireInteraction: true,
        dir: 'rtl',
        lang: 'ar'
    };
    
    event.waitUntil(
        self.registration.showNotification(data.title || 'إشعار جديد', options)
    );
});
