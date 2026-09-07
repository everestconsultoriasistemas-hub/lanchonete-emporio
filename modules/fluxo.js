// ============================================================
// MÓDULO: FLUXO DE CAIXA
// ============================================================
const Fluxo = {
  dados: [],

  async load() {
    Utils.loading(true);
    const res = await API.call('getFluxoCaixa', {
      dataInicio: document.getElementById('fluxoDe')?.value || '',
      dataFim:    document.getElementById('fluxoAte')?.value || ''
    });
    Utils.loading(false);
    this.dados = res.success ? res.data : [];
    this.renderResumo();
    this.renderTabela();
  },

  renderResumo() {
    const el = document.getElementById('fluxoResumo');
    if (!el) return;

    const entradas = this.dados.filter(d => d.TIPO === 'ENTRADA').reduce((s, d) => s + (d.VALOR || 0), 0);
    const saidas   = this.dados.filter(d => d.TIPO === 'SAIDA').reduce((s, d) => s + (d.VALOR || 0), 0);
    const saldo    = entradas - saidas;

    el.innerHTML = `
      <div class="stat-card verde">
        <div class="stat-icon">⬆️</div>
        <div class="stat-label">Total Entradas</div>
        <div class="stat-value">${Utils.formatMoeda(entradas)}</div>
      </div>
      <div class="stat-card vermelho">
        <div class="stat-icon">⬇️</div>
        <div class="stat-label">Total Saídas</div>
        <div class="stat-value">${Utils.formatMoeda(saidas)}</div>
      </div>
      <div class="stat-card ${saldo >= 0 ? 'verde' : 'vermelho'}">
        <div class="stat-icon">${saldo >= 0 ? '💰' : '⚠️'}</div>
        <div class="stat-label">Saldo do Período</div>
        <div class="stat-value">${Utils.formatMoeda(saldo)}</div>
      </div>`;
  },

  renderTabela() {
    const tbody = document.getElementById('fluxoTable');
    if (!tbody) return;

    if (!this.dados.length) {
      tbody.innerHTML = `<tr><td colspan="6" class="text-center" style="padding:2rem;color:#999;">Nenhum registro encontrado</td></tr>`;
      return;
    }

    tbody.innerHTML = this.dados.map(d => {
      const isEntrada = d.TIPO === 'ENTRADA';
      return `<tr>
        <td>${d.ID}</td>
        <td>${d.DATA}</td>
        <td>
          <span class="badge ${isEntrada ? 'badge-success' : 'badge-danger'}">
            ${isEntrada ? '⬆️ ENTRADA' : '⬇️ SAÍDA'}
          </span>
        </td>
        <td>${d.DESCRICAO}</td>
        <td class="fw-bold ${isEntrada ? 'text-verde' : 'text-vermelho'}">
          ${isEntrada ? '+' : '-'} ${Utils.formatMoeda(d.VALOR)}
        </td>
        <td class="fw-bold ${(d.SALDO_ACUMULADO || 0) >= 0 ? 'text-verde' : 'text-vermelho'}">
          ${Utils.formatMoeda(d.SALDO_ACUMULADO)}
        </td>
      </tr>`;
    }).join('');
  }
};