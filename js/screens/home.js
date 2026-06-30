// ════════════════════════════════════════════════════════════
// TELA: HOME
// ════════════════════════════════════════════════════════════

function renderHome() {
  const root = document.getElementById('app-root');

  const header = `
    <header class="app-header">
      <img src="assets/brasao-ccb.png" class="app-header-logo" alt="CCB">
      <div class="app-header-texts">
        <div class="app-header-title">Escala de Porteiros</div>
        <div class="app-header-sub">${Store.config.localidade || 'Bairro dos Castanhos'}</div>
      </div>
    </header>`;

  const hoje = new Date();
  const proximaData = gerarDatasCultoFixo(isoDate(hoje), isoDate(addDays(hoje, 13)))
    .filter(d => d >= todayISO())[0];

  const eventosProximos = Object.values(Store.cultos)
    .filter(c => c.tipo === 'evento' && c.data >= todayISO())
    .sort((a, b) => a.data.localeCompare(b.data))
    .slice(0, 5);

  let cultosHTML = '';
  if (!proximaData) {
    cultosHTML = `<div class="estado-vazio"><i class="ti ti-calendar-search"></i><p>Nenhum culto configurado ainda.</p></div>`;
  } else {
    cultosHTML = renderCultoCard(proximaData);
  }

  let eventosHTML = '';
  if (eventosProximos.length > 0) {
    eventosHTML = `
      <div class="section">
        <div class="section-title">Eventos especiais</div>
        ${eventosProximos.map(ev => {
          const d = parseISO(ev.data);
          return `
          <div class="evento-card" onclick="irParaDetalhe('${ev.data}')">
            <div class="evento-data-box">
              <div class="dia">${String(d.getDate()).padStart(2,'0')}</div>
              <div class="mes">${MESES[d.getMonth()].slice(0,3)}</div>
            </div>
            <div class="evento-info">
              <div class="titulo">${ev.titulo}</div>
              <div class="sub">${DIAS_SEMANA_FULL[ev.diaSemana]} · ${ev.horario || ''}</div>
            </div>
          </div>`;
        }).join('')}
      </div>`;
  }

  root.innerHTML = `
    ${header}
    <div class="section">
      <div class="section-title">Próximo culto</div>
      ${cultosHTML}
    </div>
    ${eventosHTML}
    <div style="height:12px"></div>
  `;
}

function renderCultoCard(dataISO) {
  const culto = Store.getCulto(dataISO);
  const dow = diaSemanaDe(dataISO);
  const escalas = culto?.escalas || {};
  const posicoes = Store.getPosicoesAtivas();
  const gerado = culto?.geradoPorRodizio;

  const posicoesHTML = posicoes.map(pos => {
    const idsEscalados = escalas[pos.id] || [];
    let nomesHTML;
    if (idsEscalados.length === 0) {
      nomesHTML = `<span class="nome-chip vazio">Sem porteiro</span>`;
    } else {
      nomesHTML = idsEscalados.map(pid => {
        const p = Store.getPorteiro(pid);
        if (!p) return '';
        const temTelefone = p.telefone && p.telefone.trim();
        return `
          <div class="porteiro-escalado-item">
            <span class="nome-chip">${p.nome}</span>
            ${temTelefone ? `
              <span class="telefone-texto">${formatarTelefone(p.telefone)}</span>
              <a class="whats-link-icon" href="${linkWhatsApp(p.telefone)}" target="_blank" onclick="event.stopPropagation()">
                <i class="ti ti-brand-whatsapp"></i>
              </a>` : ''}
          </div>`;
      }).join('');
    }
    return `
      <div class="posicao-linha">
        <span class="posicao-label">${pos.nome}</span>
        <div class="posicao-nomes">${nomesHTML}</div>
      </div>`;
  }).join('');

  return `
    <div class="culto-card">
      <div class="culto-card-header" onclick="irParaDetalhe('${dataISO}')">
        <div>
          <div class="culto-dia">${DIAS_SEMANA_FULL[dow]}</div>
          <div class="culto-data">${formatDiaMesAno(dataISO)}</div>
        </div>
        <div class="culto-badge ${gerado ? '' : 'manual'}">
          <i class="ti ti-${gerado ? 'refresh' : 'hand-stop'}"></i>
          ${gerado ? 'Rodízio' : 'Manual'}
        </div>
      </div>
      <div class="culto-card-body">
        <div class="culto-info-row"><i class="ti ti-clock"></i><span>${culto?.horario || '19:30'}</span></div>
        ${posicoesHTML}
      </div>
    </div>`;
}
