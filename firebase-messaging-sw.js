// firebase-messaging-sw.js
// هذا الملف يجب وضعه في جذر المستودع 2026

// استيراد مكتبات Firebase للـ Service Worker
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.1/firebase-messaging-compat.js');

// إعدادات Firebase
const firebaseConfig = {
    apiKey: "AIzaSyD9O_XS5H6Dyxcobatfiynb3yjPgqMPKPg",
    authDomain: "newservereg.firebaseapp.com",
    projectId: "newservereg",
    storageBucket: "newservereg.firebasestorage.app",
    messagingSenderId: "654100030822",
    appId: "1:654100030822:web:326da7f89ca132f83d94a7",
    measurementId: "G-JCYNXK3G8D"
};

// تهيئة Firebase
firebase.initializeApp(firebaseConfig);

// إنشاء messaging instance
const messaging = firebase.messaging();

/**
 * ✅ معالجة الإشعارات في الخلفية
 * تعمل عندما يكون الموقع مغلقًا أو علامة التبويب غير نشطة
 */
messaging.onBackgroundMessage((payload) => {
    console.log('[SW] تلقى إشعار في الخلفية:', payload);

    // استخراج بيانات الإشعار
    const title = payload.notification?.title || payload.data?.title || 'إشعار جديد من EACR';
    const body = payload.notification?.body || payload.data?.body || '';
    const icon = payload.notification?.icon || payload.data?.icon || 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png';
    const badge = 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png';
    const image = payload.notification?.image || payload.data?.image || '';
    const url = payload.data?.url || payload.data?.click_action || '/2026/';
    const tag = payload.data?.tag || 'eacr-' + Date.now();

    // إعدادات الإشعار
    const notificationOptions = {
        body: body,
        icon: icon,
        badge: badge,
        image: image || undefined,
        tag: tag,
        data: {
            url: url,
            ...payload.data
        },
        dir: 'rtl',
        lang: 'ar',
        vibrate: [200, 100, 200, 100, 200],
        requireInteraction: true, // ✅ يبقي الإشعار ظاهرًا حتى يتفاعل المستخدم
        silent: false,
        renotify: true,
        timestamp: Date.now(),
        actions: [
            {
                action: 'open',
                title: '🔍 فتح',
                icon: ''
            },
            {
                action: 'close',
                title: '✕ إغلاق',
                icon: ''
            }
        ]
    };

    // عرض الإشعار
    return self.registration.showNotification(title, notificationOptions);
});

/**
 * ✅ معالجة النقر على الإشعار
 */
self.addEventListener('notificationclick', (event) => {
    console.log('[SW] نقر على الإشعار:', event);

    // إغلاق الإشعار
    event.notification.close();

    // إذا نقر على زر الإغلاق
    if (event.action === 'close') {
        return;
    }

    // الحصول على الرابط
    const urlToOpen = event.notification.data?.url || '/2026/';

    // فتح نافذة جديدة أو التركيز على الموجودة
    event.waitUntil(
        clients.matchAll({
            type: 'window',
            includeUncontrolled: true
        }).then((windowClients) => {
            // البحث عن نافذة مفتوحة
            for (const client of windowClients) {
                if (client.url.includes('/2026/') && 'focus' in client) {
                    return client.focus();
                }
            }
            // فتح نافذة جديدة
            if (clients.openWindow) {
                return clients.openWindow(urlToOpen);
            }
        })
    );
});

/**
 * ✅ عند تثبيت Service Worker
 */
self.addEventListener('install', (event) => {
    console.log('[SW] تم التثبيت');
    self.skipWaiting(); // تفعيل فوري
});

/**
 * ✅ عند تفعيل Service Worker
 */
self.addEventListener('activate', (event) => {
    console.log('[SW] تم التفعيل');
    event.waitUntil(clients.claim()); // السيطرة على كل الصفحات
});

/**
 * ✅ معالجة Push API (للإشعارات من الخادم)
 */
self.addEventListener('push', (event) => {
    console.log('[SW] تلقى Push:', event);

    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = {
                title: 'إشعار',
                body: event.data.text()
            };
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
