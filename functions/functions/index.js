const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

/**
 * ✅ ترسل إشعار لكل المستخدمين عند نشر محتوى جديد في Realtime Database
 * المسار المراقب: /contents/{sectionId}/{contentId}
 */
exports.sendNotificationOnNewContent = functions.database
    .ref('/contents/{sectionId}/{contentId}')
    .onCreate(async (snapshot, context) => {
        
        const content = snapshot.val();
        const sectionId = context.params.sectionId;
        const contentId = context.params.contentId;
        
        console.log('📝 محتوى جديد منشور:', {
            title: content.title,
            sectionId: sectionId,
            contentId: contentId
        });
        
        // جلب اسم القسم من Realtime Database
        let sectionName = 'عام';
        try {
            const sectionSnap = await admin.database()
                .ref(`/sections/${sectionId}`)
                .once('value');
            const section = sectionSnap.val();
            if (section && section.name) {
                sectionName = section.name;
            }
        } catch (error) {
            console.error('⚠️ خطأ في جلب اسم القسم:', error);
        }
        
        // تحضير عنوان الإشعار
        const notificationTitle = `📢 ${sectionName}: ${content.title || 'محتوى جديد'}`;
        
        // تحضير نص الإشعار
        let notificationBody = 'تم نشر محتوى جديد على المنصة';
        if (content.text) {
            // إزالة وسوم HTML
            const cleanText = content.text.replace(/<[^>]*>/g, '').trim();
            notificationBody = cleanText.length > 150 
                ? cleanText.substring(0, 150) + '...'
                : cleanText;
        }
        
        // رابط المحتوى
        const contentUrl = `https://earc-eg.github.io/2026/?s=${sectionId}&c=${contentId}`;
        
        // صورة الإشعار
        const imageUrl = content.image || '';
        
        // ✅ جلب جميع التوكنات النشطة من Firestore
        let tokens = [];
        try {
            const tokensSnapshot = await admin.firestore()
                .collection('push_tokens')
                .where('is_active', '==', true)
                .get();
            
            tokensSnapshot.forEach(doc => {
                const data = doc.data();
                if (data.token) {
                    tokens.push(data.token);
                }
            });
            
            console.log(`👥 تم العثور على ${tokens.length} مشترك نشط`);
        } catch (error) {
            console.error('❌ خطأ في جلب التوكنات:', error);
            return null;
        }
        
        // إذا لم يكن هناك مشتركين
        if (tokens.length === 0) {
            console.log('ℹ️ لا يوجد مشتركين لإرسال الإشعارات لهم');
            return null;
        }
        
        // ✅ إرسال الإشعارات
        try {
            const message = {
                notification: {
                    title: notificationTitle,
                    body: notificationBody,
                    imageUrl: imageUrl || undefined
                },
                data: {
                    url: contentUrl,
                    sectionId: sectionId,
                    contentId: contentId,
                    click_action: contentUrl,
                    tag: `content-${sectionId}-${contentId}`
                },
                webpush: {
                    notification: {
                        icon: 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
                        badge: 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
                        requireInteraction: true,
                        dir: 'rtl',
                        lang: 'ar',
                        vibrate: [200, 100, 200, 100, 200],
                        actions: [
                            { action: 'open', title: '🔍 فتح' },
                            { action: 'close', title: '✕ إغلاق' }
                        ],
                        tag: `content-${sectionId}-${contentId}`,
                        renotify: true
                    },
                    fcmOptions: {
                        link: contentUrl
                    }
                },
                tokens: tokens
            };
            
            const response = await admin.messaging().sendEachForMulticast(message);
            
            console.log('✅ تم إرسال الإشعارات:', {
                success: response.successCount,
                failure: response.failureCount
            });
            
            // تنظيف التوكنات الفاشلة
            if (response.failureCount > 0) {
                const failedTokens = [];
                response.responses.forEach((resp, idx) => {
                    if (!resp.success) {
                        failedTokens.push({
                            token: tokens[idx],
                            error: resp.error?.code || 'unknown'
                        });
                    }
                });
                
                console.log('🧹 تنظيف التوكنات الفاشلة:', failedTokens);
                
                // تعطيل التوكنات الفاشلة في Firestore
                for (const failed of failedTokens) {
                    try {
                        const tokenDoc = await admin.firestore()
                            .collection('push_tokens')
                            .doc(failed.token)
                            .get();
                        
                        if (tokenDoc.exists) {
                            await admin.firestore()
                                .collection('push_tokens')
                                .doc(failed.token)
                                .update({
                                    is_active: false,
                                    error: failed.error,
                                    updated_at: admin.firestore.FieldValue.serverTimestamp()
                                });
                        }
                    } catch (cleanupError) {
                        console.error('خطأ في تنظيف التوكن:', failed.token, cleanupError);
                    }
                }
            }
            
            return {
                success: true,
                totalTokens: tokens.length,
                sent: response.successCount,
                failed: response.failureCount
            };
            
        } catch (error) {
            console.error('❌ خطأ في إرسال الإشعارات:', error);
            return null;
        }
    });

/**
 * ✅ وظيفة لإرسال إشعار يدوي (للاختبار أو الإرسال المخصص)
 */
exports.sendManualNotification = functions.https.onCall(async (data, context) => {
    const { title, body, url, image } = data;
    
    if (!title) {
        throw new functions.https.HttpsError('invalid-argument', 'العنوان مطلوب');
    }
    
    // جلب جميع التوكنات النشطة
    const tokensSnapshot = await admin.firestore()
        .collection('push_tokens')
        .where('is_active', '==', true)
        .get();
    
    const tokens = [];
    tokensSnapshot.forEach(doc => {
        const data = doc.data();
        if (data.token) {
            tokens.push(data.token);
        }
    });
    
    if (tokens.length === 0) {
        return { success: false, message: 'لا يوجد مشتركين' };
    }
    
    const message = {
        notification: {
            title: title,
            body: body || '',
            imageUrl: image || undefined
        },
        data: {
            url: url || 'https://earc-eg.github.io/2026/',
            click_action: url || 'https://earc-eg.github.io/2026/'
        },
        webpush: {
            notification: {
                icon: 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
                badge: 'https://img.icons8.com/ios-filled/100/0a2b3e/cancer-ribbon.png',
                requireInteraction: true,
                dir: 'rtl',
                lang: 'ar',
                vibrate: [200, 100, 200]
            },
            fcmOptions: {
                link: url || 'https://earc-eg.github.io/2026/'
            }
        },
        tokens: tokens
    };
    
    const response = await admin.messaging().sendEachForMulticast(message);
    
    return {
        success: true,
        totalTokens: tokens.length,
        sent: response.successCount,
        failed: response.failureCount
    };
});

/**
 * ✅ تنظيف التوكنات غير النشطة (تعمل يوميًا)
 */
exports.cleanupInactiveTokens = functions.pubsub
    .schedule('every 24 hours')
    .onRun(async (context) => {
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        
        const inactiveTokens = await admin.firestore()
            .collection('push_tokens')
            .where('is_active', '==', false)
            .where('updated_at', '<=', thirtyDaysAgo)
            .get();
        
        const batch = admin.firestore().batch();
        inactiveTokens.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        await batch.commit();
        
        console.log(`🧹 تم حذف ${inactiveTokens.size} توكن غير نشط`);
        return null;
    });
