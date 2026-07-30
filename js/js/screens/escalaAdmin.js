// ════════════════════════════════════════════════════════════
// TELA: ADMIN — AJUSTAR ESCALA (revisar/trocar o que o rodízio gerou)
// ════════════════════════════════════════════════════════════

let _escalaAdminContexto = null; // { dataISO, posicaoId, porteiroAntigoId }

function renderEscalaAdmin(dataISO) {
  const root = document.getElementById('app-root');
  if (!Auth.isAdmin) { irPara('home'); return; }

  const culto = Store.getCulto(dataISO);
  const dow = diaSemanaDe(dataISO);
  const escalas = culto?.escalas || {};
  const posicoes = Store.getPosicoesAtivas();

  const header = `
    <header class="app-header">
      <img src="assets/brasao-ccb.png" class="app-header-logo" alt="CCB">
      <div class="app-header-texts">
        <div class="app-header-title">Ajustar Escala</div>
        <div class="app-header-sub">${DIAS_SEMANA_FULL[dow]} · ${formatDiaMesAno(dataISO)}</div>
      </div>
      <button class="app-header-action" onclick="irPara('home')"><i class="ti ti-x"></i></button>
    </header>
    <div class="admin-bar"><i class="ti ti-shield"></i><span>Modo administrador ativo</span></div>`;

  const banner = culto?.geradoPorRodizio
    ? `<div class="info-box" style="margin:12px 14px 4px"><i class="ti ti-circle-check"></i><span>Escala gerada automaticamente pelo rodízio. Toque em "Trocar" para ajustar.</span></div>`
    : `<div class="warn-box" style="margin:12px 14px 4px"><i class="ti ti-hand-stop"></i><span>Este culto/evento não usa rodízio automático. Escale manualmente.</span></div>`;

  const blocosHTML = posicoes.map(pos => {
    const ids = escalas[pos.id] || [];
    let linhas = ids.map(pid => {
      const p = Store.getPorteiro(pid);
      if (!p) return '';
      return `
        <div class="porteiro-row">
          <div class="porteiro-avatar">${initials(p.nome)}</div>
          <span class="porteiro-name">${p.nome}</span>
          <button class="btn btn-secondary btn-sm" onclick='abrirTrocaPopup("${dataISO}","${pos.id}","${pid}")'>Trocar</button>
        </div>`;
    }).join('');

    if (ids.length === 0) {
      linhas = `
        <div class="porteiro-row">
          <span class="porteiro-empty" style="flex:1">Nenhum selecionado</span>
          <button class="btn btn-primary btn-sm" onclick='abrirTrocaPopup("${dataISO}","${pos.id}",null)'>Adicionar</button>
        </div>`;
    }

    return `
      <div class="posicao-block" style="margin:10px 14px">
        <div class="posicao-header">
          <span class="posicao-name">${pos.nome}</span>
          <span class="posicao-count">${ids.length} escalado${ids.length !== 1 ? 's' : ''}</span>
        </div>
        ${linhas}
      </div>`;
  }).join('');

  const filaPreview = Store.filaRodizio.slice(0, 6).map((pid, idx) => {
    const p = Store.getPorteiro(pid);
    if (!p) return '';
    return `<div class="fila-item ${idx === 0 ? 'proximo' : ''}">${nomeExibicao(p)}</div>`;
  }).join('');

  root.innerHTML = `
    ${header}
    ${banner}
    ${blocosHTML}
    <div class="fila-preview" style="margin:14px 14px 0">
      <div class="fila-title" style="font-size:10px;font-weight:700;color:#555;text-transform:uppercase;letter-spacing:.5px;margin-bottom:6px">Próximos da fila geral</div>
      <div class="fila-list" style="display:flex;gap:6px;overflow-x:auto;padding-bottom:4px">${filaPreview}</div>
    </div>
    <button class="btn btn-primary btn-block" style="margin:16px 14px 10px;width:calc(100% - 28px)" onclick="irPara('home')">Concluir ajustes</button>
  `;
}

// ── POPUP DE TROCA ──
function abrirTrocaPopup(dataISO, posicaoId, porteiroAntigoId) {
  _escalaAdminContexto = { dataISO, posicaoId, porteiroAntigoId };

  const dow = diaSemanaDe(dataISO);
  const culto = Store.getCulto(dataISO);
  const jaEscalados = new Set(Object.values(culto?.escalas || {}).flat());

  const candidatos = Store.porteiros.filter(p => p.ativo !== false && p.id !== porteiroAntigoId);

  const overlay = document.createElement('div');
  overlay.className = 'sheet-overlay open';
  overlay.id = 'troca-overlay';

  const porteiroAntigo = porteiroAntigoId ? Store.getPorteiro(porteiroAntigoId) : null;
  const proximoDaFilaId = Store.filaRodizio.find(id => {
    const p = Store.getPorteiro(id);
    return p && p.ativo !== false && porteiroDisponivelEm(p, dow) && !jaEscalados.has(id);
  });

  const optionsHTML = candidatos.map(p => {
    const disponivel = porteiroDisponivelEm(p, dow);
    const ehProximo = p.id === proximoDaFilaId;
    const jaNoCulto = jaEscalados.has(p.id);
    return `
      <div class="swap-option ${ehProximo ? 'fila-next' : ''}" style="${jaNoCulto ? 'opacity:.4;pointer-events:none' : ''}" onclick='confirmarTroca("${p.id}", ${!disponivel})'>
        <div class="porteiro-avatar">${initials(p.nome)}</div>
        <span class="swap-option-name">${p.nome}${!disponivel ? ' ⚠️' : ''}</span>
        ${ehProximo ? '<span class="swap-option-tag">próximo da fila</span>' : ''}
        ${jaNoCulto ? '<span class="swap-option-tag">já escalado</span>' : ''}
      </div>`;
  }).join('');

  overlay.innerHTML = `
    <div class="sheet">
      <div class="sheet-handle"></div>
      <div class="sheet-title">${porteiroAntigo ? `Trocar ${porteiroAntigo.nome}` : 'Adicionar porteiro'}</div>
      <div class="sheet-sub">${Store.posicoes.find(x=>x.id===posicaoId)?.nome || ''} · ${DIAS_SEMANA_FULL[dow]} · ${formatDiaMes(dataISO)}</div>
      <div style="max-height:300px;overflow-y:auto">${optionsHTML}</div>
      ${porteiroAntigo ? `<div class="warn-box" style="margin-top:8px"><i class="ti ti-alert-triangle"></i><span>${porteiroAntigo.nome} volta para o início da fila ao ser removido deste culto.</span></div>` : ''}
      <button class="btn btn-secondary btn-block" style="margin-top:12px" onclick="fecharTrocaPopup()">Cancelar</button>
    </div>`;

  document.body.appendChild(overlay);
}

function fecharTrocaPopup() {
  const el = document.getElementById('troca-overlay');
  if (el) el.remove();
}

async function confirmarTroca(porteiroNovoId, semDisponibilidade) {
  if (semDisponibilidade) {
    const p = Store.getPorteiro(porteiroNovoId);
    const confirmou = confirm(`${p.nome} normalmente não trabalha neste dia da semana. Confirmar mesmo assim?`);
    if (!confirmou) return;
  }

  const { dataISO, posicaoId, porteiroAntigoId } = _escalaAdminContexto;
  await Store.trocarPorteiroNoCulto(dataISO, posicaoId, porteiroAntigoId, porteiroNovoId);
  fecharTrocaPopup();
  toast('Escala atualizada ✓');
  renderEscalaAdmin(dataISO);
}
