// ============================================================
// MÓDULO: ESTOQUE - Controle de Produtos
// ============================================================
const Estoque = {
  dados: [],

  async load() {
    Utils.loading(true);
    const res = await API.call('getEstoque', {});
    Utils.loading(false);
    this.dados = res.success ? res.data : [];
    this.renderTabela();
  },

  renderTabela() {
    const tbody = document.getElementById('estoqueTable');
    if (!tbody) return;

    if (!this.dados.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:2rem;color:#999;">Nenhum item no estoque</td></tr>`;
      return;
    }

    tbody.innerHTML = this.dados.map(e => {
      const pct = e.ESTOQUE_MINIMO > 0 ? Math.min((e.QUANTIDADE / (e.ESTOQUE_MINIMO * 2)) * 100, 100) : 100;
      const statusClass = e.QUANTIDADE <= 0 ? 'estoque-critico' :
                          e.QUANTIDADE <= e.ESTOQUE_MINIMO ? 'estoque-baixo' : 'estoque-ok';
      const statusLabel = e.QUANTIDADE <= 0 ? '🔴 Zerado' :
                          e.QUANTIDADE <= e.ESTOQUE_MINIMO ? '🟡 Baixo' : '🟢 OK';
      const badgeClass  = e.QUANTIDADE <= 0 ? 'badge-danger' :
                          e.QUANTIDADE <= e.ESTOQUE_MINIMO ? 'badge-warning' : 'badge-success';
      return `<tr class="${statusClass}">
        <td>${e.ID}</td>
        <td><strong>${e.PRODUTO}</strong></td>
        <td>
          <strong style="font-size:1.1rem;">${e.QUANTIDADE}</strong>
          <div class="estoque-bar mt-1">
            <div class="estoque-bar-fill" style="width:${pct}%"></div>
          </div>
        </td>
        <td>${e.UNIDADE || 'UN'}</td>
        <td>${e.ESTOQUE_MINIMO}</td>
        <td><span class="badge ${badgeClass}">${statusLabel}</span></td>
        <td style="font-size:0.8rem;color:#999;">${e.ULTIMA_ATUALIZACAO || '-'}</td>
        <td>
          <button class="btn btn-sm btn-info" onclick="Estoque.ajustar(${e.ID})">📦 Ajustar</button>
          <button class="btn btn-sm btn-warning" onclick="Estoque.editar(${e.ID})">✏️</button>
        </td>
      </tr>`;
    }).join('');
  },

  novo() {
    this.abrirModal(null);
  },

  editar(id) {
    const item = this.dados.find(e => e.ID == id);
    if (item) this.abrirModal(item);
  },

  abrirModal(item) {
    const titulo = item ? `✏️ Editar: ${item.PRODUTO}` : '➕ Novo Item de Estoque';
    Modal.open(titulo, `
      <div class="form-group">
        <label>Produto *</label>
        <input type="text" class="form-control" id="mEstProd" value="${item?.PRODUTO || ''}" placeholder="Nome do produto">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Quantidade Atual *</label>
          <input type="number" class="form-control" id="mEstQtd" min="0" step="1"
            value="${item?.QUANTIDADE ?? ''}" placeholder="0">
        </div>
        <div class="form-group">
          <label>Unidade</label>
          <select class="form-control" id="mEstUnidade">
            ${['UN','KG','G','L','ML','CX','PCT'].map(u =>
              `<option value="${u}" ${item?.UNIDADE === u ? 'selected' : ''}>${u}</option>`
            ).join('')}
          </select>
        </div>
      </div>
      <div class="form-group">
        <label>Estoque Mínimo (alerta)</label>
        <input type="number" class="form-control" id="mEstMin" min="0" step="1"
          value="${item?.ESTOQUE_MINIMO ?? 5}" placeholder="5">
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Estoque.salvar(${item?.ID || 'null'})">💾 Salvar</button>`
    );
  },

  ajustar(id) {
    const item = this.dados.find(e => e.ID == id);
    if (!item) return;
    Modal.open(`📦 Ajustar Estoque: ${item.PRODUTO}`, `
      <div class="alert alert-info">
        Quantidade atual: <strong>${item.QUANTIDADE} ${item.UNIDADE || 'UN'}</strong>
      </div>
      <div class="form-group">
        <label>Tipo de Ajuste</label>
        <select class="form-control" id="mAjusteTipo">
          <option value="ENTRADA">➕ Entrada (compra/reposição)</option>
          <option value="SAIDA">➖ Saída (perda/ajuste)</option>
          <option value="INVENTARIO">📋 Inventário (definir quantidade exata)</option>
        </select>
      </div>
      <div class="form-group">
        <label>Quantidade</label>
        <input type="number" class="form-control" id="mAjusteQtd" min="0" step="1" placeholder="0">
      </div>
      <div class="form-group">
        <label>Motivo</label>
        <input type="text" class="form-control" id="mAjusteMot" placeholder="Ex: Compra fornecedor, Perda, Inventário...">
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Estoque.confirmarAjuste(${id}, ${item.QUANTIDADE})">✅ Confirmar</button>`
    );
  },

  async confirmarAjuste(id, qtdAtual) {
    const tipo = document.getElementById('mAjusteTipo')?.value;
    const qtd  = parseInt(document.getElementById('mAjusteQtd')?.value) || 0;
    if (qtd <= 0) { Utils.toast('Informe a quantidade!', 'warning'); return; }

    let novaQtd;
    if (tipo === 'INVENTARIO') novaQtd = qtd;
    else if (tipo === 'ENTRADA') novaQtd = qtdAtual + qtd;
    else novaQtd = Math.max(0, qtdAtual - qtd);

    Utils.loading(true);
    const res = await API.call('updateEstoque', { id, quantidade: novaQtd });
    Utils.loading(false);
    if (res.success) {
      Modal.close();
      Utils.toast(`✅ Estoque atualizado! Nova quantidade: ${novaQtd}`, 'success');
      await this.load();
    } else {
      Utils.toast(res.message || 'Erro ao atualizar!', 'danger');
    }
  },

  async salvar(id) {
    const produto  = document.getElementById('mEstProd')?.value.trim();
    const qtd      = parseInt(document.getElementById('mEstQtd')?.value);
    const unidade  = document.getElementById('mEstUnidade')?.value;
    const minimo   = parseInt(document.getElementById('mEstMin')?.value) || 0;

    if (!produto) { Utils.toast('Informe o nome do produto!', 'warning'); return; }
    if (isNaN(qtd) || qtd < 0) { Utils.toast('Informe a quantidade!', 'warning'); return; }

    Utils.loading(true);
    const res = await API.call('updateEstoque', { id, produto, quantidade: qtd, unidade, estoqueMinimo: minimo });
    Utils.loading(false);
    if (res.success) {
      Modal.close();
      Utils.toast(res.message, 'success');
      await this.load();
    } else {
      Utils.toast(res.message || 'Erro ao salvar!', 'danger');
    }
  }
};