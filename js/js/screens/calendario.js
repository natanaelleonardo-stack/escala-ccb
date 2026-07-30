// ════════════════════════════════════════════════════════════
// TELA: CALENDÁRIO MENSAL
// ════════════════════════════════════════════════════════════

let _calMesOffset = 0; // meses relativos ao atual
let _calDiaSelecionado = null;

function renderCalendario() {
  const root = document.getElementById('app-root');

  const adminBtn = `<button class="admin-header-btn ${Auth.isAdmin ? 'logged' : ''}" onclick="onClickLoginTrigger()"><i class="ti ti-${Auth.isAdmin ? 'shield-check' : 'shield-lock'}"></i></button>`;

  const header = `
    <header class="app-header">
      <img src="assets/brasao-ccb.png" class="app-header-logo" alt="CCB">
      <div class="app-header-texts">
        <div class="app-header-title">Calendário</div>
        <div class="app-header-sub">Visão geral da escala</div>
      </div>
      ${adminBtn}
    </header>`;

  const base = new Date();
  base.setDate(1);
  base.setMonth(base.getMonth() + _calMesOffset);
  const ano = base.getFullYear();
  const mes = base.getMonth();

  const monthNav = `
    <div class="month-nav">
      <button onclick="mudarMesCalendario(-1)"><i class="ti ti-chevron-left"></i></button>
      <span class="month-label">${MESES[mes]} ${ano}</span>
      <div style="display:flex;align-items:center;gap:4px">
        ${_calMesOffset !== 0 ? `<button class="btn-hoje-cal" onclick="irParaMesAtual()">Hoje</button>` : ''}
        <button onclick="mudarMesCalendario(1)"><i class="ti ti-chevron-right"></i></button>
      </div>
    </div>`;

  // monta a grade do mês (com dias do mês anterior/seguinte pra completar semanas)
  const primeiroDia = new Date(ano, mes, 1);
  const ultimoDia = new Date(ano, mes + 1, 0);
  const inicioGrade = addDays(primeiroDia, -primeiroDia.getDay());
  const fimGrade = addDays(ultimoDia, 6 - ultimoDia.getDay());

  const porteiroPorId = {};
  Store.porteiros.forEach(p => { porteiroPorId[p.id] = p; });

  let dias = [];
  let cursor = new Date(inicioGrade);
  while (cursor <= fimGrade) {
    dias.push(new Date(cursor));
    cursor = addDays(cursor, 1);
  }

  const hoje = todayISO();

  const celulasHTML = dias.map(d => {
    const dataISO = isoDate(d);
    const foraDoMes = d.getMonth() !== mes;
    const culto = Store.getCulto(dataISO);
    const isToday = dataISO === hoje;
    const isEvento = culto?.tipo === 'evento';
    const isSelected = dataISO === _calDiaSelecionado;

    let nomesSet = new Set();
    if (culto) {
      Object.values(culto.escalas || {}).flat().forEach(pid => nomesSet.add(pid));
    }
    const nomesHTML = [...nomesSet].slice(0, 3).map(pid => {
      const p = porteiroPorId[pid];
      if (!p) return '';
      return `<div class="cal-name" style="background:${p.cor || '#888'}">${nomeExibicao(p)}</div>`;
    }).join('');

    const classes = ['cal-cell'];
    if (foraDoMes) classes.push('out');
    if (isToday) classes.push('today');
    if (isEvento) classes.push('evento');
    if (isSelected) classes.push('selected');

    return `
      <div class="${classes.join(' ')}" ${!foraDoMes ? `onclick="selecionarDiaCalendario('${dataISO}')"` : ''}>
        <div class="cal-num">${String(d.getDate()).padStart(2,'0')}</div>
        <div class="cal-names">${nomesHTML}</div>
      </div>`;
  }).join('');

  const calHTML = `
    <div class="cal-wrap">
      <div class="cal-weekdays">${DIAS_SEMANA.map(d => `<span>${d[0]}</span>`).join('')}</div>
      <div class="cal-grid">${celulasHTML}</div>
    </div>`;

  // legenda: porteiros que aparecem neste mês
  const idsNoMes = new Set();
  Object.values(Store.cultos).forEach(c => {
    const d = parseISO(c.data);
    if (d.getMonth() === mes && d.getFullYear() === ano) {
      Object.values(c.escalas || {}).flat().forEach(pid => idsNoMes.add(pid));
    }
  });
  const legendaHTML = [...idsNoMes].map(pid => {
    const p = porteiroPorId[pid];
    if (!p) return '';
    return `<div class="legend-item"><div class="legend-dot" style="background:${p.cor || '#888'}"></div><span>${p.nome}</span></div>`;
  }).join('');

  const legendaWrap = idsNoMes.size > 0 ? `
    <div class="legend-wrap">
      <div class="legend-title">Porteiros do mês</div>
      <div class="legend-list">${legendaHTML}</div>
    </div>` : '';

  // detalhe do dia selecionado
  let detalheHTML = '';
  if (_calDiaSelecionado) {
    const culto = Store.getCulto(_calDiaSelecionado);
    if (culto) {
      const d = parseISO(_calDiaSelecionado);
      const linhas = Object.entries(culto.escalas || {}).flatMap(([posId, lista]) => {
        const posNome = Store.posicoes.find(p => p.id === posId)?.nome || '';
        return lista.map(pid => {
          const p = porteiroPorId[pid];
          if (!p) return '';
          return `
            <div class="day-popup-row">
              <div class="day-popup-dot" style="background:${p.cor || '#888'}"></div>
              <span>${p.nome}</span>
              <span class="pos">— ${posNome}</span>
            </div>`;
        });
      }).join('');

      detalheHTML = `
        <div class="day-popup-wrap">
          <div class="day-popup-title">${DIAS_SEMANA_FULL[d.getDay()]}, ${formatDiaMes(_calDiaSelecionado)} · ${culto.titulo || 'Culto'} · ${culto.horario || ''}</div>
          ${linhas || '<div style="font-size:12px;color:#999;font-style:italic">Nenhum porteiro escalado ainda.</div>'}
        </div>`;
    }
  }

  root.innerHTML = `${header}${monthNav}${calHTML}${detalheHTML}${legendaWrap}<div class="page-bottom-spacer"></div>`;
}

function mudarMesCalendario(delta) {
  _calMesOffset += delta;
  _calDiaSelecionado = null;
  renderCalendario();
}

function irParaMesAtual() {
  _calMesOffset = 0;
  _calDiaSelecionado = null;
  renderCalendario();
}

function selecionarDiaCalendario(dataISO) {
  _calDiaSelecionado = (_calDiaSelecionado === dataISO) ? null : dataISO;
  renderCalendario();
}
