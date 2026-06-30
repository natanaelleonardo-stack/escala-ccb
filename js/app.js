// ════════════════════════════════════════════════════════════
// APP — inicialização geral, login admin, popup de alterações
// ════════════════════════════════════════════════════════════

// ── LOGIN ──
function onClickLoginTrigger() {
  if (Auth.isAdmin) {
    irPara('admin');
  } else {
    document.getElementById('login-modal').classList.add('open');
    setTimeout(() => document.getElementById('login-pw')?.focus(), 100);
  }
}

function closeLoginModal() {
  document.getElementById('login-modal').classList.remove('open');
  document.getElementById('login-pw').value = '';
  document.getElementById('login-error').style.display = 'none';
}

async function doLogin() {
  const senha = document.getElementById('login-pw').value;
  if (!senha) return;
  const ok = await Auth.login(senha);
  if (ok) {
    closeLoginModal();
    atualizarUIAdmin();
    toast('Modo admin ativado');
    irPara('admin');
  } else {
    document.getElementById('login-error').style.display = 'block';
  }
}

function doLogout() {
  Auth.logout();
  atualizarUIAdmin();
  irPara('home');
  toast('Modo admin encerrado');
}

function atualizarUIAdmin() {
  const trigger = document.getElementById('login-trigger');
  const navAdmin = document.getElementById('nav-admin');
  if (Auth.isAdmin) {
    trigger.classList.add('logged');
    trigger.innerHTML = '<i class="ti ti-shield-check"></i>';
    navAdmin.classList.remove('hidden');
  } else {
    trigger.classList.remove('logged');
    trigger.innerHTML = '<i class="ti ti-shield-lock"></i>';
    navAdmin.classList.add('hidden');
  }
}

// ════════════════════════════════════════════════════════════
// POPUP DE ALTERAÇÃO NA ESCALA
// Aparece para todos, na primeira vez que abrirem o app após
// qualquer alteração ter sido feita por um admin.
// ════════════════════════════════════════════════════════════

const LS_KEY_ULTIMO_LOTE_VISTO = 'escala_ultimoLoteVisto';

function verificarAlteracoesPendentes() {
  const loteAtual = Store.config.loteAlteracaoId;
  const loteVisto = localStorage.getItem(LS_KEY_ULTIMO_LOTE_VISTO);
  const historico = Store.config.ultimoLoteAlteracoes || [];

  if (!loteAtual || loteAtual === loteVisto || historico.length === 0) return;

  // monta a lista de alterações para exibir
  const listaEl = document.getElementById('changed-list');
  listaEl.innerHTML = historico.slice(-12).map(alt => {
    const tagClass = { entrou: 'entrou', saiu: 'saiu', trocou: 'trocou' }[alt.tipo] || 'entrou';
    const tagLabel = { entrou: 'Entrou', saiu: 'Saiu', trocou: 'Trocou' }[alt.tipo] || alt.tipo;
    const dataFmt = alt.cultoData ? formatDiaMes(alt.cultoData) : '';
    return `
      <div class="changed-row">
        <div class="changed-avatar">${initials(alt.porteiroNome || '?')}</div>
        <div class="changed-info">
          <div class="changed-name">${alt.porteiroNome || 'Porteiro'}</div>
          <div class="changed-detail">${alt.posicaoNome || ''} · ${dataFmt}</div>
        </div>
        <span class="changed-tag ${tagClass}">${tagLabel}</span>
      </div>`;
  }).join('');

  document.getElementById('alteracao-overlay').classList.add('open');

  // marca como visto assim que abre (guarda o id do lote pendente p/ fechar depois)
  window._loteAlteracaoPendente = loteAtual;
}

function fecharAlertaAlteracao() {
  document.getElementById('alteracao-overlay').classList.remove('open');
  if (window._loteAlteracaoPendente) {
    localStorage.setItem(LS_KEY_ULTIMO_LOTE_VISTO, window._loteAlteracaoPendente);
  }
}

// ════════════════════════════════════════════════════════════
// INICIALIZAÇÃO
// ════════════════════════════════════════════════════════════

async function iniciarApp() {
  await Store.init();
  if (typeof Notificacoes !== 'undefined') Notificacoes.init();

  // aguarda o primeiro carregamento dos dados antes de renderizar
  let tentativas = 0;
  const aguardar = setInterval(() => {
    tentativas++;
    if (Store.posicoes.length >= 0 && tentativas > 3) {
      clearInterval(aguardar);
      finalizarInicializacao();
    }
  }, 300);
}

function finalizarInicializacao() {
  atualizarUIAdmin();
  irPara('home');
  verificarAlteracoesPendentes();

  // gera automaticamente o rodízio das próximas semanas (silencioso)
  Store.garantirRodizioProximosMeses(6).catch(err => console.error('Erro ao gerar rodízio:', err));

  // re-render reativo: sempre que os dados mudarem, re-renderiza a tela atual
  Store.on('*', () => {
    renderTelaAtual();
    verificarAlteracoesPendentes();
  });
}

document.addEventListener('DOMContentLoaded', iniciarApp);

// ── REGISTRO DOS SERVICE WORKERS (PWA + Notificações) ──
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(err => {
      console.warn('Service worker não registrado:', err);
    });
    navigator.serviceWorker.register('firebase-messaging-sw.js').catch(err => {
      console.warn('Service worker de notificações não registrado:', err);
    });
  });
}
