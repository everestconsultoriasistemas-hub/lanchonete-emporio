// ============================================================
// MÓDULO: CONSUMO DE FUNCIONÁRIOS
// ============================================================
const Consumo = {
  dados: [],
  funcionarios: [],

  async load() {
    Utils.loading(true);
    const [resFunc, resConsumo] = await Promise.all([
      API.call('getFuncionarios', { apenasAtivos: true }),
      API.call('getConsumoFunc', {
        idFuncionario: document.getElementById('filtroConsumoFunc')?.value || '',
        mesAno: document.getElementById('filtroConsumoMes')?.value || ''
      })
    ]);
    Utils.loading(false);

    this.funcionarios = resFunc.success ? resFunc.data : [];
    this.dados = resConsumo.success ? resConsumo.data : [];

    // Preencher select de funcionárias
    const sel = document.getElementById('filtroConsumoFunc');
    if (sel && sel.options.length <= 1) {
      this.funcionarios.forEach(f => {
        const opt = document.createElement('option');
        opt.value = f.ID; opt.textContent = f.NOME;
        sel.appendChild(opt);
      });
    }

    // Mês atual como padrão
    const mesEl = document.getElementById('filtroConsumoMes');
    if (mesEl && !mesEl.value) {
      const now = new Date();
      mesEl.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    }

    this.renderTabela();
  },

  renderTabela() {
    const tbody = document.getElementById('consumoTable');
    const totalEl = document.getElementById('consumoTotal');
    if (!tbody) return;

    if (!this.dados.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:2rem;color:#999;">Nenhum consumo registrado</td></tr>`;
      if (totalEl) totalEl.textContent = '';
      return;
    }

    let total = 0;
    tbody.innerHTML = this.dados.map(c => {
      total += c.VALOR_TOTAL || 0;
      return `<tr>
        <td>${c.ID}</td>
        <td><strong>${c.FUNCIONARIO}</strong></td>
        <td>${c.DATA}</td>
        <td>${c.PRODUTO}</td>
        <td>${c.QUANTIDADE}</td>
        <td class="text-vermelho fw-bold">${Utils.formatMoeda(c.VALOR_TOTAL)}</td>
      </tr>`;
    }).join('');

    if (totalEl) {
      totalEl.innerHTML = `Total de consumo no período: <span class="text-vermelho">${Utils.formatMoeda(total)}</span>`;
    }
  },

  novo() {
    this.abrirModal();
  },

  async abrirModal() {
    // Carregar cardápio para seleção
    const resCard = await API.call('getCardapio', { apenasAtivos: true });
    const cardapio = resCard.success ? resCard.data : [];

    Modal.open('🍽️ Registrar Consumo de Funcionária', `
      <div class="form-group">
        <label>Funcionária *</label>
        <select class="form-control" id="mConsFunc">
          <option value="">Selecione...</option>
          ${this.funcionarios.map(f => `<option value="${f.ID}" data-nome="${f.NOME}">${f.NOME}</option>`).join('')}
        </select>
      </div>
      <div class="form-group">
        <label>Produto *</label>
        <select class="form-control" id="mConsProd" onchange="Consumo.updatePreco()">
          <option value="">Selecione...</option>
          ${cardapio.map(p => `<option value="${p.PRODUTO}" data-preco="${p.PRECO}">${p.PRODUTO} - ${Utils.formatMoeda(p.PRECO)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Quantidade *</label>
          <input type="number" class="form-control" id="mConsQtd" min="1" step="1" value="1"
            oninput="Consumo.updateTotal()">
        </div>
        <div class="form-group">
          <label>Preço Unitário (R$)</label>
          <input type="number" class="form-control" id="mConsPreco" step="0.01" min="0"
            placeholder="0,00" oninput="Consumo.updateTotal()">
        </div>
      </div>
      <div class="alert alert-warning" id="mConsTotal" style="text-align:center;font-size:1.1rem;font-weight:700;">
        Total: R$ 0,00
      </div>
      <div class="alert alert-info" style="font-size:0.82rem;">
        ℹ️ Este valor será descontado automaticamente na folha de pagamento do mês.
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Consumo.salvar()">💾 Registrar</button>`
    );
  },

  updatePreco() {
    const sel = document.getElementById('mConsProd');
    const opt = sel?.options[sel.selectedIndex];
    const preco = opt?.dataset.preco || 0;
    const precoEl = document.getElementById('mConsPreco');
    if (precoEl) precoEl.value = preco;
    this.updateTotal();
  },

  updateTotal() {
    const qtd   = parseFloat(document.getElementById('mConsQtd')?.value) || 0;
    const preco = parseFloat(document.getElementById('mConsPreco')?.value) || 0;
    const total = qtd * preco;
    const el = document.getElementById('mConsTotal');
    if (el) el.textContent = `Total: ${Utils.formatMoeda(total)}`;
  },

  async salvar() {
    const funcSel  = document.getElementById('mConsFunc');
    const idFunc   = funcSel?.value;
    const nomeFunc = funcSel?.options[funcSel.selectedIndex]?.dataset.nome || '';
    const produto  = document.getElementById('mConsProd')?.value;
    const qtd      = parseFloat(document.getElementById('mConsQtd')?.value) || 0;
    const preco    = parseFloat(document.getElementById('mConsPreco')?.value) || 0;
    const total    = qtd * preco;

    if (!idFunc)   { Utils.toast('Selecione a funcionária!', 'warning'); return; }
    if (!produto)  { Utils.toast('Selecione o produto!', 'warning'); return; }
    if (qtd <= 0)  { Utils.toast('Informe a quantidade!', 'warning'); return; }
    if (preco <= 0){ Utils.toast('Informe o preço!', 'warning'); return; }

    Utils.loading(true);
    const res = await API.call('saveConsumoFunc', {
      idFuncionario: idFunc,
      funcionario: nomeFunc,
      produto, quantidade: qtd, valorTotal: total
    });
    Utils.loading(false);

    if (res.success) {
      Modal.close();
      Utils.toast('✅ Consumo registrado! Será descontado na folha.', 'success');
      await this.load();
    } else {
      Utils.toast(res.message || 'Erro ao registrar!', 'danger');
    }
  }
};