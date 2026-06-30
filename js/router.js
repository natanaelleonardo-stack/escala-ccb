// ════════════════════════════════════════════════════════════
// ROUTER — controla qual tela está visível
// ════════════════════════════════════════════════════════════

let _telaAtual = 'home';
let _telaParams = {};

function irPara(tela, params = {}) {
  _telaAtual = tela;
  _telaParams = params;
  renderTelaAtual();
  atualizarBottomNav();
  window.scrollTo(0, 0);
}

function renderTelaAtual() {
  switch (_telaAtual) {
    case 'home': renderHome(); break;
    case 'escala': renderListaEscala(); break;
    case 'detalhe': renderDetalheCulto(_telaParams.dataISO); break;
    case 'calendario': renderCalendario(); break;
    case 'minha-escala': renderMinhaEscala(); break;
    case 'admin': renderAdminMenu(); break;
    case 'admin-porteiros': renderAdminPorteiros(); break;
    case 'admin-posicoes': renderAdminPosicoes(); break;
    case 'admin-config': renderAdminConfig(); break;
    case 'escala-ajustar': renderEscalaAdmin(_telaParams.dataISO); break;
    default: renderHome();
  }
}

function atualizarBottomNav() {
  document.querySelectorAll('.nav-item').forEach(el => {
    const tab = el.dataset.tab;
    let ativo = tab === _telaAtual;
    // telas "filhas" mantêm o tab pai destacado
    if (_telaAtual === 'detalhe') ativo = (tab === 'home' || tab === 'escala');
    if (_telaAtual.startsWith('admin')) ativo = (tab === 'admin');
    if (_telaAtual === 'escala-ajustar') ativo = (tab === 'admin');
    el.classList.toggle('active', ativo);
  });
}

// ── TELA "Escala" (lista simples de próximos cultos, sem ser a Home) ──
function renderListaEscala() {
  const root = document.getElementById('app-root');

  const header = `
    <header class="app-header">
      <img src="assets/brasao-ccb.png" class="app-header-logo" alt="CCB">
      <div class="app-header-texts">
        <div class="app-header-title">Escala Completa</div>
        <div class="app-header-sub">${Store.config.localidade || 'Bairro dos Castanhos'}</div>
      </div>
    </header>`;

  const hoje = new Date();
  const datas = gerarDatasCultoFixo(isoDate(hoje), isoDate(addDays(hoje, 41)))
    .filter(d => d >= todayISO());

  const eventos = Object.values(Store.cultos)
    .filter(c => c.tipo === 'evento' && c.data >= todayISO())
    .map(c => c.data);

  const todasDatas = [...new Set([...datas, ...eventos])].sort();

  let listaHTML = '';
  if (todasDatas.length === 0) {
    listaHTML = `<div class="estado-vazio"><i class="ti ti-calendar-search"></i><p>Nenhum culto configurado.</p></div>`;
  } else {
    listaHTML = todasDatas.map(d => renderCultoCard(d)).join('');
  }

  root.innerHTML = `
    ${header}
    <div class="section">
      <div class="section-title">Próximas 6 semanas</div>
      ${listaHTML}
    </div>
    <div style="height:12px"></div>
  `;
}
