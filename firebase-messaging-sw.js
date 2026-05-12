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
    
    const notificationTitle = payload.notification?.title || 'إشعار جديد';
    const notificationOptions = {
        body: payload.notification?.body || '',
        icon: payload.notification?.icon || 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
        badge: 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
        tag: payload.data?.tag || 'eacr',
        data: payload.data || {},
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200],
        requireInteraction: true,
        actions: [
            { action: 'open', title: 'فتح' },
            { action: 'close', title: 'إغلاق' }
        ]
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    if (event.action === 'close') return;
    
    const urlToOpen = event.notification.data?.url || '/';
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clients => {
            for (const client of clients) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(urlToOpen);
        })
    );
});
