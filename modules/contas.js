// ============================================================
// MÓDULO: CONTAS A PAGAR
// ============================================================
const Contas = {
  dados: [],

  async load() {
    Utils.loading(true);
    const res = await API.call('getContasPagar', {
      status: document.getElementById('filtroContasStatus')?.value || '',
    });
    Utils.loading(false);
    this.dados = res.success ? res.data : [];

    // Preencher filtro de categorias
    const selCat = document.getElementById('filtroContasCat');
    if (selCat && selCat.options.length <= 1) {
      CONFIG.CATEGORIAS_CONTAS.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c; opt.textContent = c;
        selCat.appendChild(opt);
      });
    }

    this.renderTabela();
  },

  renderTabela() {
    const tbody   = document.getElementById('contasTable');
    const totalEl = document.getElementById('contasTotal');
    if (!tbody) return;

    const filtCat = document.getElementById('filtroContasCat')?.value || '';
    let lista = this.dados;
    if (filtCat) lista = lista.filter(c => c.CATEGORIA === filtCat);

    if (!lista.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:2rem;color:#999;">Nenhuma conta encontrada</td></tr>`;
      if (totalEl) totalEl.textContent = '';
      return;
    }

    const hoje = new Date();
    let totalPendente = 0;

    tbody.innerHTML = lista.map(c => {
      const venc = c.DATA_VENCIMENTO ? new Date(c.DATA_VENCIMENTO.split('/').reverse().join('-')) : null;
      const atrasada = venc && venc < hoje && c.STATUS === 'PENDENTE';
      const venceHoje = venc && venc.toDateString() === hoje.toDateString() && c.STATUS === 'PENDENTE';

      if (c.STATUS === 'PENDENTE') totalPendente += c.VALOR || 0;

      let statusBadge;
      if (c.STATUS === 'PAGO') {
        statusBadge = `<span class="badge badge-success">✅ PAGO</span>`;
      } else if (atrasada) {
        statusBadge = `<span class="badge badge-danger">🔴 ATRASADA</span>`;
      } else if (venceHoje) {
        statusBadge = `<span class="badge badge-warning">⚠️ VENCE HOJE</span>`;
      } else {
        statusBadge = `<span class="badge badge-warning">⏳ PENDENTE</span>`;
      }

      return `<tr style="${atrasada ? 'background:#fff5f5;' : venceHoje ? 'background:#fffbf0;' : ''}">
        <td>${c.ID}</td>
        <td>
          <strong>${c.DESCRICAO}</strong>
          ${atrasada ? '<br><small style="color:var(--vermelho);">⚠️ Em atraso!</small>' : ''}
        </td>
        <td>${c.FORNECEDOR || '-'}</td>
        <td class="fw-bold ${c.STATUS === 'PENDENTE' ? 'text-vermelho' : 'text-verde'}">${Utils.formatMoeda(c.VALOR)}</td>
        <td>${c.DATA_VENCIMENTO || '-'}</td>
        <td>${statusBadge}</td>
        <td><span class="badge badge-primary">${c.CATEGORIA || '-'}</span></td>
        <td>
          ${c.STATUS === 'PENDENTE' ? `
            <button class="btn btn-sm btn-success" onclick="Contas.pagar(${c.ID})">💰 Pagar</button>
            <button class="btn btn-sm btn-info" onclick="Contas.editar(${c.ID})">✏️</button>
          ` : `<span style="color:#999;font-size:0.8rem;">${c.DATA_PAGAMENTO || ''}</span>`}
        </td>
      </tr>`;
    }).join('');

    if (totalEl) {
      totalEl.innerHTML = `Total pendente: <span class="text-vermelho">${Utils.formatMoeda(totalPendente)}</span>`;
    }
  },

  novo() { this.abrirModal(null); },
  editar(id) {
    const c = this.dados.find(c => c.ID == id);
    if (c) this.abrirModal(c);
  },

  abrirModal(c) {
    const titulo = c ? `✏️ Editar Conta #${c.ID}` : '➕ Nova Conta a Pagar';
    Modal.open(titulo, `
      <div class="form-group">
        <label>Descrição *</label>
        <input type="text" class="form-control" id="mContaDesc"
          value="${c?.DESCRICAO || ''}" placeholder="Ex: Aluguel, Energia, Compra...">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Fornecedor / Credor</label>
          <input type="text" class="form-control" id="mContaForn"
            value="${c?.FORNECEDOR || ''}" placeholder="Nome do credor">
        </div>
        <div class="form-group">
          <label>Categoria</label>
          <select class="form-control" id="mContaCat">
            ${CONFIG.CATEGORIAS_CONTAS.map(cat =>
              `<option value="${cat}" ${c?.CATEGORIA === cat ? 'selected' : ''}>${cat}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Valor (R$) *</label>
          <input type="number" class="form-control" id="mContaValor"
            step="0.01" min="0" value="${c?.VALOR || ''}" placeholder="0,00">
        </div>
        <div class="form-group">
          <label>Data de Vencimento *</label>
          <input type="date" class="form-control" id="mContaVenc"
            value="${c?.DATA_VENCIMENTO ? c.DATA_VENCIMENTO.split('/').reverse().join('-') : ''}">
        </div>
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Contas.salvar(${c?.ID || 'null'})">💾 Salvar</button>`
    );
  },

  async salvar(id) {
    const descricao     = document.getElementById('mContaDesc')?.value.trim();
    const fornecedor    = document.getElementById('mContaForn')?.value.trim();
    const categoria     = document.getElementById('mContaCat')?.value;
    const valor         = parseFloat(document.getElementById('mContaValor')?.value);
    const dataVencimento= document.getElementById('mContaVenc')?.value;

    if (!descricao) { Utils.toast('Informe a descrição!', 'warning'); return; }
    if (!valor || valor <= 0) { Utils.toast('Informe o valor!', 'warning'); return; }
    if (!dataVencimento) { Utils.toast('Informe a data de vencimento!', 'warning'); return; }

    // Converter data para dd/MM/yyyy
    const [ano, mes, dia] = dataVencimento.split('-');
    const dataFormatada = `${dia}/${mes}/${ano}`;

    Utils.loading(true);
    const res = await API.call('saveContaPagar', { id, descricao, fornecedor, categoria, valor, dataVencimento: dataFormatada });
    Utils.loading(false);
    if (res.success) {
      Modal.close();
      Utils.toast(res.message, 'success');
      await this.load();
    } else {
      Utils.toast(res.message || 'Erro ao salvar!', 'danger');
    }
  },

  async pagar(id) {
    const c = this.dados.find(c => c.ID == id);
    if (!c) return;
    if (!Utils.confirm(`Confirmar pagamento de:\n${c.DESCRICAO}\nValor: ${Utils.formatMoeda(c.VALOR)}`)) return;

    Utils.loading(true);
    const res = await API.call('pagarConta', { id });
    Utils.loading(false);
    if (res.success) {
      Utils.toast(`✅ Pagamento de ${Utils.formatMoeda(c.VALOR)} registrado!`, 'success');
      await this.load();
    } else {
      Utils.toast(res.message || 'Erro ao registrar pagamento!', 'danger');
    }
  }
};