// ============================================================
// MÓDULO: VENDAS - Registro de Vendas por Produto
// ============================================================
const Vendas = {
  carrinho: [],
  cardapio: [],
  formaPagamento: null,

  async load() {
    const caixa = Session.getCaixa();
    const content = document.getElementById('vendasContent');

    if (!caixa) {
      content.innerHTML = `
        <div class="card">
          <div class="card-body">
            <div class="alert alert-danger">
              ❌ Você precisa <strong>abrir o caixa</strong> antes de registrar vendas!
            </div>
            <button class="btn btn-primary" onclick="App.navigate('caixa')">🕐 Ir para Caixa</button>
          </div>
        </div>`;
      return;
    }

    Utils.loading(true);
    const res = await API.call('getCardapio', { apenasAtivos: true });
    Utils.loading(false);
    this.cardapio = res.success ? res.data : [];
    this.carrinho = [];
    this.formaPagamento = null;
    this.render(caixa);
  },

  render(caixa) {
    const categorias = [...new Set(this.cardapio.map(p => p.CATEGORIA))];
    const content = document.getElementById('vendasContent');
    content.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 340px;gap:1rem;align-items:start;">

        <!-- PRODUTOS -->
        <div class="card">
          <div class="card-header">
            <span class="card-title">🍔 Produtos</span>
            <div class="d-flex gap-1" style="flex-wrap:wrap;">
              <button class="btn btn-sm ${!this._catFiltro ? 'btn-secondary' : 'btn-outline'}"
                onclick="Vendas.filtrarCat(null)">Todos</button>
              ${categorias.map(c => `
                <button class="btn btn-sm ${this._catFiltro === c ? 'btn-secondary' : 'btn-outline'}"
                  onclick="Vendas.filtrarCat('${c}')">${c}</button>
              `).join('')}
            </div>
          </div>
          <div class="card-body">
            <div class="produtos-grid" id="produtosGrid"></div>
          </div>
        </div>

        <!-- CARRINHO -->
        <div style="position:sticky;top:70px;">
          <div class="card">
            <div class="card-header">
              <span class="card-title">🛒 Carrinho</span>
              <button class="btn btn-sm btn-danger" onclick="Vendas.limparCarrinho()">🗑️ Limpar</button>
            </div>
            <div class="card-body">
              <div class="carrinho" id="carrinhoLista">
                <div class="empty-state" style="padding:1.5rem;">
                  <div class="empty-icon">🛒</div>
                  <p>Carrinho vazio</p>
                </div>
              </div>
              <div class="carrinho-total mt-1">
                <span>Total:</span>
                <span id="carrinhoTotal" style="color:var(--verde);">R$ 0,00</span>
              </div>
              <hr class="divider">
              <p style="font-size:0.82rem;font-weight:700;color:var(--marrom);margin-bottom:0.5rem;">💳 Forma de Pagamento</p>
              <div class="pagamento-grid">
                ${['DINHEIRO','DEBITO','CREDITO','PIX'].map(f => `
                  <button class="pagamento-btn ${this.formaPagamento === f ? 'selected' : ''}"
                    id="pag-${f}" onclick="Vendas.selecionarPagamento('${f}')">
                    <span class="pag-icon">${{DINHEIRO:'💵',DEBITO:'💳',CREDITO:'💳',PIX:'📱'}[f]}</span>
                    <span>${f}</span>
                  </button>`).join('')}
              </div>
              <button class="btn btn-success btn-block btn-lg mt-1"
                onclick="Vendas.finalizar()" id="btnFinalizar" disabled>
                ✅ FINALIZAR VENDA
              </button>
            </div>
          </div>
        </div>
      </div>`;

    this.renderProdutos();
  },

  filtrarCat(cat) {
    this._catFiltro = cat;
    this.renderProdutos();
    // Atualizar botões de categoria
    document.querySelectorAll('.card-header .btn').forEach(b => {
      b.className = b.className.replace('btn-secondary', 'btn-outline');
    });
  },

  renderProdutos() {
    const grid = document.getElementById('produtosGrid');
    if (!grid) return;
    const lista = this._catFiltro
      ? this.cardapio.filter(p => p.CATEGORIA === this._catFiltro)
      : this.cardapio;

    if (!lista.length) {
      grid.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><div class="empty-icon">🍔</div><p>Nenhum produto</p></div>`;
      return;
    }

    grid.innerHTML = lista.map(p => `
      <button class="produto-btn" onclick="Vendas.addCarrinho(${p.ID})">
        <span class="prod-cat">${p.CATEGORIA}</span>
        <span class="prod-nome">${p.PRODUTO}</span>
        <span class="prod-preco">${Utils.formatMoeda(p.PRECO)}</span>
      </button>`).join('');
  },

  addCarrinho(id) {
    const prod = this.cardapio.find(p => p.ID == id);
    if (!prod) return;
    const item = this.carrinho.find(i => i.id == id);
    if (item) {
      item.quantidade++;
      item.subtotal = item.quantidade * item.precoUnit;
    } else {
      this.carrinho.push({
        id: prod.ID,
        produto: prod.PRODUTO,
        quantidade: 1,
        precoUnit: prod.PRECO,
        subtotal: prod.PRECO
      });
    }
    this.renderCarrinho();
  },

  removerItem(id) {
    const idx = this.carrinho.findIndex(i => i.id == id);
    if (idx === -1) return;
    if (this.carrinho[idx].quantidade > 1) {
      this.carrinho[idx].quantidade--;
      this.carrinho[idx].subtotal = this.carrinho[idx].quantidade * this.carrinho[idx].precoUnit;
    } else {
      this.carrinho.splice(idx, 1);
    }
    this.renderCarrinho();
  },

  renderCarrinho() {
    const lista = document.getElementById('carrinhoLista');
    const totalEl = document.getElementById('carrinhoTotal');
    const btnFin = document.getElementById('btnFinalizar');
    if (!lista) return;

    if (!this.carrinho.length) {
      lista.innerHTML = `<div class="empty-state" style="padding:1.5rem;"><div class="empty-icon">🛒</div><p>Carrinho vazio</p></div>`;
      if (totalEl) totalEl.textContent = 'R$ 0,00';
      if (btnFin) btnFin.disabled = true;
      return;
    }

    lista.innerHTML = this.carrinho.map(item => `
      <div class="carrinho-item">
        <span class="carrinho-item-nome">${item.produto}</span>
        <div class="carrinho-item-qtd">
          <button onclick="Vendas.removerItem(${item.id})">−</button>
          <span>${item.quantidade}</span>
          <button onclick="Vendas.addCarrinho(${item.id})">+</button>
        </div>
        <span class="carrinho-item-preco">${Utils.formatMoeda(item.subtotal)}</span>
      </div>`).join('');

    const total = this.carrinho.reduce((s, i) => s + i.subtotal, 0);
    if (totalEl) totalEl.textContent = Utils.formatMoeda(total);
    if (btnFin) btnFin.disabled = !(this.carrinho.length && this.formaPagamento);
  },

  selecionarPagamento(forma) {
    this.formaPagamento = forma;
    document.querySelectorAll('.pagamento-btn').forEach(b => b.classList.remove('selected'));
    const btn = document.getElementById(`pag-${forma}`);
    if (btn) btn.classList.add('selected');
    const btnFin = document.getElementById('btnFinalizar');
    if (btnFin) btnFin.disabled = !(this.carrinho.length && this.formaPagamento);
  },

  limparCarrinho() {
    this.carrinho = [];
    this.renderCarrinho();
  },

  async finalizar() {
    if (!this.carrinho.length) { Utils.toast('Carrinho vazio!', 'warning'); return; }
    if (!this.formaPagamento) { Utils.toast('Selecione a forma de pagamento!', 'warning'); return; }

    const caixa = Session.getCaixa();
    const user = Session.get();
    const total = this.carrinho.reduce((s, i) => s + i.subtotal, 0);

    // Confirmação
    Modal.open('✅ Confirmar Venda', `
      <div style="text-align:center;">
        <div style="font-size:2rem;margin-bottom:0.5rem;">🛒</div>
        <p style="font-size:1.1rem;margin-bottom:0.5rem;">${this.carrinho.length} item(s)</p>
        <p style="font-size:2rem;font-weight:800;color:var(--verde);">${Utils.formatMoeda(total)}</p>
        <p style="margin-top:0.5rem;">Pagamento: <strong>${this.formaPagamento}</strong></p>
        ${this.formaPagamento === 'DINHEIRO' ? `
          <div class="form-group mt-2" style="text-align:left;">
            <label>Valor Recebido (R$)</label>
            <input type="number" class="form-control" id="valorRecebido" step="0.01" min="${total}"
              placeholder="${total.toFixed(2)}" oninput="Vendas.calcTroco(${total})">
          </div>
          <div id="trocoInfo" style="font-size:1.1rem;font-weight:700;color:var(--marrom);margin-top:0.5rem;"></div>
        ` : ''}
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-success" onclick="Vendas.confirmarVenda()">✅ Confirmar</button>`
    );
  },

  calcTroco(total) {
    const recebido = parseFloat(document.getElementById('valorRecebido')?.value) || 0;
    const troco = recebido - total;
    const el = document.getElementById('trocoInfo');
    if (el) {
      el.textContent = troco >= 0
        ? `Troco: ${Utils.formatMoeda(troco)}`
        : `⚠️ Valor insuficiente!`;
      el.style.color = troco >= 0 ? 'var(--verde)' : 'var(--vermelho)';
    }
  },

  async confirmarVenda() {
    const caixa = Session.getCaixa();
    const user = Session.get();
    const total = this.carrinho.reduce((s, i) => s + i.subtotal, 0);

    Modal.close();
    Utils.loading(true);
    const res = await API.call('registrarVenda', {
      idCaixa: caixa?.idCaixa,
      funcionaria: user.nome,
      formaPagamento: this.formaPagamento,
      total,
      itens: this.carrinho.map(i => ({
        produto: i.produto,
        quantidade: i.quantidade,
        precoUnit: i.precoUnit,
        subtotal: i.subtotal
      }))
    });
    Utils.loading(false);

    if (res.success) {
      Utils.toast(`✅ Venda #${res.idVenda} registrada! Total: ${Utils.formatMoeda(total)}`, 'success');
      this.carrinho = [];
      this.formaPagamento = null;
      this.renderCarrinho();
      // Atualizar totais no caixa
      document.querySelectorAll('.stat-value').forEach(el => {});
    } else {
      Utils.toast(res.message || 'Erro ao registrar venda!', 'danger');
    }
  }
};