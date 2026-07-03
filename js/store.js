// ════════════════════════════════════════════════════════════
// DATA STORE — camada de acesso ao Firestore
// Todas as leituras/escritas do app passam por aqui.
// ════════════════════════════════════════════════════════════

const Store = {

  // ── ESTADO LOCAL (cache em memória, sincronizado com Firestore) ──
  porteiros: [],
  posicoes: [],
  cultos: {},          // { 'YYYY-MM-DD': {...dadosDoCulto} }
  filaRodizio: [],      // [porteiroId, ...]
  config: { nomeIgreja: 'Congregação Cristã no Brasil', localidade: 'Bairro dos Castanhos', adminPasswordHash: null },

  _listeners: [],
  _unsubscribers: [],

  // ── INICIALIZAÇÃO: carrega tudo e escuta mudanças em tempo real ──
  async init() {
    this._unsubscribers.push(
      db.collection('porteiros').orderBy('posicaoFila').onSnapshot(snap => {
        this.porteiros = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this._notify('porteiros');
      })
    );

    this._unsubscribers.push(
      db.collection('posicoes').orderBy('ordem').onSnapshot(snap => {
        this.posicoes = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        this._notify('posicoes');
      })
    );

    this._unsubscribers.push(
      db.collection('cultos').onSnapshot(snap => {
        const novo = {};
        snap.docs.forEach(d => { novo[d.id] = { id: d.id, ...d.data() }; });
        this.cultos = novo;
        this._notify('cultos');
      })
    );

    this._unsubscribers.push(
      db.collection('config').doc('geral').onSnapshot(doc => {
        if (doc.exists) this.config = { ...this.config, ...doc.data() };
        this._notify('config');
      })
    );

    this._unsubscribers.push(
      db.collection('config').doc('filaRodizio').onSnapshot(doc => {
        this.filaRodizio = doc.exists ? (doc.data().ordem || []) : [];
        this._notify('fila');
      })
    );
  },

  on(event, cb) {
    this._listeners.push({ event, cb });
  },

  _notify(event) {
    this._listeners.filter(l => l.event === event || l.event === '*').forEach(l => l.cb());
  },

  // ════════════════════════════════════════════════════════
  // PORTEIROS
  // ════════════════════════════════════════════════════════

  async addPorteiro({ nome, codinome, disponibilidade, telefone, cor }) {
    const corFinal = cor || corParaPorteiro(this.porteiros.length);
    const maiorPosicao = this.porteiros.reduce((max, p) => Math.max(max, p.posicaoFila || 0), 0);
    const doc = {
      nome: nome.trim(),
      codinome: (codinome || '').trim(),
      disponibilidade: disponibilidade || 'todos', // 'todos' | 'terca' | 'sexta'
      telefone: (telefone || '').trim(),
      posicaoFila: maiorPosicao + 1,
      cor: corFinal,
      ativo: true,
      criadoEm: firebase.firestore.FieldValue.serverTimestamp()
    };
    const ref = await db.collection('porteiros').add(doc);

    // adiciona ao final da fila de rodízio também
    const fila = [...this.filaRodizio, ref.id];
    await db.collection('config').doc('filaRodizio').set({ ordem: fila }, { merge: true });

    return ref.id;
  },

  async updatePorteiro(id, dados) {
    await db.collection('porteiros').doc(id).update(dados);
  },

  async removePorteiro(id) {
    await db.collection('porteiros').doc(id).delete();
    const fila = this.filaRodizio.filter(pid => pid !== id);
    await db.collection('config').doc('filaRodizio').set({ ordem: fila }, { merge: true });
  },

  async reordenarFila(novaOrdem) {
    await db.collection('config').doc('filaRodizio').set({ ordem: novaOrdem }, { merge: true });
  },

  getPorteiro(id) {
    return this.porteiros.find(p => p.id === id);
  },

  // ════════════════════════════════════════════════════════
  // POSIÇÕES
  // ════════════════════════════════════════════════════════

  async addPosicao(nome, icone = 'ti-door') {
    const maiorOrdem = this.posicoes.reduce((max, p) => Math.max(max, p.ordem || 0), 0);
    await db.collection('posicoes').add({
      nome: nome.trim(), icone, ordem: maiorOrdem + 1, ativo: true
    });
  },

  async updatePosicao(id, dados) {
    await db.collection('posicoes').doc(id).update(dados);
  },

  async removePosicao(id) {
    await db.collection('posicoes').doc(id).update({ ativo: false });
  },

  async reordenarPosicoes(novaOrdemIds) {
    const batch = db.batch();
    novaOrdemIds.forEach((id, idx) => {
      batch.update(db.collection('posicoes').doc(id), { ordem: idx + 1 });
    });
    await batch.commit();
  },

  getPosicoesAtivas() {
    return this.posicoes.filter(p => p.ativo !== false);
  },

  // ════════════════════════════════════════════════════════
  // CULTOS / ESCALAS
  // ════════════════════════════════════════════════════════

  getCulto(dataISO) {
    return this.cultos[dataISO] || null;
  },

  // Garante que exista um documento de culto fixo para a data (cria se não existir)
  async garantirCultoFixo(dataISO, horario = '19:30') {
    if (this.cultos[dataISO]) return this.cultos[dataISO];
    const dow = diaSemanaDe(dataISO);
    const doc = {
      data: dataISO,
      diaSemana: dow,
      tipo: 'oficial',
      titulo: 'Culto oficial',
      horario,
      geradoPorRodizio: false,
      escalas: {}
    };
    await db.collection('cultos').doc(dataISO).set(doc);
    return doc;
  },

  async addEventoEspecial({ dataISO, titulo, horario }) {
    const doc = {
      data: dataISO,
      diaSemana: diaSemanaDe(dataISO),
      tipo: 'evento',
      titulo: titulo.trim(),
      horario,
      geradoPorRodizio: false,
      escalas: {}
    };
    await db.collection('cultos').doc(dataISO).set(doc, { merge: true });
  },

  async removeCulto(dataISO) {
    await db.collection('cultos').doc(dataISO).delete();
  },

  // Define a escala completa de um culto (substitui escalas[posicaoId])
  async setEscalaCulto(dataISO, escalas) {
    await db.collection('cultos').doc(dataISO).set({ escalas }, { merge: true });
  },

  // ════════════════════════════════════════════════════════
  // RODÍZIO AUTOMÁTICO
  // ════════════════════════════════════════════════════════
  //
  // Regra: fila única e geral. Para cada culto fixo (terça/sexta),
  // o sistema percorre a fila, pulando quem não está disponível
  // naquele dia da semana, e preenche cada posição configurada
  // com 1 porteiro (rotativo). Quem é escalado vai para o fim da fila.
  //
  // Quando o admin remove alguém manualmente de um culto, essa
  // pessoa volta para o INÍCIO da fila (não perde a vez).
  // Quem entra no lugar avança normalmente (vai pro fim).
  // ════════════════════════════════════════════════════════

  async gerarRodizioParaData(dataISO) {
    const dow = diaSemanaDe(dataISO);
    if (!DIAS_CULTO_FIXO.includes(dow)) return; // só gera p/ terça/sexta

    await this.garantirCultoFixo(dataISO);
    const posicoes = this.getPosicoesAtivas();
    if (posicoes.length === 0) return;

    let fila = [...this.filaRodizio].filter(id => this.getPorteiro(id)); // remove ids órfãos
    const escalas = {};
    const usados = new Set();

    for (const posicao of posicoes) {
      // procura o próximo da fila disponível para este dia e ainda não usado neste culto
      let escolhidoIdx = -1;
      for (let i = 0; i < fila.length; i++) {
        const pid = fila[i];
        if (usados.has(pid)) continue;
        const porteiro = this.getPorteiro(pid);
        if (!porteiro || porteiro.ativo === false) continue;
        if (!porteiroDisponivelEm(porteiro, dow)) continue;
        escolhidoIdx = i;
        break;
      }
      if (escolhidoIdx === -1) {
        escalas[posicao.id] = []; // ninguém disponível
        continue;
      }
      const escolhidoId = fila[escolhidoIdx];
      escalas[posicao.id] = [escolhidoId];
      usados.add(escolhidoId);
      // move o escolhido para o fim da fila
      fila.splice(escolhidoIdx, 1);
      fila.push(escolhidoId);
    }

    await this.setEscalaCulto(dataISO, escalas);
    await db.collection('cultos').doc(dataISO).update({ geradoPorRodizio: true });
    await this.reordenarFila(fila);

    return escalas;
  },

  // Garante que os próximos N dias de culto fixo já têm escala gerada
  async garantirRodizioProximasSemanas(semanas = 6) {
    const hoje = new Date();
    const fim = addDays(hoje, semanas * 7);
    const datas = gerarDatasCultoFixo(isoDate(hoje), isoDate(fim));
    for (const dataISO of datas) {
      if (!this.cultos[dataISO] || !this.cultos[dataISO].geradoPorRodizio) {
        await this.gerarRodizioParaData(dataISO);
      }
    }
  },

  // Troca manual: remove um porteiro de uma posição num culto, coloca outro
  // O removido volta pro INÍCIO da fila. O novo segue o fluxo normal (vai pro fim ao ser escalado).
  async trocarPorteiroNoCulto(dataISO, posicaoId, porteiroAntigoId, porteiroNovoId) {
    const culto = this.getCulto(dataISO);
    if (!culto) return;

    const escalas = { ...culto.escalas };
    const lista = (escalas[posicaoId] || []).filter(id => id !== porteiroAntigoId);
    if (porteiroNovoId) lista.push(porteiroNovoId);
    escalas[posicaoId] = lista;

    await this.setEscalaCulto(dataISO, escalas);

    // ajusta a fila: removido volta pro início, novo vai pro fim
    let fila = [...this.filaRodizio];
    if (porteiroAntigoId) {
      fila = fila.filter(id => id !== porteiroAntigoId);
      fila.unshift(porteiroAntigoId);
    }
    if (porteiroNovoId) {
      fila = fila.filter(id => id !== porteiroNovoId);
      fila.push(porteiroNovoId);
    }
    await this.reordenarFila(fila);

    // registra a alteração para o popup de aviso
    await this.registrarAlteracao({
      porteiroId: porteiroNovoId,
      porteiroNome: porteiroNovoId ? this.getPorteiro(porteiroNovoId)?.nome : null,
      tipo: 'entrou',
      cultoData: dataISO,
      posicaoNome: this.posicoes.find(p => p.id === posicaoId)?.nome || ''
    });
    if (porteiroAntigoId) {
      await this.registrarAlteracao({
        porteiroId: porteiroAntigoId,
        porteiroNome: this.getPorteiro(porteiroAntigoId)?.nome,
        tipo: 'saiu',
        cultoData: dataISO,
        posicaoNome: this.posicoes.find(p => p.id === posicaoId)?.nome || ''
      });
    }
  },

  // Adiciona um porteiro a uma posição sem remover ninguém (caso a posição permita múltiplos)
  async adicionarPorteiroNoCulto(dataISO, posicaoId, porteiroId) {
    const culto = await this.garantirCultoFixo(dataISO);
    const escalas = { ...(culto.escalas || {}) };
    const lista = escalas[posicaoId] || [];
    if (!lista.includes(porteiroId)) lista.push(porteiroId);
    escalas[posicaoId] = lista;
    await this.setEscalaCulto(dataISO, escalas);

    let fila = this.filaRodizio.filter(id => id !== porteiroId);
    fila.push(porteiroId);
    await this.reordenarFila(fila);

    await this.registrarAlteracao({
      porteiroId,
      porteiroNome: this.getPorteiro(porteiroId)?.nome,
      tipo: 'entrou',
      cultoData: dataISO,
      posicaoNome: this.posicoes.find(p => p.id === posicaoId)?.nome || ''
    });
  },

  async removerPorteiroDoCulto(dataISO, posicaoId, porteiroId) {
    const culto = this.getCulto(dataISO);
    if (!culto) return;
    const escalas = { ...culto.escalas };
    escalas[posicaoId] = (escalas[posicaoId] || []).filter(id => id !== porteiroId);
    await this.setEscalaCulto(dataISO, escalas);

    let fila = this.filaRodizio.filter(id => id !== porteiroId);
    fila.unshift(porteiroId);
    await this.reordenarFila(fila);

    await this.registrarAlteracao({
      porteiroId,
      porteiroNome: this.getPorteiro(porteiroId)?.nome,
      tipo: 'saiu',
      cultoData: dataISO,
      posicaoNome: this.posicoes.find(p => p.id === posicaoId)?.nome || ''
    });
  },

  // ════════════════════════════════════════════════════════
  // REGISTRO DE ALTERAÇÕES (para o popup "A escala sofreu alterações")
  // ════════════════════════════════════════════════════════

  async registrarAlteracao({ porteiroId, porteiroNome, tipo, cultoData, posicaoNome }) {
    const entrada = {
      porteiroId: porteiroId || null,
      porteiroNome: porteiroNome || 'Porteiro removido',
      tipo, // 'entrou' | 'saiu' | 'trocou'
      cultoData,
      posicaoNome,
      timestamp: Date.now()
    };
    await db.collection('config').doc('geral').set({
      ultimaAlteracaoEm: firebase.firestore.FieldValue.serverTimestamp(),
      ultimoLoteAlteracoes: firebase.firestore.FieldValue.arrayUnion(entrada)
    }, { merge: true });

    // marca um "id de lote" novo para diferenciar de alterações já vistas
    await db.collection('config').doc('geral').set({
      loteAlteracaoId: uid()
    }, { merge: true });
  },

  async limparHistoricoAlteracoes() {
    await db.collection('config').doc('geral').set({
      ultimoLoteAlteracoes: []
    }, { merge: true });
  }
};
