// ════════════════════════════════════════════════════════════
// NOTIFICAÇÕES PUSH — OneSignal
// ════════════════════════════════════════════════════════════

const ONESIGNAL_APP_ID = 'a42d68f2-5434-4dd7-9e59-6b6002ab77ae';

const Notificacoes = {

  init() {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(function(OneSignal) {
      OneSignal.init({
        appId: ONESIGNAL_APP_ID,
        serviceWorkerParam: { scope: '/escala-ccb/' },
        serviceWorkerPath: '/escala-ccb/OneSignalSDKWorker.js',
        notifyButton: { enable: false },
        autoResubscribe: true,
      }).then(function() {
        console.log('[OneSignal] Inicializado.');
      }).catch(function(e) {
        console.warn('[OneSignal] Erro init:', e);
      });
    });
  },

  solicitarPermissaoEToken(porteiroId) {
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(function(OneSignal) {
      OneSignal.Notifications.requestPermission().then(function(aceito) {
        console.log('[OneSignal] Permissão:', aceito);
        if (!aceito) return;

        OneSignal.login(porteiroId).then(function() {
          console.log('[OneSignal] Login feito:', porteiroId);
          db.collection('porteiros').doc(porteiroId).update({ oneSignalAtivo: true });
          toast('Notificações ativadas ✓');
        }).catch(function(e) {
          console.warn('[OneSignal] Erro login:', e);
        });
      }).catch(function(e) {
        console.warn('[OneSignal] Erro permissão:', e);
      });
    });
  }
};
