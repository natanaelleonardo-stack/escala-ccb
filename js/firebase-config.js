// ════════════════════════════════════════════════════════════
// CONFIGURAÇÃO DO FIREBASE
// ════════════════════════════════════════════════════════════
// Substitua os valores abaixo pelas chaves do SEU projeto Firebase.
// Onde encontrar: Console Firebase > Configurações do projeto >
// Geral > Seus apps > SDK setup and configuration > Config
// ════════════════════════════════════════════════════════════

const firebaseConfig = {
  apiKey: "AIzaSyBlIGffJakruG1rH5w2HDjS-kxLoj1Hti8",
  authDomain: "escala-ccb-1e9fe.firebaseapp.com",
  projectId: "escala-ccb-1e9fe",
  storageBucket: "escala-ccb-1e9fe.firebasestorage.app",
  messagingSenderId: "123319415955",
  appId: "1:123319415955:web:7b7d21b7bb8b8043150966"
};

// Inicializa o Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// ════════════════════════════════════════════════════════════
// ESTRUTURA DAS COLEÇÕES NO FIRESTORE
// ════════════════════════════════════════════════════════════
//
// /porteiros/{id}
//    nome: string (nome completo)
//    codinome: string (opcional)
//    disponibilidade: "todos" | "terca" | "sexta"
//    telefone: string (opcional)
//    posicaoFila: number (ordem na fila do rodízio)
//    cor: string (hex, atribuída automaticamente p/ calendário)
//    ativo: boolean
//
// /posicoes/{id}
//    nome: string (ex: "Porta Principal")
//    icone: string (nome do ícone tabler)
//    ordem: number
//    ativo: boolean
//
// /cultos/{data}  -- ex: "2026-07-01"
//    data: string (YYYY-MM-DD)
//    diaSemana: number (0-6)
//    tipo: "oficial" | "evento"
//    titulo: string (ex: "Culto oficial" ou "Reunião de jovens")
//    horario: string (ex: "19:30")
//    geradoPorRodizio: boolean
//    escalas: {
//       [posicaoId]: [porteiroId, porteiroId, ...]
//    }
//
// /config/geral
//    nomeIgreja: string
//    localidade: string ("Bairro dos Castanhos")
//    adminPasswordHash: string
//    ultimaAlteracaoEscala: timestamp
//    historicoAlteracoes: [
//       { porteiroId, porteiroNome, tipo: "entrou"|"saiu"|"trocou",
//         cultoData, posicaoNome, timestamp }
//    ]
//
// /config/filaRodizio
//    ordem: [porteiroId, porteiroId, ...]  -- fila viva, em ordem
//
// ════════════════════════════════════════════════════════════
