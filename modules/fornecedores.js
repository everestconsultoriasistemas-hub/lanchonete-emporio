// ============================================================
// MÓDULO: FORNECEDORES
// ============================================================
const Fornecedores = {
  dados: [],

  async load() {
    Utils.loading(true);
    const res = await API.call('getFornecedores', {});
    Utils.loading(false);
    this.dados = res.success ? res.data : [];
    this.renderTabela();
  },

  renderTabela() {
    const tbody = document.getElementById('fornecedoresTable');
    if (!tbody) return;

    if (!this.dados.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:2rem;color:#999;">Nenhum fornecedor cadastrado</td></tr>`;
      return;
    }

    tbody.innerHTML = this.dados.map(f => `
      <tr>
        <td>${f.ID}</td>
        <td><strong>${f.NOME}</strong></td>
        <td>${f.TELEFONE || '-'}</td>
        <td>${f.EMAIL || '-'}</td>
        <td><span class="badge badge-primary">${f.PRODUTO_PRINCIPAL || '-'}</span></td>
        <td><span class="badge ${f.ATIVO === 'SIM' ? 'badge-success' : 'badge-danger'}">${f.ATIVO === 'SIM' ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn btn-sm btn-info" onclick="Fornecedores.editar(${f.ID})">✏️</button>
          <button class="btn btn-sm btn-warning" onclick="Fornecedores.toggleAtivo(${f.ID})">${f.ATIVO === 'SIM' ? '🚫' : '✅'}</button>
        </td>
      </tr>`).join('');
  },

  novo() { this.abrirModal(null); },
  editar(id) {
    const f = this.dados.find(f => f.ID == id);
    if (f) this.abrirModal(f);
  },

  abrirModal(f) {
    const titulo = f ? `✏️ Editar: ${f.NOME}` : '➕ Novo Fornecedor';
    Modal.open(titulo, `
      <div class="form-group">
        <label>Nome do Fornecedor *</label>
        <input type="text" class="form-control" id="mFornNome" value="${f?.NOME || ''}" placeholder="Nome da empresa ou pessoa">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Telefone</label>
          <input type="tel" class="form-control" id="mFornTel" value="${f?.TELEFONE || ''}" placeholder="(11) 99999-9999">
        </div>
        <div class="form-group">
          <label>Email</label>
          <input type="email" class="form-control" id="mFornEmail" value="${f?.EMAIL || ''}" placeholder="email@fornecedor.com">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Produto Principal</label>
          <input type="text" class="form-control" id="mFornProd" value="${f?.PRODUTO_PRINCIPAL || ''}" placeholder="Ex: Bebidas, Carnes, Pães...">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" id="mFornAtivo">
            <option value="SIM" ${f?.ATIVO !== 'NAO' ? 'selected' : ''}>Ativo</option>
            <option value="NAO" ${f?.ATIVO === 'NAO' ? 'selected' : ''}>Inativo</option>
          </select>
        </div>
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Fornecedores.salvar(${f?.ID || 'null'})">💾 Salvar</button>`
    );
  },

  async salvar(id) {
    const nome           = document.getElementById('mFornNome')?.value.trim();
    const telefone       = document.getElementById('mFornTel')?.value.trim();
    const email          = document.getElementById('mFornEmail')?.value.trim();
    const produtoPrincipal = document.getElementById('mFornProd')?.value.trim();
    const ativo          = document.getElementById('mFornAtivo')?.value;

    if (!nome) { Utils.toast('Informe o nome do fornecedor!', 'warning'); return; }

    Utils.loading(true);
    const res = await API.call('saveFornecedor', { id, nome, telefone, email, produtoPrincipal, ativo });
    Utils.loading(false);
    if (res.success) {
      Modal.close();
      Utils.toast(res.message, 'success');
      await this.load();
    } else {
      Utils.toast(res.message || 'Erro ao salvar!', 'danger');
    }
  },

  async toggleAtivo(id) {
    const f = this.dados.find(f => f.ID == id);
    if (!f) return;
    const novoStatus = f.ATIVO === 'SIM' ? 'NAO' : 'SIM';
    const acao = novoStatus === 'SIM' ? 'ativar' : 'desativar';
    if (!Utils.confirm(`Deseja ${acao} o fornecedor "${f.NOME}"?`)) return;
    Utils.loading(true);
    const res = await API.call('saveFornecedor', { ...f, id: f.ID, ativo: novoStatus });
    Utils.loading(false);
    if (res.success) { Utils.toast(res.message, 'success'); await this.load(); }
    else Utils.toast(res.message, 'danger');
  }
};