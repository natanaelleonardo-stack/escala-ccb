// ════════════════════════════════════════════════════════════
// NOTIFICAÇÕES PUSH — OneSignal
// Substitui o Firebase Cloud Messaging (FCM)
// Funciona em subpastas do GitHub Pages sem restrições
// ════════════════════════════════════════════════════════════

const ONESIGNAL_APP_ID = 'a42d68f2-5434-4dd7-9e59-6b6002ab77ae';

const Notificacoes = {
  inicializado: false,

  async init() {
    try {
      await OneSignalDeferred.push(async (OneSignal) => {
        await OneSignal.init({
          appId: ONESIGNAL_APP_ID,
          serviceWorkerParam: { scope: '/escala-ccb/' },
          serviceWorkerPath: 'OneSignalSDKWorker.js',
          notifyButton: { enable: false },
          allowLocalhostAsSecureOrigin: true,
        });
        this.inicializado = true;
        console.log('[OneSignal] Inicializado com sucesso.');
      });
    } catch (e) {
      console.warn('[OneSignal] Erro ao inicializar:', e);
    }
  },

  async solicitarPermissaoEToken(porteiroId) {
    try {
      await OneSignalDeferred.push(async (OneSignal) => {
        // solicita permissão
        await OneSignal.Notifications.requestPermission();

        const permissao = OneSignal.Notifications.permission;
        console.log('[OneSignal] Permissão:', permissao);

        if (!permissao) {
          console.log('[OneSignal] Permissão negada.');
          return;
        }

        // usa o ID do porteiro como External User ID no OneSignal
        await OneSignal.login(porteiroId);
        console.log('[OneSignal] Porteiro vinculado:', porteiroId);

        // salva no Firestore que este porteiro tem notificação ativa
        await db.collection('porteiros').doc(porteiroId).update({
          oneSignalAtivo: true,
          oneSignalId: porteiroId
        });

        toast('Notificações ativadas ✓');
      });
    } catch (e) {
      console.warn('[OneSignal] Erro ao solicitar permissão:', e);
    }
  }
};
