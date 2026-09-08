// ============================================================
// MÓDULO: CAIXA - Abertura e Fechamento de Turno
// ============================================================
const Caixa = {
  async load() {
    const user = Session.get();
    const caixaAtual = Session.getCaixa();
    const content = document.getElementById('caixaContent');

    if (user.perfil === 'FUNCIONARIA') {
      content.innerHTML = this.renderFuncionaria(caixaAtual, user);
    } else {
      content.innerHTML = this.renderGerencial();
      await this.loadHistorico();
    }
    this.atualizarIndicador(caixaAtual);
  },

  // ── VISÃO FUNCIONÁRIA ──────────────────────────────────────
  renderFuncionaria(caixaAtual, user) {
    const aberto = !!caixaAtual;
    return `
      <div class="card mb-2">
        <div class="card-header"><span class="card-title">🕐 Meu Caixa - ${user.nome}</span></div>
        <div class="card-body">
          <div class="caixa-status ${aberto ? 'aberto' : 'fechado'}">
            <div class="caixa-dot"></div>
            ${aberto
              ? `✅ Caixa ABERTO desde ${caixaAtual.horaAbertura}`
              : '🔴 Caixa FECHADO'}
          </div>
          ${aberto ? this.renderCaixaAberto(caixaAtual) : this.renderAbrirCaixa(user)}
        </div>
      </div>`;
  },

  renderAbrirCaixa(user) {
    const agora = new Date().toLocaleString('pt-BR');
    return `
      <div class="alert alert-info">
        ℹ️ Ao abrir o caixa, o horário é registrado automaticamente: <strong>${agora}</strong>
      </div>
      <div class="form-group">
        <label>Funcionária</label>
        <input type="text" class="form-control" value="${user.nome}" disabled>
      </div>
      <div class="form-group">
        <label>Horário de Abertura (automático)</label>
        <input type="text" class="form-control" id="horaAbertura" value="${agora}" disabled>
      </div>
      <div class="form-group">
        <label>Observação (opcional)</label>
        <input type="text" class="form-control" id="obsAbertura" placeholder="Ex: Troco inicial R$ 50,00">
      </div>
      <button class="btn btn-success btn-block btn-lg mt-2" onclick="Caixa.abrir()">
        🟢 ABRIR CAIXA
      </button>`;
  },

  renderCaixaAberto(caixa) {
    return `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:0.8rem;margin-bottom:1rem;">
        <div class="stat-card verde">
          <div class="stat-icon">💵</div>
          <div class="stat-label">Dinheiro</div>
          <div class="stat-value" id="totalDinheiro">R$ 0,00</div>
        </div>
        <div class="stat-card azul">
          <div class="stat-icon">💳</div>
          <div class="stat-label">Débito</div>
          <div class="stat-value" id="totalDebito">R$ 0,00</div>
        </div>
        <div class="stat-card laranja">
          <div class="stat-icon">💳</div>
          <div class="stat-label">Crédito</div>
          <div class="stat-value" id="totalCredito">R$ 0,00</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📱</div>
          <div class="stat-label">PIX</div>
          <div class="stat-value" id="totalPix">R$ 0,00</div>
        </div>
      </div>
      <div class="alert alert-warning">
        ⚠️ Confira os valores antes de fechar o caixa. O horário de fechamento é automático.
      </div>
      <div class="form-group">
        <label>Observação de Fechamento</label>
        <input type="text" class="form-control" id="obsFechamento" placeholder="Ex: Sem ocorrências">
      </div>
      <button class="btn btn-danger btn-block btn-lg" onclick="Caixa.fechar()">
        🔴 FECHAR CAIXA
      </button>
      <button class="btn btn-primary btn-block mt-1" onclick="App.navigate('vendas')">
        🛒 Ir para Vendas
      </button>`;
  },

  // ── VISÃO GERENCIAL ────────────────────────────────────────
  renderGerencial() {
    return `
      <div class="card mb-2">
        <div class="card-header">
          <span class="card-title">🕐 Histórico de Caixas</span>
          <div class="d-flex gap-1">
            <input type="date" class="form-control" id="caixaDe" style="width:auto;">
            <input type="date" class="form-control" id="caixaAte" style="width:auto;">
            <button class="btn btn-secondary btn-sm" onclick="Caixa.loadHistorico()">🔍 Filtrar</button>
          </div>
        </div>
        <div class="card-body">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th><th>Funcionária</th><th>Data</th>
                  <th>Abertura</th><th>Fechamento</th><th>Horas</th>
                  <th>Dinheiro</th><th>Débito</th><th>Crédito</th><th>PIX</th><th>Total</th><th>Status</th>
                </tr>
              </thead>
              <tbody id="caixaHistTable"></tbody>
            </table>
          </div>
          <div id="caixaResumo" style="margin-top:1rem;"></div>
        </div>
      </div>`;
  },

  async loadHistorico() {
    const de = document.getElementById('caixaDe')?.value || '';
    const ate = document.getElementById('caixaAte')?.value || '';
    Utils.loading(true);
    const res = await API.call('getRelatorioCaixa', { dataInicio: de, dataFim: ate });
    Utils.loading(false);
    const tbody = document.getElementById('caixaHistTable');
    if (!tbody) return;
    if (!res.success || !res.data.length) {
      tbody.innerHTML = `<tr><td colspan="12" class="text-center" style="padding:2rem;color:#999;">Nenhum registro encontrado</td></tr>`;
      return;
    }
    let totalGeral = 0;
    tbody.innerHTML = res.data.map(c => {
      const horas = this.calcHoras(c.HORA_ABERTURA, c.HORA_FECHAMENTO);
      const aberto = !c.HORA_FECHAMENTO;
      totalGeral += c.TOTAL_GERAL || 0;
      return `<tr>
        <td>${c.ID}</td>
        <td><strong>${c.FUNCIONARIA}</strong></td>
        <td>${c.DATA}</td>
        <td>${c.HORA_ABERTURA ? c.HORA_ABERTURA.split(' ')[1] || c.HORA_ABERTURA : '-'}</td>
        <td>${c.HORA_FECHAMENTO ? c.HORA_FECHAMENTO.split(' ')[1] || c.HORA_FECHAMENTO : '-'}</td>
        <td>${horas}</td>
        <td>${Utils.formatMoeda(c.TOTAL_DINHEIRO)}</td>
        <td>${Utils.formatMoeda(c.TOTAL_DEBITO)}</td>
        <td>${Utils.formatMoeda(c.TOTAL_CREDITO)}</td>
        <td>${Utils.formatMoeda(c.TOTAL_PIX)}</td>
        <td><strong>${Utils.formatMoeda(c.TOTAL_GERAL)}</strong></td>
        <td><span class="badge ${aberto ? 'badge-success' : 'badge-info'}">${aberto ? 'ABERTO' : 'FECHADO'}</span></td>
      </tr>`;
    }).join('');

    document.getElementById('caixaResumo').innerHTML = `
      <div style="text-align:right;font-size:1.1rem;font-weight:800;color:var(--marrom);">
        Total do período: ${Utils.formatMoeda(totalGeral)}
      </div>`;
  },

  calcHoras(abertura, fechamento) {
    if (!abertura || !fechamento) return aberto ? '⏳ Em andamento' : '-';
    try {
      const parseDateTime = (str) => {
        const parts = str.split(' ');
        const timePart = parts.length > 1 ? parts[1] : parts[0];
        const [h, m, s] = timePart.split(':').map(Number);
        const d = new Date();
        d.setHours(h, m, s || 0, 0);
        return d;
      };
      const a = parseDateTime(abertura);
      const f = parseDateTime(fechamento);
      const diff = Math.abs(f - a) / 60000;
      const h = Math.floor(diff / 60);
      const m = Math.floor(diff % 60);
      return `${h}h ${m}min`;
    } catch { return '-'; }
  },

  // ── ABRIR CAIXA ────────────────────────────────────────────
  async abrir() {
    const user = Session.get();
    Utils.loading(true);
    const res = await API.call('abrirCaixa', { funcionaria: user.nome });
    Utils.loading(false);
    if (res.success) {
      Session.setCaixa({ idCaixa: res.idCaixa, horaAbertura: res.horaAbertura, funcionaria: user.nome });
      Utils.toast('✅ Caixa aberto com sucesso!', 'success');
      this.load();
    } else {
      Utils.toast(res.message, 'danger');
    }
  },

  // ── FECHAR CAIXA ───────────────────────────────────────────
  async fechar() {
    const caixa = Session.getCaixa();
    if (!caixa) { Utils.toast('Nenhum caixa aberto!', 'danger'); return; }
    if (!Utils.confirm('Confirma o fechamento do caixa?')) return;

    // Buscar totais das vendas do turno
    const res = await API.call('getRelatorioVendas', { idCaixa: caixa.idCaixa });
    let totalDinheiro = 0, totalDebito = 0, totalCredito = 0, totalPix = 0;
    if (res.success && res.data) {
      res.data.forEach(v => {
        if (v.FORMA_PAGAMENTO === 'DINHEIRO') totalDinheiro += v.TOTAL || 0;
        if (v.FORMA_PAGAMENTO === 'DEBITO')   totalDebito   += v.TOTAL || 0;
        if (v.FORMA_PAGAMENTO === 'CREDITO')  totalCredito  += v.TOTAL || 0;
        if (v.FORMA_PAGAMENTO === 'PIX')      totalPix      += v.TOTAL || 0;
      });
    }

    const obs = document.getElementById('obsFechamento')?.value || '';
    Utils.loading(true);
    const fechRes = await API.call('fecharCaixa', {
      idCaixa: caixa.idCaixa,
      totalDinheiro, totalDebito, totalCredito, totalPix, observacao: obs
    });
    Utils.loading(false);

    if (fechRes.success) {
      Session.setCaixa(null);
      Utils.toast(`✅ Caixa fechado! Total: ${Utils.formatMoeda(fechRes.totalGeral)}`, 'success');
      this.load();
    } else {
      Utils.toast(fechRes.message, 'danger');
    }
  },

  // ── INDICADOR NO TOPBAR ────────────────────────────────────
  atualizarIndicador(caixa) {
    const el = document.getElementById('caixaIndicator');
    if (!el) return;
    if (caixa) {
      el.innerHTML = `<span style="background:#d4edda;color:#155724;padding:0.3rem 0.8rem;border-radius:20px;font-size:0.78rem;font-weight:700;">🟢 Caixa Aberto</span>`;
    } else {
      el.innerHTML = `<span style="background:#f8d7da;color:#721c24;padding:0.3rem 0.8rem;border-radius:20px;font-size:0.78rem;font-weight:700;">🔴 Caixa Fechado</span>`;
    }
  }
};