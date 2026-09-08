// ============================================================
// MÓDULO: DESPESAS FIXAS
// ============================================================
const Despesas = {
  dados: [],

  async load() {
    Utils.loading(true);
    const res = await API.call('getDespesasFixas', {});
    Utils.loading(false);
    this.dados = res.success ? res.data : [];
    this.renderTabela();
  },

  renderTabela() {
    const tbody   = document.getElementById('despesasTable');
    const totalEl = document.getElementById('despesasTotal');
    if (!tbody) return;

    if (!this.dados.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:2rem;color:#999;">Nenhuma despesa fixa cadastrada</td></tr>`;
      if (totalEl) totalEl.textContent = '';
      return;
    }

    let totalAtivo = 0;
    tbody.innerHTML = this.dados.map(d => {
      if (d.ATIVO === 'SIM') totalAtivo += d.VALOR || 0;
      return `<tr>
        <td>${d.ID}</td>
        <td><strong>${d.DESCRICAO}</strong></td>
        <td class="fw-bold text-vermelho">${Utils.formatMoeda(d.VALOR)}</td>
        <td>Todo dia <strong>${d.DIA_VENCIMENTO}</strong></td>
        <td><span class="badge ${d.ATIVO === 'SIM' ? 'badge-success' : 'badge-danger'}">${d.ATIVO === 'SIM' ? 'Ativa' : 'Inativa'}</span></td>
        <td>
          <button class="btn btn-sm btn-info" onclick="Despesas.editar(${d.ID})">✏️</button>
          <button class="btn btn-sm btn-warning" onclick="Despesas.toggleAtivo(${d.ID})">${d.ATIVO === 'SIM' ? '🚫 Desativar' : '✅ Ativar'}</button>
        </td>
      </tr>`;
    }).join('');

    if (totalEl) {
      totalEl.innerHTML = `Total mensal de despesas fixas ativas: <span class="text-vermelho">${Utils.formatMoeda(totalAtivo)}</span>`;
    }
  },

  novo() { this.abrirModal(null); },
  editar(id) {
    const d = this.dados.find(d => d.ID == id);
    if (d) this.abrirModal(d);
  },

  abrirModal(d) {
    const titulo = d ? `✏️ Editar: ${d.DESCRICAO}` : '➕ Nova Despesa Fixa';
    Modal.open(titulo, `
      <div class="alert alert-info" style="font-size:0.82rem;">
        ℹ️ Despesas fixas são gastos recorrentes todo mês (aluguel, energia, água, etc.)
      </div>
      <div class="form-group">
        <label>Descrição *</label>
        <input type="text" class="form-control" id="mDespDesc"
          value="${d?.DESCRICAO || ''}" placeholder="Ex: Aluguel, Energia Elétrica, Água...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Valor Mensal (R$) *</label>
          <input type="number" class="form-control" id="mDespValor"
            step="0.01" min="0" value="${d?.VALOR || ''}" placeholder="0,00">
        </div>
        <div class="form-group">
          <label>Dia de Vencimento *</label>
          <input type="number" class="form-control" id="mDespDia"
            min="1" max="31" value="${d?.DIA_VENCIMENTO || ''}" placeholder="Ex: 10">
        </div>
      </div>
      <div class="form-group">
        <label>Status</label>
        <select class="form-control" id="mDespAtivo">
          <option value="SIM" ${d?.ATIVO !== 'NAO' ? 'selected' : ''}>Ativa</option>
          <option value="NAO" ${d?.ATIVO === 'NAO' ? 'selected' : ''}>Inativa</option>
        </select>
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Despesas.salvar(${d?.ID || 'null'})">💾 Salvar</button>`
    );
  },

  async salvar(id) {
    const descricao     = document.getElementById('mDespDesc')?.value.trim();
    const valor         = parseFloat(document.getElementById('mDespValor')?.value);
    const diaVencimento = parseInt(document.getElementById('mDespDia')?.value);
    const ativo         = document.getElementById('mDespAtivo')?.value;

    if (!descricao) { Utils.toast('Informe a descrição!', 'warning'); return; }
    if (!valor || valor <= 0) { Utils.toast('Informe o valor!', 'warning'); return; }
    if (!diaVencimento || diaVencimento < 1 || diaVencimento > 31) {
      Utils.toast('Informe um dia de vencimento válido (1-31)!', 'warning'); return;
    }

    Utils.loading(true);
    const res = await API.call('saveDespesaFixa', { id, descricao, valor, diaVencimento, ativo });
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
    const d = this.dados.find(d => d.ID == id);
    if (!d) return;
    const novoStatus = d.ATIVO === 'SIM' ? 'NAO' : 'SIM';
    const acao = novoStatus === 'SIM' ? 'ativar' : 'desativar';
    if (!Utils.confirm(`Deseja ${acao} a despesa "${d.DESCRICAO}"?`)) return;
    Utils.loading(true);
    const res = await API.call('saveDespesaFixa', { ...d, id: d.ID, ativo: novoStatus });
    Utils.loading(false);
    if (res.success) { Utils.toast(res.message, 'success'); await this.load(); }
    else Utils.toast(res.message, 'danger');
  }
};