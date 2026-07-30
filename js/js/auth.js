// ════════════════════════════════════════════════════════════
// AUTH — login simples de administrador (sem usuário, só senha)
// A senha fica em /config/geral, como hash simples (SHA-256).
// ════════════════════════════════════════════════════════════

const Auth = {
  isAdmin: false,

  async _hash(texto) {
    const enc = new TextEncoder().encode(texto);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  },

  async login(senha) {
    const hashDigitado = await this._hash(senha);
    const hashSalvo = Store.config.adminPasswordHash;

    // Primeiro acesso: se não há senha configurada, qualquer senha digitada vira a senha inicial
    if (!hashSalvo) {
      await db.collection('config').doc('geral').set({ adminPasswordHash: hashDigitado }, { merge: true });
      this.isAdmin = true;
      return true;
    }

    if (hashDigitado === hashSalvo) {
      this.isAdmin = true;
      return true;
    }
    return false;
  },

  async changePassword(novaSenha) {
    const hash = await this._hash(novaSenha);
    await db.collection('config').doc('geral').set({ adminPasswordHash: hash }, { merge: true });
  },

  logout() {
    this.isAdmin = false;
  }
};
