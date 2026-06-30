// ════════════════════════════════════════════════════════════
// SERVICE WORKER DO FIREBASE MESSAGING
// Necessário para notificações push chegarem mesmo com o app fechado.
// ⚠️ Edite os valores abaixo com as MESMAS chaves de js/firebase-config.js
// ════════════════════════════════════════════════════════════

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBlIGffJakruG1rH5w2HDjS-kxLoj1Hti8",
  authDomain: "escala-ccb-1e9fe.firebaseapp.com",
  projectId: "escala-ccb-1e9fe",
  storageBucket: "escala-ccb-1e9fe.firebasestorage.app",
  messagingSenderId: "123319415955",
  appId: "1:123319415955:web:7b7d21b7bb8b8043150966"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  const titulo = payload.notification?.title || 'Escala de Porteiros';
  const opcoes = {
    body: payload.notification?.body || '',
    icon: 'icons/icon-192.png',
    badge: 'icons/icon-96.png'
  };
  self.registration.showNotification(titulo, opcoes);
});
