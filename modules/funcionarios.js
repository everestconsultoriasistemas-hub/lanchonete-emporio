// ============================================================
// MÓDULO: FUNCIONÁRIOS - Cadastro Completo
// ============================================================
const Funcionarios = {
  dados: [],

  async load() {
    Utils.loading(true);
    const res = await API.call('getFuncionarios', {});
    Utils.loading(false);
    this.dados = res.success ? res.data : [];
    this.renderTabela();
  },

  renderTabela() {
    const tbody = document.getElementById('funcionariosTable');
    if (!tbody) return;

    if (!this.dados.length) {
      tbody.innerHTML = `<tr><td colspan="8" class="text-center" style="padding:2rem;color:#999;">Nenhum funcionário cadastrado</td></tr>`;
      return;
    }

    tbody.innerHTML = this.dados.map(f => {
      const tipoLabel = { MENSAL: '📅 Mensal', QUINZENAL: '📆 Quinzenal', HORA: '⏱️ Por Hora' };
      const valorLabel = f.TIPO_SALARIO === 'HORA'
        ? `${Utils.formatMoeda(f.VALOR_SALARIO)}/h`
        : Utils.formatMoeda(f.VALOR_SALARIO);
      return `<tr>
        <td>${f.ID}</td>
        <td>
          <strong>${f.NOME}</strong><br>
          <small style="color:#999;">${f.DATA_ADMISSAO ? 'Desde: ' + f.DATA_ADMISSAO : ''}</small>
        </td>
        <td>${f.TELEFONE || '-'}</td>
        <td>${f.CARGO || '-'}</td>
        <td><span class="badge badge-info">${tipoLabel[f.TIPO_SALARIO] || f.TIPO_SALARIO}</span></td>
        <td class="fw-bold text-verde">${valorLabel}</td>
        <td><span class="badge ${f.ATIVO === 'SIM' ? 'badge-success' : 'badge-danger'}">${f.ATIVO === 'SIM' ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn btn-sm btn-info" onclick="Funcionarios.editar(${f.ID})">✏️</button>
          <button class="btn btn-sm btn-warning" onclick="Funcionarios.toggleAtivo(${f.ID})">${f.ATIVO === 'SIM' ? '🚫' : '✅'}</button>
        </td>
      </tr>`;
    }).join('');
  },

  novo() { this.abrirModal(null); },
  editar(id) {
    const f = this.dados.find(f => f.ID == id);
    if (f) this.abrirModal(f);
  },

  abrirModal(f) {
    const titulo = f ? `✏️ Editar: ${f.NOME}` : '➕ Novo Funcionário';
    const hoje = new Date().toISOString().split('T')[0];
    Modal.open(titulo, `
      <div class="form-group">
        <label>Nome Completo *</label>
        <input type="text" class="form-control" id="mFuncNome" value="${f?.NOME || ''}" placeholder="Nome da funcionária">
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Telefone</label>
          <input type="tel" class="form-control" id="mFuncTel" value="${f?.TELEFONE || ''}" placeholder="(11) 99999-9999">
        </div>
        <div class="form-group">
          <label>Cargo</label>
          <input type="text" class="form-control" id="mFuncCargo" value="${f?.CARGO || ''}" placeholder="Ex: Atendente">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Tipo de Salário *</label>
          <select class="form-control" id="mFuncTipo" onchange="Funcionarios.updateSalarioLabel()">
            <option value="MENSAL"    ${f?.TIPO_SALARIO === 'MENSAL'    ? 'selected' : ''}>📅 Mensal</option>
            <option value="QUINZENAL" ${f?.TIPO_SALARIO === 'QUINZENAL' ? 'selected' : ''}>📆 Quinzenal</option>
            <option value="HORA"      ${f?.TIPO_SALARIO === 'HORA'      ? 'selected' : ''}>⏱️ Por Hora</option>
          </select>
        </div>
        <div class="form-group">
          <label id="mFuncSalarioLabel">Valor do Salário (R$) *</label>
          <input type="number" class="form-control" id="mFuncSalario" step="0.01" min="0"
            value="${f?.VALOR_SALARIO || ''}" placeholder="0,00">
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>Data de Admissão</label>
          <input type="date" class="form-control" id="mFuncAdmissao"
            value="${f?.DATA_ADMISSAO || hoje}">
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" id="mFuncAtivo">
            <option value="SIM" ${f?.ATIVO !== 'NAO' ? 'selected' : ''}>Ativo</option>
            <option value="NAO" ${f?.ATIVO === 'NAO' ? 'selected' : ''}>Inativo</option>
          </select>
        </div>
      </div>
      <div class="alert alert-info mt-1" id="mFuncDica">
        ℹ️ Salário <strong>Mensal</strong>: valor fixo por mês.
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Funcionarios.salvar(${f?.ID || 'null'})">💾 Salvar</button>`
    );
    this.updateSalarioLabel();
  },

  updateSalarioLabel() {
    const tipo = document.getElementById('mFuncTipo')?.value;
    const label = document.getElementById('mFuncSalarioLabel');
    const dica  = document.getElementById('mFuncDica');
    const msgs = {
      MENSAL:    { label: 'Salário Mensal (R$) *',    dica: 'ℹ️ Salário <strong>Mensal</strong>: valor fixo por mês.' },
      QUINZENAL: { label: 'Salário Quinzenal (R$) *', dica: 'ℹ️ Salário <strong>Quinzenal</strong>: pago 2x por mês. O total mensal será o dobro.' },
      HORA:      { label: 'Valor por Hora (R$) *',    dica: 'ℹ️ Salário <strong>Por Hora</strong>: calculado automaticamente pelo tempo de caixa aberto.' },
    };
    if (label && msgs[tipo]) label.textContent = msgs[tipo].label;
    if (dica  && msgs[tipo]) dica.innerHTML    = msgs[tipo].dica;
  },

  async salvar(id) {
    const nome       = document.getElementById('mFuncNome')?.value.trim();
    const telefone   = document.getElementById('mFuncTel')?.value.trim();
    const cargo      = document.getElementById('mFuncCargo')?.value.trim();
    const tipoSalario= document.getElementById('mFuncTipo')?.value;
    const valorSalario= parseFloat(document.getElementById('mFuncSalario')?.value);
    const dataAdmissao= document.getElementById('mFuncAdmissao')?.value;
    const ativo      = document.getElementById('mFuncAtivo')?.value;

    if (!nome) { Utils.toast('Informe o nome!', 'warning'); return; }
    if (!valorSalario || valorSalario <= 0) { Utils.toast('Informe o valor do salário!', 'warning'); return; }

    Utils.loading(true);
    const res = await API.call('saveFuncionario', { id, nome, telefone, cargo, tipoSalario, valorSalario, dataAdmissao, ativo });
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
    if (!Utils.confirm(`Deseja ${acao} a funcionária "${f.NOME}"?`)) return;
    Utils.loading(true);
    const res = await API.call('saveFuncionario', { ...f, id: f.ID, ativo: novoStatus });
    Utils.loading(false);
    if (res.success) { Utils.toast(res.message, 'success'); await this.load(); }
    else Utils.toast(res.message, 'danger');
  }
};