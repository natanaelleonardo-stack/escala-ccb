// ════════════════════════════════════════════════════════════
// TELA: MINHA ESCALA — busca por nome + identificação por celular
// ════════════════════════════════════════════════════════════

const LS_KEY_MEU_PORTEIRO_ID = 'escala_meuPorteiroId';

let _minhaEscalaSelecionado = null;

function renderMinhaEscala() {
  const root = document.getElementById('app-root');

  const header = `
    <header class="app-header">
      <img src="assets/brasao-ccb.png" class="app-header-logo" alt="CCB">
      <div class="app-header-texts">
        <div class="app-header-title">Minha Escala</div>
        <div class="app-header-sub">Consulte seus dias de serviço</div>
      </div>
    </header>`;

  root.innerHTML = `${header}<div id="minha-escala-body"></div>`;

  const meuId = localStorage.getItem(LS_KEY_MEU_PORTEIRO_ID);
  const meuPorteiro = meuId ? Store.getPorteiro(meuId) : null;

  if (meuPorteiro) {
    _minhaEscalaSelecionado = meuPorteiro;
    renderCorpoIdentificado(meuPorteiro);
  } else {
    renderPopupQuemEVoce();
  }
}

// ── POPUP "QUEM É VOCÊ?" (primeiro acesso a esta tela) ──
function renderPopupQuemEVoce() {
  const body = document.getElementById('minha-escala-body');

  const listaHTML = Store.porteiros
    .filter(p => p.ativo !== false)
    .sort((a, b) => a.nome.localeCompare(b.nome))
    .map(p => `
      <div class="quem-item" onclick='confirmarIdentidade("${p.id}")'>
        <div class="porteiro-avatar" style="background:${p.cor || '#ddd'};color:#fff">${initials(p.nome)}</div>
        <div class="quem-item-info">
          <div class="quem-item-name">${p.nome}</div>
          ${p.codinome ? `<div class="quem-item-codinome">${p.codinome}</div>` : ''}
        </div>
      </div>`).join('');

  body.innerHTML = `
    <div class="quem-voce-wrap">
      <div class="quem-voce-title"><i class="ti ti-hand-stop"></i> Quem é você?</div>
      <div class="quem-voce-sub">Selecione seu nome na lista para ver seus dias de serviço. Você só precisa fazer isso uma vez neste celular.</div>
      <div class="busca-box" style="margin-bottom:12px">
        <i class="ti ti-search"></i>
        <input type="text" class="busca-input" placeholder="Buscar pelo nome..." oninput="filtrarListaQuemEVoce(this.value)" autocomplete="off">
      </div>
      <div class="quem-lista" id="quem-lista">${listaHTML}</div>
      ${Store.porteiros.length === 0 ? `<div class="estado-vazio"><i class="ti ti-users"></i><p>Nenhum porteiro cadastrado ainda.</p></div>` : ''}
    </div>`;
}

function filtrarListaQuemEVoce(termo) {
  const t = termo.trim().toLowerCase();
  document.querySelectorAll('#quem-lista .quem-item').forEach(el => {
    const texto = el.textContent.toLowerCase();
    el.style.display = texto.includes(t) ? 'flex' : 'none';
  });
}

function confirmarIdentidade(porteiroId) {
  const p = Store.getPorteiro(porteiroId);
  if (!p) return;
  localStorage.setItem(LS_KEY_MEU_PORTEIRO_ID, porteiroId);
  _minhaEscalaSelecionado = p;
  toast(`Olá, ${nomeExibicao(p)}! 👋`);
  renderCorpoIdentificado(p);

  // pede permissão de notificação push (silenciosamente, se suportado)
  if (typeof Notificacoes !== 'undefined') {
    Notificacoes.solicitarPermissaoEToken(porteiroId);
  }
}

function trocarIdentidade() {
  if (!confirm('Deseja trocar quem está usando o app neste celular?')) return;
  localStorage.removeItem(LS_KEY_MEU_PORTEIRO_ID);
  _minhaEscalaSelecionado = null;
  renderPopupQuemEVoce();
}

// ── CORPO QUANDO JÁ IDENTIFICADO ──
function renderCorpoIdentificado(porteiro) {
  const body = document.getElementById('minha-escala-body');

  const trocaLinkHTML = `
    <div class="troca-identidade-bar">
      Não é <strong>${nomeExibicao(porteiro)}</strong>?
      <button onclick="trocarIdentidade()">Trocar</button>
    </div>`;

  body.innerHTML = `${trocaLinkHTML}<div id="minha-escala-resultado"></div>`;
  renderResultadoMinhaEscala(porteiro);
}

function renderResultadoMinhaEscala(porteiro) {
  const hoje = todayISO();
  const fimJanela = isoDate(addDays(new Date(), 60));

  const cultosDoporteiro = Object.values(Store.cultos)
    .filter(c => c.data >= hoje && c.data <= fimJanela)
    .filter(c => Object.values(c.escalas || {}).some(lista => lista.includes(porteiro.id)))
    .sort((a, b) => a.data.localeCompare(b.data));

  const dispLabel = {
    todos: 'Disponível: todos os cultos',
    terca: 'Disponível: apenas terças',
    sexta: 'Disponível: apenas sextas'
  }[porteiro.disponibilidade] || '';

  const posicaoNaFila = Store.filaRodizio.indexOf(porteiro.id);
  const posicaoLabel = posicaoNaFila >= 0 ? ` · Posição na fila: ${posicaoNaFila + 1}ª` : '';

  let listaHTML = '';
  if (cultosDoporteiro.length === 0) {
    listaHTML = `<div class="estado-vazio"><i class="ti ti-calendar-off"></i><p>Nenhum dia agendado nos próximos 60 dias.</p></div>`;
  } else {
    const porMes = {};
    cultosDoporteiro.forEach(c => {
      const d = parseISO(c.data);
      const chave = `${MESES[d.getMonth()]} ${d.getFullYear()}`;
      if (!porMes[chave]) porMes[chave] = [];
      porMes[chave].push(c);
    });

    listaHTML = Object.entries(porMes).map(([mes, cultos]) => `
      <div class="mes-card">
        <div class="mes-header"><div class="mes-nome">${mes}</div></div>
        ${cultos.map(c => {
          const d = parseISO(c.data);
          let posNome = '';
          for (const [posId, lista] of Object.entries(c.escalas || {})) {
            if (lista.includes(porteiro.id)) {
              posNome = Store.posicoes.find(p => p.id === posId)?.nome || '';
              break;
            }
          }
          const confirmado = !!c.geradoPorRodizio || c.tipo === 'evento';
          return `
            <div class="dia-row">
              <div class="dia-badge ${c.tipo === 'evento' ? 'evento' : ''}">
                <div class="num">${String(d.getDate()).padStart(2,'0')}</div>
                <div class="sem">${DIAS_SEMANA[d.getDay()]}</div>
              </div>
              <div class="dia-info">
                <div class="culto-nome">${c.titulo || 'Culto oficial'}</div>
                <div class="posicoes">${posNome} · ${c.horario || ''}</div>
              </div>
              <div class="dia-dot ${confirmado ? '' : 'pendente'}"></div>
            </div>`;
        }).join('')}
      </div>`).join('');
  }

  document.getElementById('minha-escala-resultado').innerHTML = `
    <div class="resultado-header">
      <div class="porteiro-avatar-lg" style="background:${porteiro.cor || '#ddd'};color:#fff">${initials(porteiro.nome)}</div>
      <div>
        <div class="porteiro-nome-lg">${porteiro.nome}</div>
        <div class="porteiro-disp">${dispLabel}${posicaoLabel}</div>
      </div>
    </div>
    <div style="padding:4px 0 12px">${listaHTML}</div>
  `;
}
