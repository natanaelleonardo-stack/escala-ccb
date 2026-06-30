// ════════════════════════════════════════════════════════════
// TELA: ADMIN — PORTEIROS (cadastro + fila do rodízio)
// ════════════════════════════════════════════════════════════

let _editandoPorteiroId = null;

function renderAdminPorteiros() {
  const root = document.getElementById('app-root');
  if (!Auth.isAdmin) { irPara('home'); return; }

  const header = `
    <header class="app-header">
      <img src="assets/brasao-ccb.png" class="app-header-logo" alt="CCB">
      <div class="app-header-texts">
        <div class="app-header-title">Porteiros</div>
        <div class="app-header-sub">Ordem da fila do rodízio</div>
      </div>
      <button class="app-header-action" onclick="abrirFormPorteiro()"><i class="ti ti-plus"></i></button>
    </header>
    <div class="admin-bar"><i class="ti ti-shield"></i><span>Modo administrador ativo</span></div>`;

  const fila = Store.filaRodizio.filter(id => Store.getPorteiro(id));
  const semFila = Store.porteiros.filter(p => !fila.includes(p.id));
  const todosNaOrdem = [...fila, ...semFila.map(p => p.id)];

  const listaHTML = todosNaOrdem.map((id, idx) => {
    const p = Store.getPorteiro(id);
    if (!p) return '';
    const dispLabel = { todos: 'Todos os cultos', terca: 'Dia fixo: terça', sexta: 'Dia fixo: sexta' }[p.disponibilidade] || '';
    return `
      <div class="item-card" draggable="true" data-id="${p.id}" ondragstart="onDragStartPorteiro(event)" ondragover="onDragOverPorteiro(event)" ondrop="onDropPorteiro(event)">
        <i class="ti ti-grip-vertical drag-handle"></i>
        <div class="fila-pos-badge">${idx + 1}º</div>
        <div class="porteiro-avatar">${initials(p.nome)}</div>
        <div class="item-card-info">
          <div class="item-card-name">${p.nome}${p.codinome ? ` <span style="color:#999;font-weight:400">(${p.codinome})</span>` : ''}</div>
          <div class="item-card-meta">${dispLabel}</div>
        </div>
        <div class="item-actions">
          <div class="icon-btn" onclick='abrirFormPorteiro("${p.id}")'><i class="ti ti-pencil"></i></div>
          <div class="icon-btn danger" onclick='confirmarRemoverPorteiro("${p.id}")'><i class="ti ti-trash"></i></div>
        </div>
      </div>`;
  }).join('');

  root.innerHTML = `
    ${header}
    <div class="form-body">
      ${Store.porteiros.length === 0 ? `<div class="estado-vazio"><i class="ti ti-users"></i><p>Nenhum porteiro cadastrado ainda.<br>Toque em + para adicionar.</p></div>` : `
        <div class="lista-cards">${listaHTML}</div>
        <div class="warn-box mt-12"><i class="ti ti-info-circle"></i><span>Arraste para reordenar a fila manualmente, se necessário.</span></div>
      `}
    </div>
  `;
}

// ── DRAG AND DROP simples para reordenar a fila ──
let _dragId = null;
function onDragStartPorteiro(e) {
  _dragId = e.currentTarget.dataset.id;
  e.dataTransfer.effectAllowed = 'move';
}
function onDragOverPorteiro(e) {
  e.preventDefault();
}
async function onDropPorteiro(e) {
  e.preventDefault();
  const targetId = e.currentTarget.dataset.id;
  if (!_dragId || _dragId === targetId) return;

  let fila = Store.filaRodizio.filter(id => Store.getPorteiro(id));
  const fromIdx = fila.indexOf(_dragId);
  const toIdx = fila.indexOf(targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  fila.splice(fromIdx, 1);
  fila.splice(toIdx, 0, _dragId);
  await Store.reordenarFila(fila);
  toast('Ordem da fila atualizada ✓');
  _dragId = null;
}

// ── FORMULÁRIO DE CADASTRO / EDIÇÃO ──
function abrirFormPorteiro(porteiroId) {
  _editandoPorteiroId = porteiroId || null;
  const p = porteiroId ? Store.getPorteiro(porteiroId) : null;

  const overlay = document.createElement('div');
  overlay.className = 'modal-bg open';
  overlay.id = 'porteiro-form-overlay';

  const disponibilidade = p?.disponibilidade || 'todos';

  overlay.innerHTML = `
    <div class="modal" style="max-width:380px">
      <div class="modal-title">${p ? 'Editar Porteiro' : 'Cadastrar Porteiro'}</div>
      <div class="field-group">
        <label class="field-label">Nome completo</label>
        <input type="text" id="pf-nome" class="field-input" placeholder="Ex: Benedito Antunes" value="${p?.nome || ''}">
      </div>
      <div class="field-group">
        <label class="field-label">Codinome (opcional)</label>
        <input type="text" id="pf-codinome" class="field-input" placeholder="Ex: Dito" value="${p?.codinome || ''}">
        <div class="field-hint">Usado nas exibições do app. Se vazio, usa o primeiro nome.</div>
      </div>
      <div class="field-group">
        <label class="field-label">Telefone (opcional)</label>
        <input type="text" id="pf-telefone" class="field-input" placeholder="(15) 99999-9999" value="${p?.telefone || ''}">
      </div>
      <hr class="divider">
      <div class="field-group">
        <label class="field-label">Disponibilidade</label>
        <div class="disp-options">
          <div class="disp-opt ${disponibilidade==='todos'?'selected':''}" onclick="selecionarDisponibilidade('todos')" id="disp-todos">
            <div class="radio-fake ${disponibilidade==='todos'?'on':''}"></div>
            <div><div class="disp-opt-title">Todos os cultos</div><div class="disp-opt-sub">Pode ser escalado em terças, sextas e eventos</div></div>
          </div>
          <div class="disp-opt ${disponibilidade==='terca'?'selected':''}" onclick="selecionarDisponibilidade('terca')" id="disp-terca">
            <div class="radio-fake ${disponibilidade==='terca'?'on':''}"></div>
            <div><div class="disp-opt-title">Dia fixo: Terça</div><div class="disp-opt-sub">Disponível apenas às terças-feiras</div></div>
          </div>
          <div class="disp-opt ${disponibilidade==='sexta'?'selected':''}" onclick="selecionarDisponibilidade('sexta')" id="disp-sexta">
            <div class="radio-fake ${disponibilidade==='sexta'?'on':''}"></div>
            <div><div class="disp-opt-title">Dia fixo: Sexta</div><div class="disp-opt-sub">Disponível apenas às sextas-feiras</div></div>
          </div>
        </div>
      </div>
      <input type="hidden" id="pf-disponibilidade" value="${disponibilidade}">
      <button class="btn btn-primary btn-block" onclick="salvarPorteiro()">Salvar porteiro</button>
      <button class="btn btn-secondary btn-block" style="margin-top:8px" onclick="fecharFormPorteiro()">Cancelar</button>
    </div>`;

  document.body.appendChild(overlay);
}

function selecionarDisponibilidade(valor) {
  document.getElementById('pf-disponibilidade').value = valor;
  ['todos', 'terca', 'sexta'].forEach(v => {
    const opt = document.getElementById(`disp-${v}`);
    opt.classList.toggle('selected', v === valor);
    opt.querySelector('.radio-fake').classList.toggle('on', v === valor);
  });
}

function fecharFormPorteiro() {
  const el = document.getElementById('porteiro-form-overlay');
  if (el) el.remove();
  _editandoPorteiroId = null;
}

async function salvarPorteiro() {
  const nome = document.getElementById('pf-nome').value.trim();
  const codinome = document.getElementById('pf-codinome').value.trim();
  const telefone = document.getElementById('pf-telefone').value.trim();
  const disponibilidade = document.getElementById('pf-disponibilidade').value;

  if (!nome) { toast('Informe o nome completo'); return; }

  if (_editandoPorteiroId) {
    await Store.updatePorteiro(_editandoPorteiroId, { nome, codinome, telefone, disponibilidade });
    toast('Porteiro atualizado ✓');
  } else {
    await Store.addPorteiro({ nome, codinome, telefone, disponibilidade });
    toast('Porteiro cadastrado ✓');
  }
  fecharFormPorteiro();
  renderAdminPorteiros();
}

function confirmarRemoverPorteiro(id) {
  const p = Store.getPorteiro(id);
  if (!p) return;
  if (!confirm(`Remover ${p.nome} da equipe de porteiros?`)) return;
  Store.removePorteiro(id).then(() => {
    toast('Porteiro removido');
    renderAdminPorteiros();
  });
}
