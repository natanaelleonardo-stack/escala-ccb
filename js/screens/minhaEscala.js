// ════════════════════════════════════════════════════════════
// TELA: MINHA ESCALA — busca por nome (sem login)
// ════════════════════════════════════════════════════════════

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

  const buscaHTML = `
    <div class="busca-wrap">
      <div class="busca-box">
        <i class="ti ti-search"></i>
        <input type="text" class="busca-input" id="minha-escala-input"
          placeholder="Digite seu nome..."
          oninput="onBuscaMinhaEscalaInput(this.value)"
          autocomplete="off">
        <div class="busca-suggestions" id="busca-suggestions"></div>
      </div>
    </div>`;

  root.innerHTML = `${header}${buscaHTML}<div id="minha-escala-resultado"></div>`;

  if (_minhaEscalaSelecionado) {
    document.getElementById('minha-escala-input').value = _minhaEscalaSelecionado.nome;
    renderResultadoMinhaEscala(_minhaEscalaSelecionado);
  } else {
    renderEstadoVazioMinhaEscala();
  }
}

function renderEstadoVazioMinhaEscala() {
  document.getElementById('minha-escala-resultado').innerHTML = `
    <div class="estado-vazio">
      <i class="ti ti-calendar-search"></i>
      <p>Digite seu nome acima para ver<br>os seus dias na escala.</p>
    </div>`;
}

function onBuscaMinhaEscalaInput(valor) {
  const sugestoesEl = document.getElementById('busca-suggestions');
  if (!valor.trim()) {
    sugestoesEl.classList.remove('open');
    _minhaEscalaSelecionado = null;
    renderEstadoVazioMinhaEscala();
    return;
  }

  const termo = valor.trim().toLowerCase();
  const encontrados = Store.porteiros.filter(p =>
    p.ativo !== false &&
    (p.nome.toLowerCase().includes(termo) || (p.codinome || '').toLowerCase().includes(termo))
  ).slice(0, 6);

  if (encontrados.length === 0) {
    sugestoesEl.classList.remove('open');
    return;
  }

  sugestoesEl.innerHTML = encontrados.map(p => `
    <div class="busca-suggestion-item" onclick='selecionarPorteiroMinhaEscala(${JSON.stringify(p.id)})'>
      ${p.nome}${p.codinome ? ` <span style="color:#999">(${p.codinome})</span>` : ''}
    </div>`).join('');
  sugestoesEl.classList.add('open');
}

function selecionarPorteiroMinhaEscala(porteiroId) {
  const p = Store.getPorteiro(porteiroId);
  if (!p) return;
  _minhaEscalaSelecionado = p;
  document.getElementById('busca-suggestions').classList.remove('open');
  document.getElementById('minha-escala-input').value = p.nome;
  renderResultadoMinhaEscala(p);
}

function renderResultadoMinhaEscala(porteiro) {
  const hoje = todayISO();
  const fimJanela = isoDate(addDays(new Date(), 60));

  // Encontra todos os cultos onde esse porteiro está escalado
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
    // agrupa por mês
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
          // encontra em qual posição ele está
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
      <div class="porteiro-avatar-lg">${initials(porteiro.nome)}</div>
      <div>
        <div class="porteiro-nome-lg">${porteiro.nome}</div>
        <div class="porteiro-disp">${dispLabel}${posicaoLabel}</div>
      </div>
    </div>
    <div style="padding:4px 0 12px">${listaHTML}</div>
  `;
}
