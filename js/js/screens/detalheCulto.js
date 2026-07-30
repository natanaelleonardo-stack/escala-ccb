// ════════════════════════════════════════════════════════════
// TELA: DETALHE DO CULTO (visualização)
// ════════════════════════════════════════════════════════════

function renderDetalheCulto(dataISO) {
  const root = document.getElementById('app-root');
  const culto = Store.getCulto(dataISO);
  const dow = diaSemanaDe(dataISO);
  const escalas = culto?.escalas || {};
  const posicoes = Store.getPosicoesAtivas();

  const header = `
    <header class="detalhe-header">
      <button class="detalhe-back" onclick="irPara('home')"><i class="ti ti-arrow-left"></i> Voltar</button>
      <div class="detalhe-title">${DIAS_SEMANA_FULL[dow]} · ${formatDiaMes(dataISO)}</div>
      <div class="detalhe-meta">
        ${culto?.titulo || 'Culto oficial'} · ${culto?.horario || '19:30'}
      </div>
    </header>`;

  let blocosHTML = '';
  if (posicoes.length === 0) {
    blocosHTML = `<div class="estado-vazio"><i class="ti ti-door"></i><p>Nenhuma posição configurada ainda.</p></div>`;
  } else {
    blocosHTML = posicoes.map(pos => {
      const ids = escalas[pos.id] || [];
      let corpo;
      if (ids.length === 0) {
        corpo = `<div class="porteiro-empty">Nenhum porteiro escalado</div>`;
      } else {
        corpo = ids.map(pid => {
          const p = Store.getPorteiro(pid);
          if (!p) return '';
          const temTelefone = p.telefone && p.telefone.trim();
          return `
            <div class="porteiro-row">
              <div class="porteiro-avatar" style="background:${p.cor || '#ddd'};color:#fff">${initials(p.nome)}</div>
              <span class="porteiro-name">${p.nome}${p.codinome ? ` (${p.codinome})` : ''}</span>
              ${temTelefone ? `<span class="telefone-texto">${formatarTelefone(p.telefone)}</span>` : ''}
              ${temTelefone ? `
                <a class="whats-link-icon" href="${linkWhatsApp(p.telefone)}" target="_blank">
                  <i class="ti ti-brand-whatsapp"></i>
                </a>` : ''}
            </div>`;
        }).join('');
      }
      return `
        <div class="posicao-block">
          <div class="posicao-header">
            <span class="posicao-name">${pos.nome}</span>
            <span class="posicao-count">${ids.length} porteiro${ids.length !== 1 ? 's' : ''}</span>
          </div>
          ${corpo}
        </div>`;
    }).join('');
  }

  root.innerHTML = `${header}<div style="padding-top:12px">${blocosHTML}</div><div class="page-bottom-spacer"></div>`;
}

function irParaDetalhe(dataISO) {
  irPara('detalhe', { dataISO });
}
