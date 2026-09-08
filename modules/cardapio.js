// ============================================================
// MÓDULO: CARDÁPIO - Produtos e Preços
// ============================================================
const Cardapio = {
  dados: [],

  async load() {
    Utils.loading(true);
    const res = await API.call('getCardapio', {});
    Utils.loading(false);
    this.dados = res.success ? res.data : [];

    // Preencher filtro de categorias
    const sel = document.getElementById('filtroCategoria');
    if (sel && sel.options.length <= 1) {
      const cats = [...new Set(this.dados.map(p => p.CATEGORIA))];
      cats.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        sel.appendChild(opt);
      });
    }
    this.renderTabela();
  },

  renderTabela() {
    const tbody = document.getElementById('cardapioTable');
    if (!tbody) return;
    const filtCat = document.getElementById('filtroCategoria')?.value || '';
    const filtNome = (document.getElementById('filtroCardapio')?.value || '').toLowerCase();

    let lista = this.dados;
    if (filtCat) lista = lista.filter(p => p.CATEGORIA === filtCat);
    if (filtNome) lista = lista.filter(p => p.PRODUTO.toLowerCase().includes(filtNome));

    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:2rem;color:#999;">Nenhum produto encontrado</td></tr>`;
      return;
    }

    tbody.innerHTML = lista.map(p => {
      const margem = p.PRECO && p.CUSTO ? (((p.PRECO - p.CUSTO) / p.PRECO) * 100).toFixed(1) : '-';
      const margemCor = margem > 40 ? 'verde' : margem > 20 ? 'laranja' : 'vermelho';
      return `<tr>
        <td>${p.ID}</td>
        <td><strong>${p.PRODUTO}</strong></td>
        <td><span class="badge badge-primary">${p.CATEGORIA}</span></td>
        <td class="text-verde fw-bold">${Utils.formatMoeda(p.PRECO)}</td>
        <td>${Utils.formatMoeda(p.CUSTO)}</td>
        <td><span class="text-${margemCor} fw-bold">${margem}%</span></td>
        <td><span class="badge ${p.ATIVO === 'SIM' ? 'badge-success' : 'badge-danger'}">${p.ATIVO === 'SIM' ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn btn-sm btn-info" onclick="Cardapio.editar(${p.ID})">✏️</button>
          <button class="btn btn-sm btn-warning" onclick="Cardapio.toggleAtivo(${p.ID})">${p.ATIVO === 'SIM' ? '🚫' : '✅'}</button>
        </td>
      </tr>`;
    }).join('');
  },

  novo() {
    this.abrirModal(null);
  },

  editar(id) {
    const prod = this.dados.find(p => p.ID == id);
    if (prod) this.abrirModal(prod);
  },

  abrirModal(prod) {
    const titulo = prod ? `✏️ Editar: ${prod.PRODUTO}` : '➕ Novo Produto';
    const cats = CONFIG.CATEGORIAS_CARDAPIO;
    Modal.open(titulo, `
      <div class="form-group">
        <label>Nome do Produto *</label>
        <input type="text" class="form-control" id="mProdNome" value="${prod?.PRODUTO || ''}" placeholder="Ex: X-Burguer">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Categoria *</label>
          <select class="form-control" id="mProdCat">
            ${cats.map(c => `<option value="${c}" ${prod?.CATEGORIA === c ? 'selected' : ''}>${c}</option>`).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" id="mProdAtivo">
            <option value="SIM" ${prod?.ATIVO !== 'NAO' ? 'selected' : ''}>Ativo</option>
            <option value="NAO" ${prod?.ATIVO === 'NAO' ? 'selected' : ''}>Inativo</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Preço de Venda (R$) *</label>
          <input type="number" class="form-control" id="mProdPreco" step="0.01" min="0"
            value="${prod?.PRECO || ''}" placeholder="0,00">
        </div>
        <div class="form-group">
          <label>Custo (R$)</label>
          <input type="number" class="form-control" id="mProdCusto" step="0.01" min="0"
            value="${prod?.CUSTO || ''}" placeholder="0,00">
        </div>
      </div>
      <div id="margemPreview" style="text-align:center;font-weight:700;color:var(--marrom);margin-top:0.5rem;"></div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Cardapio.salvar(${prod?.ID || 'null'})">💾 Salvar</button>`
    );

    // Calcular margem em tempo real
    ['mProdPreco', 'mProdCusto'].forEach(id => {
      document.getElementById(id)?.addEventListener('input', () => {
        const preco = parseFloat(document.getElementById('mProdPreco').value) || 0;
        const custo = parseFloat(document.getElementById('mProdCusto').value) || 0;
        const el = document.getElementById('margemPreview');
        if (preco && custo) {
          const margem = ((preco - custo) / preco * 100).toFixed(1);
          el.textContent = `Margem de lucro: ${margem}%`;
          el.style.color = margem > 40 ? 'var(--verde)' : margem > 20 ? 'var(--laranja)' : 'var(--vermelho)';
        } else {
          el.textContent = '';
        }
      });
    });
  },

  async salvar(id) {
    const nome = document.getElementById('mProdNome')?.value.trim();
    const cat  = document.getElementById('mProdCat')?.value;
    const preco = parseFloat(document.getElementById('mProdPreco')?.value);
    const custo = parseFloat(document.getElementById('mProdCusto')?.value) || 0;
    const ativo = document.getElementById('mProdAtivo')?.value;

    if (!nome) { Utils.toast('Informe o nome do produto!', 'warning'); return; }
    if (!preco || preco <= 0) { Utils.toast('Informe o preço de venda!', 'warning'); return; }

    Utils.loading(true);
    const res = await API.call('saveCardapio', { id, produto: nome, categoria: cat, preco, custo, ativo });
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
    const prod = this.dados.find(p => p.ID == id);
    if (!prod) return;
    const novoStatus = prod.ATIVO === 'SIM' ? 'NAO' : 'SIM';
    const acao = novoStatus === 'SIM' ? 'ativar' : 'desativar';
    if (!Utils.confirm(`Deseja ${acao} o produto "${prod.PRODUTO}"?`)) return;

    Utils.loading(true);
    const res = await API.call('saveCardapio', {
      id: prod.ID, produto: prod.PRODUTO, categoria: prod.CATEGORIA,
      preco: prod.PRECO, custo: prod.CUSTO, ativo: novoStatus
    });
    Utils.loading(false);
    if (res.success) { Utils.toast(res.message, 'success'); await this.load(); }
    else Utils.toast(res.message, 'danger');
  }
};