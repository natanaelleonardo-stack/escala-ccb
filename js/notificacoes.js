// ════════════════════════════════════════════════════════════
// NOTIFICAÇÕES PUSH — Firebase Cloud Messaging (FCM)
// ════════════════════════════════════════════════════════════

const Notificacoes = {
  messaging: null,
  suportado: false,

  init() {
    try {
      if (!('Notification' in window)) {
        console.log('[FCM] Notificações não suportadas neste navegador.');
        this.suportado = false;
        return;
      }
      if (typeof firebase === 'undefined' || !firebase.messaging) {
        console.log('[FCM] Firebase Messaging não disponível.');
        this.suportado = false;
        return;
      }
      this.messaging = firebase.messaging();
      this.suportado = true;
      console.log('[FCM] Inicializado com sucesso. Permissão atual:', Notification.permission);
    } catch (e) {
      console.warn('[FCM] Erro ao inicializar:', e);
      this.suportado = false;
    }
  },

  async solicitarPermissaoEToken(porteiroId) {
    if (!this.suportado) {
      console.log('[FCM] Não suportado, abortando.');
      return null;
    }

    try {
      console.log('[FCM] Solicitando permissão...');
      const permissao = await Notification.requestPermission();
      console.log('[FCM] Permissão:', permissao);

      if (permissao !== 'granted') {
        console.log('[FCM] Permissão negada.');
        return null;
      }

      const VAPID_KEY = 'ULwUDyyx_b9cz4p9i2sKt11yJaExNckttbSQgCdN1mo';

      console.log('[FCM] Obtendo token...');
      const token = await this.messaging.getToken({ vapidKey: VAPID_KEY });

      if (token) {
        console.log('[FCM] Token obtido:', token.slice(0, 20) + '...');
        await db.collection('porteiros').doc(porteiroId).update({ fcmToken: token });
        console.log('[FCM] Token salvo no Firestore para porteiro:', porteiroId);
        toast('Notificações ativadas ✓');
      } else {
        console.warn('[FCM] Token vazio retornado.');
      }
      return token;
    } catch (e) {
      console.warn('[FCM] Erro ao obter token:', e);
      return null;
    }
  }
};

// ════════════════════════════════════════════════════════════
// CLOUD FUNCTION (deploy separado — não roda no navegador)
// ════════════════════════════════════════════════════════════
//
// Salve isto em functions/index.js no seu projeto Firebase e
// faça deploy com: firebase deploy --only functions
//
// Requer o plano Blaze (gratuito até um volume alto de uso —
// para uma igreja local, o custo real é R$ 0,00 na prática).
//
/*
const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// Roda todo dia às 07:00 (horário de Brasília)
exports.avisarEscaladosDoDia = functions.pubsub
  .schedule('0 7 * * *')
  .timeZone('America/Sao_Paulo')
  .onRun(async (context) => {
    const hoje = new Date().toISOString().split('T')[0];
    const cultoDoc = await admin.firestore().collection('cultos').doc(hoje).get();

    if (!cultoDoc.exists) return null;
    const culto = cultoDoc.data();
    const escalas = culto.escalas || {};

    const idsEscalados = [...new Set(Object.values(escalas).flat())];
    if (idsEscalados.length === 0) return null;

    const porteirosSnap = await admin.firestore()
      .collection('porteiros')
      .where(admin.firestore.FieldPath.documentId(), 'in', idsEscalados.slice(0, 10))
      .get();

    const envios = [];
    porteirosSnap.forEach(doc => {
      const p = doc.data();
      if (!p.fcmToken) return;
      envios.push(
        admin.messaging().send({
          token: p.fcmToken,
          notification: {
            title: 'Você está de serviço hoje',
            body: `${culto.titulo || 'Culto'} às ${culto.horario || ''} — A paz de Deus!`
          }
        }).catch(err => console.error('Erro ao enviar para', p.nome, err))
      );
    });

    await Promise.all(envios);
    return null;
  });
*/
