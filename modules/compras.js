// ============================================================
// MÓDULO: COMPRAS - Registro e Alimentação de Contas a Pagar
// ============================================================
const Compras = {
  dados: [],
  fornecedores: [],

  async load() {
    Utils.loading(true);
    const [resComp, resForns] = await Promise.all([
      API.call('getCompras', {
        dataInicio: document.getElementById('comprasDe')?.value || '',
        dataFim:    document.getElementById('comprasAte')?.value || ''
      }),
      API.call('getFornecedores', { apenasAtivos: true })
    ]);
    Utils.loading(false);
    this.dados        = resComp.success  ? resComp.data  : [];
    this.fornecedores = resForns.success ? resForns.data : [];
    this.renderTabela();
  },

  renderTabela() {
    const tbody = document.getElementById('comprasTable');
    if (!tbody) return;

    if (!this.dados.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:2rem;color:#999;">Nenhuma compra registrada</td></tr>`;
      return;
    }

    const total = this.dados.reduce((s, c) => s + (c.TOTAL || 0), 0);
    tbody.innerHTML = this.dados.map(c => `
      <tr>
        <td>${c.ID}</td>
        <td>${c.DATA}</td>
        <td><strong>${c.FORNECEDOR}</strong></td>
        <td class="text-vermelho fw-bold">${Utils.formatMoeda(c.TOTAL)}</td>
        <td><span class="badge badge-info">${c.FORMA_PAGAMENTO === 'A_VISTA' ? '💵 À Vista' : '📅 A Prazo'}</span></td>
        <td>
          ${c.ID_CONTA_PAGAR
            ? `<span class="badge badge-warning">Conta #${c.ID_CONTA_PAGAR}</span>`
            : '<span class="badge badge-success">Pago</span>'}
        </td>
      </tr>`).join('');

    // Total
    const tfoot = tbody.closest('table');
    let tfootEl = tfoot.querySelector('tfoot');
    if (!tfootEl) {
      tfootEl = document.createElement('tfoot');
      tfoot.appendChild(tfootEl);
    }
    tfootEl.innerHTML = `
      <tr style="background:var(--cinza-claro);font-weight:800;">
        <td colspan="3" style="padding:0.7rem 1rem;">TOTAL DO PERÍODO</td>
        <td class="text-vermelho" style="padding:0.7rem 1rem;">${Utils.formatMoeda(total)}</td>
        <td colspan="2"></td>
      </tr>`;
  },

  novo() { this.abrirModal(); },

  abrirModal() {
    Modal.open('🛍️ Registrar Nova Compra', `
      <div class="form-group">
        <label>Fornecedor *</label>
        <select class="form-control" id="mCompForn">
          <option value="">Selecione o fornecedor...</option>
          ${this.fornecedores.map(f =>
            `<option value="${f.ID}" data-nome="${f.NOME}">${f.NOME} - ${f.PRODUTO_PRINCIPAL || ''}</option>`
          ).join('')}
        </select>
      </div>

      <div id="mCompItens">
        <div class="card-header" style="padding:0.5rem 0;margin-bottom:0.5rem;">
          <span style="font-weight:700;color:var(--marrom);">📦 Itens da Compra</span>
          <button type="button" class="btn btn-sm btn-primary" onclick="Compras.addItem()">+ Item</button>
        </div>
        <div id="mCompItensList">
          ${this.renderItemCompra(0)}
        </div>
      </div>

      <div class="alert alert-warning mt-1" style="text-align:center;font-size:1.1rem;font-weight:700;" id="mCompTotal">
        Total: R$ 0,00
      </div>

      <div class="form-row">
        <div class="form-group">
          <label>Forma de Pagamento *</label>
          <select class="form-control" id="mCompPagamento">
            <option value="A_PRAZO">📅 A Prazo (gera conta a pagar)</option>
            <option value="A_VISTA">💵 À Vista (já pago)</option>
          </select>
        </div>
        <div class="form-group">
          <label>Data de Vencimento</label>
          <input type="date" class="form-control" id="mCompVenc">
        </div>
      </div>
      <div class="alert alert-info" style="font-size:0.82rem;">
        ℹ️ Compras <strong>A Prazo</strong> geram automaticamente uma conta a pagar.
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Compras.salvar()">💾 Registrar Compra</button>`
    );

    // Data de vencimento padrão: 30 dias
    const venc = document.getElementById('mCompVenc');
    if (venc) {
      const d = new Date();
      d.setDate(d.getDate() + 30);
      venc.value = d.toISOString().split('T')[0];
    }
  },

  _itemCount: 1,
  renderItemCompra(idx) {
    return `
      <div class="carrinho-item" id="mCompItem${idx}" style="flex-wrap:wrap;gap:0.5rem;padding:0.5rem 0;">
        <input type="text" class="form-control" style="flex:2;min-width:120px;"
          id="mCompItemNome${idx}" placeholder="Descrição do item" oninput="Compras.calcTotal()">
        <input type="number" class="form-control" style="flex:1;min-width:70px;"
          id="mCompItemQtd${idx}" placeholder="Qtd" min="1" step="1" value="1" oninput="Compras.calcTotal()">
        <input type="number" class="form-control" style="flex:1;min-width:90px;"
          id="mCompItemPreco${idx}" placeholder="R$ Unit." min="0" step="0.01" oninput="Compras.calcTotal()">
        ${idx > 0 ? `<button type="button" class="btn btn-sm btn-danger" onclick="Compras.removeItem(${idx})">✕</button>` : ''}
      </div>`;
  },

  addItem() {
    const list = document.getElementById('mCompItensList');
    if (!list) return;
    const div = document.createElement('div');
    div.innerHTML = this.renderItemCompra(this._itemCount);
    list.appendChild(div.firstElementChild);
    this._itemCount++;
  },

  removeItem(idx) {
    document.getElementById(`mCompItem${idx}`)?.remove();
    this.calcTotal();
  },

  calcTotal() {
    let total = 0;
    for (let i = 0; i < this._itemCount; i++) {
      const qtd   = parseFloat(document.getElementById(`mCompItemQtd${i}`)?.value)   || 0;
      const preco = parseFloat(document.getElementById(`mCompItemPreco${i}`)?.value) || 0;
      total += qtd * preco;
    }
    const el = document.getElementById('mCompTotal');
    if (el) el.textContent = `Total: ${Utils.formatMoeda(total)}`;
    return total;
  },

  async salvar() {
    const fornSel  = document.getElementById('mCompForn');
    const idForn   = fornSel?.value;
    const nomeForn = fornSel?.options[fornSel.selectedIndex]?.dataset.nome || '';
    const pagamento   = document.getElementById('mCompPagamento')?.value;
    const vencimento  = document.getElementById('mCompVenc')?.value;

    if (!idForn) { Utils.toast('Selecione o fornecedor!', 'warning'); return; }

    // Coletar itens
    const itens = [];
    for (let i = 0; i < this._itemCount; i++) {
      const nome  = document.getElementById(`mCompItemNome${i}`)?.value.trim();
      const qtd   = parseFloat(document.getElementById(`mCompItemQtd${i}`)?.value)   || 0;
      const preco = parseFloat(document.getElementById(`mCompItemPreco${i}`)?.value) || 0;
      if (nome && qtd > 0 && preco > 0) itens.push({ nome, qtd, preco, subtotal: qtd * preco });
    }

    if (!itens.length) { Utils.toast('Adicione pelo menos um item!', 'warning'); return; }

    const total = itens.reduce((s, i) => s + i.subtotal, 0);

    Utils.loading(true);
    const res = await API.call('saveCompra', {
      idFornecedor: idForn,
      fornecedor: nomeForn,
      total,
      formaPagamento: pagamento,
      dataVencimento: vencimento,
      itens
    });
    Utils.loading(false);

    if (res.success) {
      Modal.close();
      this._itemCount = 1;
      const msg = pagamento === 'A_PRAZO'
        ? `✅ Compra registrada! Conta a pagar #${res.idConta} criada automaticamente.`
        : `✅ Compra registrada como paga!`;
      Utils.toast(msg, 'success');
      await this.load();
    } else {
      Utils.toast(res.message || 'Erro ao registrar compra!', 'danger');
    }
  }
};