// ============================================================
// DASHBOARD - Visão Geral do Negócio
// ============================================================
const Dashboard = {
  async load() {
    Utils.loading(true);
    const [resDash, resEstoque, resContas] = await Promise.all([
      API.call('getDashboard', {}),
      API.call('getEstoque', {}),
      API.call('getContasPagar', { status: 'PENDENTE' })
    ]);
    Utils.loading(false);

    if (resDash.success) this.renderStats(resDash.dashboard);
    if (resEstoque.success) this.renderEstoqueCritico(resEstoque.data);
    if (resContas.success) this.renderContas(resContas.data);
  },

  renderStats(d) {
    const el = document.getElementById('dashStats');
    if (!el) return;
    el.innerHTML = `
      <div class="stat-card verde" style="cursor:pointer;" onclick="App.navigate('vendas')">
        <div class="stat-icon">🛒</div>
        <div class="stat-label">Vendas Hoje</div>
        <div class="stat-value">${Utils.formatMoeda(d.totalVendasHoje)}</div>
        <div class="stat-sub">${d.qtdVendasHoje} pedido(s)</div>
      </div>
      <div class="stat-card ${d.caixasAbertos > 0 ? 'verde' : 'vermelho'}" style="cursor:pointer;" onclick="App.navigate('caixa')">
        <div class="stat-icon">🕐</div>
        <div class="stat-label">Caixas Abertos</div>
        <div class="stat-value">${d.caixasAbertos}</div>
        <div class="stat-sub">${d.caixasAbertos > 0 ? 'Em andamento' : 'Nenhum aberto'}</div>
      </div>
      <div class="stat-card ${d.estoqueCritico > 0 ? 'vermelho' : 'verde'}" style="cursor:pointer;" onclick="App.navigate('estoque')">
        <div class="stat-icon">📦</div>
        <div class="stat-label">Estoque Crítico</div>
        <div class="stat-value">${d.estoqueCritico}</div>
        <div class="stat-sub">${d.estoqueCritico > 0 ? 'Itens abaixo do mínimo' : 'Estoque OK'}</div>
      </div>
      <div class="stat-card ${d.contasPendentes > 0 ? 'laranja' : 'verde'}" style="cursor:pointer;" onclick="App.navigate('contas')">
        <div class="stat-icon">💳</div>
        <div class="stat-label">Contas Pendentes</div>
        <div class="stat-value">${d.contasPendentes}</div>
        <div class="stat-sub">${Utils.formatMoeda(d.totalContasPendentes)}</div>
      </div>
      <div class="stat-card ${d.saldoAtual >= 0 ? 'verde' : 'vermelho'}" style="cursor:pointer;" onclick="App.navigate('fluxo')">
        <div class="stat-icon">💵</div>
        <div class="stat-label">Saldo Atual</div>
        <div class="stat-value">${Utils.formatMoeda(d.saldoAtual)}</div>
        <div class="stat-sub">Fluxo de caixa</div>
      </div>`;
  },

  renderEstoqueCritico(estoque) {
    const el = document.getElementById('dashEstoqueCritico');
    if (!el) return;
    const criticos = estoque.filter(e => e.QUANTIDADE <= e.ESTOQUE_MINIMO);
    if (!criticos.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><p>Estoque OK!</p></div>`;
      return;
    }
    el.innerHTML = criticos.map(e => {
      const zerado = e.QUANTIDADE <= 0;
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--cinza);">
          <div>
            <div style="font-weight:700;font-size:0.88rem;">${e.PRODUTO}</div>
            <div style="font-size:0.75rem;color:#999;">Mínimo: ${e.ESTOQUE_MINIMO} ${e.UNIDADE||'UN'}</div>
          </div>
          <span class="badge ${zerado ? 'badge-danger' : 'badge-warning'}">
            ${zerado ? '🔴 ZERADO' : `🟡 ${e.QUANTIDADE} ${e.UNIDADE||'UN'}`}
          </span>
        </div>`;
    }).join('');
  },

  renderContas(contas) {
    const el = document.getElementById('dashContas');
    if (!el) return;
    if (!contas.length) {
      el.innerHTML = `<div class="empty-state"><div class="empty-icon">✅</div><p>Nenhuma conta pendente</p></div>`;
      return;
    }
    const hoje = new Date();
    // Ordenar por vencimento
    const ordenadas = [...contas].sort((a, b) => {
      const da = a.DATA_VENCIMENTO ? new Date(a.DATA_VENCIMENTO.split('/').reverse().join('-')) : new Date('9999-12-31');
      const db = b.DATA_VENCIMENTO ? new Date(b.DATA_VENCIMENTO.split('/').reverse().join('-')) : new Date('9999-12-31');
      return da - db;
    }).slice(0, 5);

    el.innerHTML = ordenadas.map(c => {
      const venc = c.DATA_VENCIMENTO ? new Date(c.DATA_VENCIMENTO.split('/').reverse().join('-')) : null;
      const atrasada = venc && venc < hoje;
      const venceHoje = venc && venc.toDateString() === hoje.toDateString();
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:0.5rem 0;border-bottom:1px solid var(--cinza);">
          <div>
            <div style="font-weight:700;font-size:0.88rem;">${c.DESCRICAO}</div>
            <div style="font-size:0.75rem;color:${atrasada ? 'var(--vermelho)' : '#999'};">
              ${atrasada ? '⚠️ Atrasada! ' : venceHoje ? '⚠️ Vence hoje! ' : ''}Venc: ${c.DATA_VENCIMENTO || '-'}
            </div>
          </div>
          <span class="fw-bold text-vermelho">${Utils.formatMoeda(c.VALOR)}</span>
        </div>`;
    }).join('');

    if (contas.length > 5) {
      el.innerHTML += `<div style="text-align:center;margin-top:0.5rem;">
        <button class="btn btn-sm btn-outline" onclick="App.navigate('contas')">Ver todas (${contas.length})</button>
      </div>`;
    }
  }
};