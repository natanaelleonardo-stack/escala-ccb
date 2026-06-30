// ════════════════════════════════════════════════════════════
// UTILS — funções auxiliares de data, fila, cores, etc.
// ════════════════════════════════════════════════════════════

const DIAS_SEMANA = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];
const DIAS_SEMANA_FULL = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

// Dias da semana em que há culto oficial fixo (2 = Terça, 5 = Sexta)
const DIAS_CULTO_FIXO = [2, 5];

// Paleta de cores para identificação visual dos porteiros no calendário
const PALETA_CORES = [
  '#2a6fd4', '#c0392b', '#1a9e6e', '#9b59b6', '#d97706',
  '#0d3a6e', '#16a085', '#8e44ad', '#c2410c', '#1e6b9e',
  '#7a8b1a', '#a02060', '#2a8b5e', '#6a3aa0', '#b8460e'
];

function corParaPorteiro(index) {
  return PALETA_CORES[index % PALETA_CORES.length];
}

function isoDate(d) {
  return d.toISOString().split('T')[0];
}

function todayISO() {
  return isoDate(new Date());
}

function parseISO(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function formatDiaMes(iso) {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}`;
}

function formatDiaMesAno(iso) {
  const d = parseISO(iso);
  return `${String(d.getDate()).padStart(2,'0')}/${String(d.getMonth()+1).padStart(2,'0')}/${d.getFullYear()}`;
}

function diaSemanaDe(iso) {
  return parseISO(iso).getDay();
}

function addDays(d, n) {
  const dt = new Date(d);
  dt.setDate(dt.getDate() + n);
  return dt;
}

function getMonday(d) {
  const dt = new Date(d);
  const day = dt.getDay();
  const diff = (day === 0) ? -6 : 1 - day;
  dt.setDate(dt.getDate() + diff);
  return dt;
}

// Gera as datas de culto fixo (terça e sexta) dentro de um intervalo
function gerarDatasCultoFixo(dataInicioISO, dataFimISO) {
  const datas = [];
  let cursor = parseISO(dataInicioISO);
  const fim = parseISO(dataFimISO);
  while (cursor <= fim) {
    if (DIAS_CULTO_FIXO.includes(cursor.getDay())) {
      datas.push(isoDate(cursor));
    }
    cursor = addDays(cursor, 1);
  }
  return datas;
}

function uid() {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
}

function initials(name) {
  return name.split(' ').filter(Boolean).map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

// Extrai o primeiro nome de um nome completo (fallback do codinome)
function primeiroNome(nomeCompleto) {
  return nomeCompleto.trim().split(' ')[0];
}

// Nome de exibição: usa codinome se houver, senão primeiro nome
function nomeExibicao(porteiro) {
  if (porteiro.codinome && porteiro.codinome.trim()) return porteiro.codinome.trim();
  return primeiroNome(porteiro.nome);
}

let toastTimer;
function toast(msg) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2800);
}

// Verifica se um porteiro está disponível em um dado dia da semana
function porteiroDisponivelEm(porteiro, diaSemana) {
  if (porteiro.disponibilidade === 'todos') return true;
  if (porteiro.disponibilidade === 'terca') return diaSemana === 2;
  if (porteiro.disponibilidade === 'sexta') return diaSemana === 5;
  return true;
}

// Monta o link do WhatsApp com a mensagem padrão já preenchida
function linkWhatsApp(telefone) {
  const apenasNumeros = (telefone || '').replace(/\D/g, '');
  // assume Brasil (+55) se o número não tiver código de país
  const numeroComDDI = apenasNumeros.length <= 11 ? `55${apenasNumeros}` : apenasNumeros;
  const mensagem = encodeURIComponent('A paz de Deus! Tudo bem?');
  return `https://wa.me/${numeroComDDI}?text=${mensagem}`;
}
