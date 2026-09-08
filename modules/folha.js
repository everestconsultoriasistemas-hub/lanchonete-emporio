// ============================================================
// MÓDULO: FOLHA DE PAGAMENTO
// ============================================================
const Folha = {
  dados: [],

  init() {
    // Definir mês atual como padrão
    const mesEl = document.getElementById('folhaMes');
    if (mesEl && !mesEl.value) {
      const now = new Date();
      mesEl.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    }
  },

  getMesAno() {
    const val = document.getElementById('folhaMes')?.value;
    if (!val) return null;
    const [ano, mes] = val.split('-');
    return `${mes}/${ano}`;
  },

  async load() {
    const mesAno = this.getMesAno();
    if (!mesAno) { Utils.toast('Selecione o mês!', 'warning'); return; }

    Utils.loading(true);
    const res = await API.call('getFolhaPagamento', { mesAno });
    Utils.loading(false);
    this.dados = res.success ? res.data : [];
    this.renderFolha(mesAno);
  },

  async gerar() {
    const mesAno = this.getMesAno();
    if (!mesAno) { Utils.toast('Selecione o mês!', 'warning'); return; }

    if (!Utils.confirm(`Gerar folha de pagamento para ${mesAno}?\n\nIsso calculará automaticamente:\n• Salários (mensal/quinzenal/hora)\n• Horas trabalhadas (pelo caixa)\n• Descontos de consumo`)) return;

    Utils.loading(true);
    const res = await API.call('gerarFolha', { mesAno, outrosDescontos: 0 });
    Utils.loading(false);

    if (res.success) {
      Utils.toast(`✅ ${res.message}`, 'success');
      await this.load();
    } else {
      Utils.toast(res.message || 'Erro ao gerar folha!', 'danger');
    }
  },

  renderFolha(mesAno) {
    const content = document.getElementById('folhaContent');
    if (!content) return;

    if (!this.dados.length) {
      content.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <p>Nenhuma folha gerada para <strong>${mesAno}</strong></p>
          <p style="margin-top:0.5rem;font-size:0.85rem;color:#999;">Clique em "⚙️ Gerar Folha" para calcular automaticamente</p>
        </div>`;
      return;
    }

    const totalBruto   = this.dados.reduce((s, f) => s + (f.VALOR_BRUTO || 0), 0);
    const totalDesc    = this.dados.reduce((s, f) => s + (f.DESCONTO_CONSUMO || 0) + (f.OUTROS_DESCONTOS || 0), 0);
    const totalLiquido = this.dados.reduce((s, f) => s + (f.VALOR_LIQUIDO || 0), 0);

    content.innerHTML = `
      <!-- RESUMO -->
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:1rem;margin-bottom:1.5rem;">
        <div class="stat-card">
          <div class="stat-icon">💰</div>
          <div class="stat-label">Total Bruto</div>
          <div class="stat-value">${Utils.formatMoeda(totalBruto)}</div>
        </div>
        <div class="stat-card vermelho">
          <div class="stat-icon">➖</div>
          <div class="stat-label">Total Descontos</div>
          <div class="stat-value">${Utils.formatMoeda(totalDesc)}</div>
        </div>
        <div class="stat-card verde">
          <div class="stat-icon">✅</div>
          <div class="stat-label">Total a Pagar</div>
          <div class="stat-value">${Utils.formatMoeda(totalLiquido)}</div>
        </div>
      </div>

      <!-- CARDS POR FUNCIONÁRIA -->
      ${this.dados.map(f => this.renderCardFuncionaria(f)).join('')}

      <!-- TABELA RESUMO -->
      <div class="card mt-2">
        <div class="card-header"><span class="card-title">📋 Resumo da Folha - ${mesAno}</span>
          <button class="btn btn-sm btn-secondary" onclick="Folha.imprimir()">🖨️ Imprimir</button>
        </div>
        <div class="card-body">
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Funcionária</th><th>Tipo</th><th>Bruto</th>
                  <th>Desc. Consumo</th><th>Outros Desc.</th><th>Líquido</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                ${this.dados.map(f => `
                  <tr>
                    <td><strong>${f.FUNCIONARIO}</strong></td>
                    <td><span class="badge badge-info">${f.TIPO_SALARIO}</span></td>
                    <td>${Utils.formatMoeda(f.VALOR_BRUTO)}</td>
                    <td class="text-vermelho">${Utils.formatMoeda(f.DESCONTO_CONSUMO)}</td>
                    <td class="text-vermelho">${Utils.formatMoeda(f.OUTROS_DESCONTOS)}</td>
                    <td class="text-verde fw-bold">${Utils.formatMoeda(f.VALOR_LIQUIDO)}</td>
                    <td><span class="badge ${f.STATUS === 'PAGO' ? 'badge-success' : 'badge-warning'}">${f.STATUS}</span></td>
                  </tr>`).join('')}
                <tr style="background:var(--cinza-claro);font-weight:800;">
                  <td colspan="2">TOTAL</td>
                  <td>${Utils.formatMoeda(totalBruto)}</td>
                  <td class="text-vermelho">${Utils.formatMoeda(this.dados.reduce((s,f)=>s+(f.DESCONTO_CONSUMO||0),0))}</td>
                  <td class="text-vermelho">${Utils.formatMoeda(this.dados.reduce((s,f)=>s+(f.OUTROS_DESCONTOS||0),0))}</td>
                  <td class="text-verde">${Utils.formatMoeda(totalLiquido)}</td>
                  <td></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>`;
  },

  renderCardFuncionaria(f) {
    const tipoIcon = { MENSAL: '📅', QUINZENAL: '📆', HORA: '⏱️' };
    return `
      <div class="folha-card">
        <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:0.5rem;">
          <div>
            <div class="folha-nome">${f.FUNCIONARIO}</div>
            <div class="folha-cargo">${tipoIcon[f.TIPO_SALARIO] || ''} Salário ${f.TIPO_SALARIO}</div>
          </div>
          <span class="badge ${f.STATUS === 'PAGO' ? 'badge-success' : 'badge-warning'}">${f.STATUS}</span>
        </div>
        <div class="folha-valores">
          <div class="folha-valor-item">
            <div class="folha-valor-label">Salário Bruto</div>
            <div class="folha-valor-num">${Utils.formatMoeda(f.VALOR_BRUTO)}</div>
          </div>
          <div class="folha-valor-item">
            <div class="folha-valor-label">Desc. Consumo</div>
            <div class="folha-valor-num vermelho">- ${Utils.formatMoeda(f.DESCONTO_CONSUMO)}</div>
          </div>
          <div class="folha-valor-item">
            <div class="folha-valor-label">Outros Desc.</div>
            <div class="folha-valor-num vermelho">- ${Utils.formatMoeda(f.OUTROS_DESCONTOS)}</div>
          </div>
          <div class="folha-valor-item">
            <div class="folha-valor-label">💰 A Receber</div>
            <div class="folha-valor-num verde">${Utils.formatMoeda(f.VALOR_LIQUIDO)}</div>
          </div>
        </div>
        ${f.TIPO_SALARIO === 'HORA' ? `
          <div class="alert alert-info mt-1" style="font-size:0.8rem;padding:0.5rem 0.8rem;">
            ⏱️ Horas calculadas automaticamente pelo registro de abertura/fechamento de caixa
          </div>` : ''}
      </div>`;
  },

  imprimir() {
    const mesAno = this.getMesAno();
    const conteudo = document.getElementById('folhaContent')?.innerHTML || '';
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head>
        <title>Folha de Pagamento - ${mesAno} - Lanchonete Empório</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; }
          h1 { color: #5D3A1A; border-bottom: 3px solid #F5C518; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background: #5D3A1A; color: white; padding: 8px; text-align: left; }
          td { padding: 8px; border-bottom: 1px solid #ddd; }
          .stat-card, .folha-card { border: 1px solid #ddd; padding: 10px; margin: 5px; display: inline-block; }
          @media print { button { display: none; } }
        </style>
      </head><body>
        <h1>🍔 Lanchonete Empório</h1>
        <h2>Folha de Pagamento - ${mesAno}</h2>
        ${conteudo}
        <script>window.print();<\/script>
      </body></html>`);
    win.document.close();
  }
};