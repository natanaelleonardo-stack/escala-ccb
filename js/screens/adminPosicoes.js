// ════════════════════════════════════════════════════════════
// TELA: ADMIN — POSIÇÕES (Porta Principal, Lateral, Estacionamento...)
// ════════════════════════════════════════════════════════════

function renderAdminPosicoes() {
  const root = document.getElementById('app-root');
  if (!Auth.isAdmin) { irPara('home'); return; }

  const header = `
    <header class="app-header">
      <img src="assets/brasao-ccb.png" class="app-header-logo" alt="CCB">
      <div class="app-header-texts">
        <div class="app-header-title">Posições</div>
        <div class="app-header-sub">Locais de atuação dos porteiros</div>
      </div>
      <button class="app-header-action" onclick="irPara('home')"><i class="ti ti-x"></i></button>
    </header>
    <div class="admin-bar"><i class="ti ti-shield"></i><span>Modo administrador ativo</span></div>`;

  const listaHTML = Store.getPosicoesAtivas().map(pos => `
    <div class="item-card" draggable="true" data-id="${pos.id}" ondragstart="onDragStartPosicao(event)" ondragover="onDragOverPosicao(event)" ondrop="onDropPosicao(event)">
      <i class="ti ti-grip-vertical drag-handle"></i>
      <div style="width:30px;height:30px;border-radius:7px;background:#eef2f7;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="ti ${pos.icone || 'ti-door'}" style="color:#0d3a6e;font-size:15px"></i>
      </div>
      <div class="item-card-info">
        <div class="item-card-name">${pos.nome}</div>
      </div>
      <div class="item-actions">
        <div class="icon-btn" onclick='abrirFormPosicao("${pos.id}")'><i class="ti ti-pencil"></i></div>
        <div class="icon-btn danger" onclick='confirmarRemoverPosicao("${pos.id}")'><i class="ti ti-trash"></i></div>
      </div>
    </div>`).join('');

  root.innerHTML = `
    ${header}
    <div class="form-body">
      <div class="field-group">
        <label class="field-label">Nova posição</label>
        <input type="text" id="nova-posicao-nome" class="field-input" placeholder="Ex: Porta dos Fundos" style="margin-bottom:8px">
        <button class="btn btn-primary btn-block" onclick="adicionarPosicaoRapida()"><i class="ti ti-plus"></i> Adicionar posição</button>
      </div>
      <hr class="divider">
      <label class="field-label">Posições cadastradas</label>
      <div class="lista-cards mt-12">
        ${Store.getPosicoesAtivas().length === 0 ? `<div class="estado-vazio"><i class="ti ti-door"></i><p>Nenhuma posição cadastrada ainda.</p></div>` : listaHTML}
      </div>
      <div class="info-box mt-12"><i class="ti ti-info-circle"></i><span>Excluir uma posição não remove o histórico de escalas passadas, apenas impede seu uso em novos rodízios.</span></div>
    </div>
  `;
}

async function adicionarPosicaoRapida() {
  const input = document.getElementById('nova-posicao-nome');
  const nome = input.value.trim();
  if (!nome) { toast('Digite o nome da posição'); return; }
  await Store.addPosicao(nome);
  toast('Posição adicionada ✓');
  input.value = '';
  renderAdminPosicoes();
}

function abrirFormPosicao(id) {
  const pos = Store.posicoes.find(p => p.id === id);
  const novoNome = prompt('Renomear posição:', pos?.nome || '');
  if (novoNome === null) return;
  const nomeTrim = novoNome.trim();
  if (!nomeTrim) return;
  Store.updatePosicao(id, { nome: nomeTrim }).then(() => {
    toast('Posição atualizada ✓');
    renderAdminPosicoes();
  });
}

function confirmarRemoverPosicao(id) {
  const pos = Store.posicoes.find(p => p.id === id);
  if (!pos) return;

  // verifica se está em uso nos próximos cultos
  const emUso = Object.values(Store.cultos).some(c =>
    c.data >= todayISO() && (c.escalas?.[id] || []).length > 0
  );

  const msg = emUso
    ? `"${pos.nome}" está sendo usada na escala atual. Ela será removida dos próximos rodízios, mas o histórico será mantido. Excluir mesmo assim?`
    : `Excluir a posição "${pos.nome}"?`;

  if (!confirm(msg)) return;

  Store.removePosicao(id).then(() => {
    toast('Posição removida');
    renderAdminPosicoes();
  });
}

// ── DRAG AND DROP para reordenar posições ──
let _dragPosId = null;
function onDragStartPosicao(e) { _dragPosId = e.currentTarget.dataset.id; e.dataTransfer.effectAllowed = 'move'; }
function onDragOverPosicao(e) { e.preventDefault(); }
async function onDropPosicao(e) {
  e.preventDefault();
  const targetId = e.currentTarget.dataset.id;
  if (!_dragPosId || _dragPosId === targetId) return;

  let lista = Store.getPosicoesAtivas().map(p => p.id);
  const fromIdx = lista.indexOf(_dragPosId);
  const toIdx = lista.indexOf(targetId);
  if (fromIdx === -1 || toIdx === -1) return;

  lista.splice(fromIdx, 1);
  lista.splice(toIdx, 0, _dragPosId);
  await Store.reordenarPosicoes(lista);
  toast('Ordem atualizada ✓');
  _dragPosId = null;
}

// ════════════════════════════════════════════════════════════
// TELA: ADMIN — MENU PRINCIPAL (hub)
// ════════════════════════════════════════════════════════════

function renderAdminMenu() {
  const root = document.getElementById('app-root');
  if (!Auth.isAdmin) { irPara('home'); return; }

  const header = `
    <header class="app-header">
      <img src="assets/brasao-ccb.png" class="app-header-logo" alt="CCB">
      <div class="app-header-texts">
        <div class="app-header-title">Painel Admin</div>
        <div class="app-header-sub">${Store.config.localidade || 'Bairro dos Castanhos'}</div>
      </div>
    </header>
    <div class="admin-bar"><i class="ti ti-shield"></i><span>Modo administrador ativo</span></div>`;

  const itens = [
    { icone: 'ti-users', titulo: 'Porteiros', sub: 'Cadastro e fila do rodízio', acao: "irPara('admin-porteiros')" },
    { icone: 'ti-door', titulo: 'Posições', sub: 'Porta Principal, Lateral, Estacionamento...', acao: "irPara('admin-posicoes')" },
    { icone: 'ti-calendar-plus', titulo: 'Eventos especiais', sub: 'Cadastrar reuniões e eventos esporádicos', acao: "abrirFormEvento()" },
    { icone: 'ti-settings', titulo: 'Configurações', sub: 'Nome, senha, dados gerais', acao: "irPara('admin-config')" },
  ];

  const itensHTML = itens.map(it => `
    <div class="item-card" onclick="${it.acao}" style="cursor:pointer">
      <div style="width:36px;height:36px;border-radius:8px;background:#eef2f7;display:flex;align-items:center;justify-content:center;flex-shrink:0">
        <i class="ti ${it.icone}" style="color:#0d3a6e;font-size:17px"></i>
      </div>
      <div class="item-card-info">
        <div class="item-card-name">${it.titulo}</div>
        <div class="item-card-meta">${it.sub}</div>
      </div>
      <i class="ti ti-chevron-right" style="color:#bbb"></i>
    </div>`).join('');

  root.innerHTML = `
    ${header}
    <div class="form-body">
      <div class="lista-cards">${itensHTML}</div>
      <button class="btn btn-danger btn-block mt-12" onclick="doLogout()">Sair do modo admin</button>
    </div>
  `;
}

// ── FORM DE EVENTO ESPECIAL ──
function abrirFormEvento() {
  const overlay = document.createElement('div');
  overlay.className = 'modal-bg open';
  overlay.id = 'evento-form-overlay';
  overlay.innerHTML = `
    <div class="modal">
      <div class="modal-title">Novo evento especial</div>
      <div class="field-group">
        <label class="field-label">Título</label>
        <input type="text" id="ev-titulo" class="field-input" placeholder="Ex: Reunião de jovens">
      </div>
      <div class="field-group">
        <label class="field-label">Data</label>
        <input type="date" id="ev-data" class="field-input">
      </div>
      <div class="field-group">
        <label class="field-label">Horário</label>
        <input type="time" id="ev-horario" class="field-input" value="19:30">
      </div>
      <button class="btn btn-primary btn-block" onclick="salvarEvento()">Salvar evento</button>
      <button class="btn btn-secondary btn-block" style="margin-top:8px" onclick="fecharFormEvento()">Cancelar</button>
    </div>`;
  document.body.appendChild(overlay);
}

function fecharFormEvento() {
  const el = document.getElementById('evento-form-overlay');
  if (el) el.remove();
}

async function salvarEvento() {
  const titulo = document.getElementById('ev-titulo').value.trim();
  const dataISO = document.getElementById('ev-data').value;
  const horario = document.getElementById('ev-horario').value;
  if (!titulo || !dataISO) { toast('Preencha título e data'); return; }

  await Store.addEventoEspecial({ dataISO, titulo, horario });
  toast('Evento cadastrado ✓');
  fecharFormEvento();
  irPara('detalhe', { dataISO });
}

// ════════════════════════════════════════════════════════════
// TELA: ADMIN — CONFIGURAÇÕES
// ════════════════════════════════════════════════════════════

function renderAdminConfig() {
  const root = document.getElementById('app-root');
  if (!Auth.isAdmin) { irPara('home'); return; }

  const header = `
    <header class="app-header">
      <img src="assets/brasao-ccb.png" class="app-header-logo" alt="CCB">
      <div class="app-header-texts">
        <div class="app-header-title">Configurações</div>
        <div class="app-header-sub">Dados gerais do app</div>
      </div>
      <button class="app-header-action" onclick="irPara('admin')"><i class="ti ti-x"></i></button>
    </header>
    <div class="admin-bar"><i class="ti ti-shield"></i><span>Modo administrador ativo</span></div>`;

  root.innerHTML = `
    ${header}
    <div class="form-body">
      <div class="field-group">
        <label class="field-label">Localidade</label>
        <input type="text" id="cfg-localidade" class="field-input" value="${Store.config.localidade || ''}">
      </div>
      <button class="btn btn-primary btn-block" onclick="salvarConfigGeral()">Salvar</button>
      <hr class="divider">
      <div class="field-group">
        <label class="field-label">Alterar senha admin</label>
        <input type="password" id="cfg-nova-senha" class="field-input" placeholder="Nova senha">
      </div>
      <button class="btn btn-secondary btn-block" onclick="salvarNovaSenha()">Salvar senha</button>
    </div>
  `;
}

async function salvarConfigGeral() {
  const localidade = document.getElementById('cfg-localidade').value.trim();
  await db.collection('config').doc('geral').set({ localidade }, { merge: true });
  toast('Configurações salvas ✓');
}

async function salvarNovaSenha() {
  const senha = document.getElementById('cfg-nova-senha').value.trim();
  if (senha.length < 4) { toast('Senha muito curta (mín. 4 caracteres)'); return; }
  await Auth.changePassword(senha);
  toast('Senha alterada ✓');
  document.getElementById('cfg-nova-senha').value = '';
}
