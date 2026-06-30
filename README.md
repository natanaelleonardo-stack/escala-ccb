# Escala de Porteiros — CCB Bairro dos Castanhos

App PWA para gestão da escala de porteiros, com rodízio automático entre os
voluntários disponíveis.

---

## 🚀 Passo a passo para colocar no ar

### 1. Criar o projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. **Criar projeto** → dê um nome (ex: `escala-porteiros-castanhos`)
3. Pode desativar o Google Analytics (não é necessário)
4. Aguarde a criação

### 2. Ativar o Firestore (banco de dados)

1. No menu lateral, vá em **Compilação → Firestore Database**
2. **Criar banco de dados**
3. Escolha **Iniciar no modo de produção**
4. Escolha a localização `southamerica-east1` (São Paulo) — fica mais rápido
5. Depois de criado, vá na aba **Regras** e substitua por:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read: if true;
      allow write: if true;
    }
  }
}
```

> ⚠️ Essas regras liberam escrita para qualquer pessoa com o link do app.
> Como não há sistema de autenticação real (só uma senha local), isso é
> aceitável para uso interno de uma única congregação, mas **não deixe o
> link circular publicamente fora do grupo de porteiros**. Se quiser reforçar
> a segurança depois, podemos evoluir para Firebase Authentication.

### 3. Registrar um app Web no projeto

1. Na tela inicial do projeto, clique no ícone **`</>`** (Web)
2. Dê um apelido (ex: "Escala Porteiros Web")
3. **Não** marque "Configurar Firebase Hosting" (vamos usar GitHub Pages)
4. Copie o bloco `firebaseConfig` que aparece — você vai precisar dele no próximo passo

### 4. Configurar as chaves no projeto

Abra o arquivo `js/firebase-config.js` e substitua:

```js
const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO_ID",
  storageBucket: "SEU_PROJETO.firebasestorage.app",
  messagingSenderId: "SEU_SENDER_ID",
  appId: "SEU_APP_ID"
};
```

Pelos valores reais que o Firebase te deu no passo 3.

### 5. Subir para o GitHub Pages

```bash
git init
git add .
git commit -m "Setup inicial do app de escala de porteiros"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/escala-porteiros.git
git push -u origin main
```

Depois, no GitHub:
1. **Settings → Pages**
2. Em "Source", selecione a branch `main` e pasta `/ (root)`
3. Salve e aguarde alguns minutos
4. Seu app estará em algo como `https://seu-usuario.github.io/escala-porteiros`

### 6. Primeiro acesso

1. Abra o link no celular
2. Toque no ícone de cadeado (🔒) no canto inferior direito
3. Digite **qualquer senha** — ela vira automaticamente a senha do admin
   (guarde essa senha! pode trocá-la depois em Configurações)
4. Cadastre as posições (Porta Principal, Porta Lateral, Estacionamento...)
5. Cadastre os porteiros
6. O sistema gera o rodízio automaticamente para as próximas 6 semanas

### 7. Instalar como app no celular

No celular de cada porteiro:

**Android (Chrome):**
1. Abrir o link
2. Menu (⋮) → **Adicionar à tela inicial**

**iPhone (Safari):**
1. Abrir o link
2. Botão de compartilhar (□↑) → **Adicionar à Tela de Início**

---

## 📂 Estrutura do projeto

```
escala-porteiros/
├── index.html              # Estrutura principal
├── manifest.json           # Configuração do PWA
├── service-worker.js       # Cache offline do "casco" do app
├── assets/
│   └── brasao-ccb.png      # Brasão oficial CCB
├── icons/                  # Ícones do PWA (gerados a partir do brasão)
├── css/
│   └── styles.css          # Identidade visual (cinza + azul institucional)
└── js/
    ├── firebase-config.js  # ⚠️ Editar com suas chaves
    ├── utils.js             # Funções auxiliares de data/cor/etc.
    ├── store.js             # Acesso ao Firestore + lógica do rodízio
    ├── auth.js               # Login simples do admin
    ├── router.js             # Navegação entre telas
    ├── app.js                # Inicialização geral
    └── screens/
        ├── home.js
        ├── detalheCulto.js
        ├── escalaAdmin.js
        ├── minhaEscala.js
        ├── calendario.js
        ├── adminPorteiros.js
        └── adminPosicoes.js
```

## 🔁 Lógica do rodízio automático

- Existe **uma fila única** com todos os porteiros, em ordem
- Toda terça e sexta, o sistema preenche cada posição cadastrada puxando o
  próximo da fila que esteja **disponível para aquele dia da semana**
  (configurado no cadastro: todos os cultos / só terça / só sexta)
- Quem é escalado **vai para o fim da fila**
- O admin pode trocar manualmente a qualquer momento:
  - Quem **sai** do culto volta para o **início** da fila (não perde a vez)
  - Quem **entra** segue o fluxo normal (vai para o fim ao ser escalado)
- Eventos especiais **não** entram no rodízio automático — são escalados
  manualmente pelo admin

## 🔔 Aviso de alterações

Sempre que o admin faz qualquer alteração na escala, todos que abrirem o
app verão um popup ("A paz de Deus...") listando quem entrou, saiu ou
trocou de posição, até confirmarem que viram ("Ok, entendi").

## 🎨 Trocar o ícone do app

Quando tiver o ícone próprio desenhado, basta:
1. Substituir `assets/brasao-ccb.png` (ou gerar um novo ícone a partir dele)
2. Eu posso gerar as variações de tamanho automaticamente — é só enviar
