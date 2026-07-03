// ════════════════════════════════════════════════════════════
// NOTIFICAÇÕES PUSH — Firebase Cloud Messaging (FCM)
// ════════════════════════════════════════════════════════════
//
// Como funciona:
// 1. Quando o porteiro se identifica em "Minha Escala", pedimos
//    permissão de notificação e geramos um "token" único do celular.
// 2. Esse token é salvo em /porteiros/{id}.fcmToken no Firestore.
// 3. Uma Cloud Function (rodando todo dia de manhã) verifica quem
//    está escalado para o culto do dia e envia a notificação push
//    para o token daquele porteiro.
//
// IMPORTANTE: a parte "todo dia de manhã, verificar e enviar" não
// roda no navegador — precisa de uma Cloud Function agendada no
// Firebase (plano Blaze). O código dela está documentado no final
// deste arquivo, em comentário, pronto para deploy.
// ════════════════════════════════════════════════════════════

const Notificacoes = {
  messaging: null,
  suportado: false,

  init() {
    try {
      if (!('Notification' in window) || !firebase.messaging) {
        this.suportado = false;
        return;
      }
      this.messaging = firebase.messaging();
      this.suportado = true;
    } catch (e) {
      console.warn('Notificações push não disponíveis neste navegador.', e);
      this.suportado = false;
    }
  },

  async solicitarPermissaoEToken(porteiroId) {
    if (!this.suportado) return null;

    try {
      const permissao = await Notification.requestPermission();
      if (permissao !== 'granted') {
        console.log('Permissão de notificação negada pelo usuário.');
        return null;
      }

      // IMPORTANTE: troque pela sua VAPID key (gerada no Console Firebase
      // em Configurações do projeto > Cloud Messaging > Web Push certificates)
      const VAPID_KEY = 'ULwUDyyx_b9cz4p9i2sKt11yJaExNckttbSQgCdN1mo';

      const token = await this.messaging.getToken({ vapidKey: VAPID_KEY });
      if (token) {
        await db.collection('porteiros').doc(porteiroId).update({ fcmToken: token });
        console.log('Token de notificação registrado para', porteiroId);
      }
      return token;
    } catch (e) {
      console.warn('Erro ao obter token de notificação:', e);
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
