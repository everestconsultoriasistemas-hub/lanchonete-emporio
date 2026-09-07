// ============================================================
// MÓDULO: RELATÓRIOS E ANÁLISES
// ============================================================
const Relatorios = {
  funcionarios: [],

  async init() {
    if (!this.funcionarios.length) {
      const res = await API.call('getFuncionarios', { apenasAtivos: true });
      this.funcionarios = res.success ? res.data : [];

      // Preencher selects de funcionárias
      ['relVendasFunc', 'relCaixaFunc'].forEach(id => {
        const sel = document.getElementById(id);
        if (sel && sel.options.length <= 1) {
          this.funcionarios.forEach(f => {
            const opt = document.createElement('option');
            opt.value = f.NOME; opt.textContent = f.NOME;
            sel.appendChild(opt);
          });
        }
      });
    }

    // Datas padrão: mês atual
    const hoje = new Date();
    const primeiroDia = new Date(hoje.getFullYear(), hoje.getMonth(), 1).toISOString().split('T')[0];
    const ultimoDia   = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0).toISOString().split('T')[0];

    ['relVendasDe','relCaixaDe'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = primeiroDia;
    });
    ['relVendasAte','relCaixaAte'].forEach(id => {
      const el = document.getElementById(id);
      if (el && !el.value) el.value = ultimoDia;
    });
  },

  // ── RELATÓRIO DE VENDAS ────────────────────────────────────
  async vendas() {
    const de   = document.getElementById('relVendasDe')?.value;
    const ate  = document.getElementById('relVendasAte')?.value;
    const func = document.getElementById('relVendasFunc')?.value;

    if (!de || !ate) { Utils.toast('Selecione o período!', 'warning'); return; }

    Utils.loading(true);
    const res = await API.call('getRelatorioVendas', { dataInicio: de, dataFim: ate, funcionaria: func });
    Utils.loading(false);

    const result = document.getElementById('relatorioResult');
    if (!result) return;

    if (!res.success || !res.data?.length) {
      result.innerHTML = `<div class="alert alert-warning">⚠️ Nenhuma venda encontrada no período.</div>`;
      return;
    }

    const r = res.resumo;
    const periodo = `${de.split('-').reverse().join('/')} a ${ate.split('-').reverse().join('/')}`;

    // Produtos mais vendidos
    const prodMap = {};
    res.data.forEach(v => {
      (v.itens || []).forEach(i => {
        if (!prodMap[i.PRODUTO]) prodMap[i.PRODUTO] = { qtd: 0, total: 0 };
        prodMap[i.PRODUTO].qtd   += i.QUANTIDADE || 0;
        prodMap[i.PRODUTO].total += i.SUBTOTAL   || 0;
      });
    });
    const topProd = Object.entries(prodMap)
      .sort((a, b) => b[1].total - a[1].total)
      .slice(0, 5);

    result.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">📊 Relatório de Vendas — ${periodo}</span>
          <button class="btn btn-sm btn-secondary" onclick="Relatorios.imprimir('relVendasConteudo')">🖨️ Imprimir</button>
        </div>
        <div class="card-body" id="relVendasConteudo">

          <!-- RESUMO POR PAGAMENTO -->
          <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:1rem;margin-bottom:1.5rem;">
            <div class="stat-card verde">
              <div class="stat-icon">🛒</div>
              <div class="stat-label">Total Vendas</div>
              <div class="stat-value">${Utils.formatMoeda(r.totalGeral)}</div>
              <div class="stat-sub">${r.qtdVendas} pedidos</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">💵</div>
              <div class="stat-label">Dinheiro</div>
              <div class="stat-value">${Utils.formatMoeda(r.totalDinheiro)}</div>
            </div>
            <div class="stat-card azul">
              <div class="stat-icon">💳</div>
              <div class="stat-label">Débito</div>
              <div class="stat-value">${Utils.formatMoeda(r.totalDebito)}</div>
            </div>
            <div class="stat-card laranja">
              <div class="stat-icon">💳</div>
              <div class="stat-label">Crédito</div>
              <div class="stat-value">${Utils.formatMoeda(r.totalCredito)}</div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">📱</div>
              <div class="stat-label">PIX</div>
              <div class="stat-value">${Utils.formatMoeda(r.totalPix)}</div>
            </div>
          </div>

          <!-- TICKET MÉDIO -->
          <div class="alert alert-info mb-2">
            🎯 Ticket médio por venda: <strong>${Utils.formatMoeda(r.qtdVendas ? r.totalGeral / r.qtdVendas : 0)}</strong>
            &nbsp;|&nbsp; Total de pedidos: <strong>${r.qtdVendas}</strong>
            ${func ? `&nbsp;|&nbsp; Funcionária: <strong>${func}</strong>` : ''}
          </div>

          <!-- TOP PRODUTOS -->
          ${topProd.length ? `
          <div class="card mb-2" style="border:2px solid var(--amarelo);">
            <div class="card-header"><span class="card-title">🏆 Top 5 Produtos Mais Vendidos</span></div>
            <div class="card-body">
              <div class="table-wrapper">
                <table>
                  <thead><tr><th>Pos.</th><th>Produto</th><th>Qtd Vendida</th><th>Total Faturado</th></tr></thead>
                  <tbody>
                    ${topProd.map(([prod, dados], idx) => `
                      <tr>
                        <td>${['🥇','🥈','🥉','4º','5º'][idx]}</td>
                        <td><strong>${prod}</strong></td>
                        <td>${dados.qtd}</td>
                        <td class="text-verde fw-bold">${Utils.formatMoeda(dados.total)}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>` : ''}

          <!-- FORMAS DE PAGAMENTO % -->
          <div class="card mb-2">
            <div class="card-header"><span class="card-title">💳 Distribuição por Forma de Pagamento</span></div>
            <div class="card-body">
              ${r.totalGeral > 0 ? ['DINHEIRO','DEBITO','CREDITO','PIX'].map(forma => {
                const val = r[`total${forma.charAt(0)+forma.slice(1).toLowerCase()}`] ||
                            r[`total${forma}`] || 0;
                const pct = ((val / r.totalGeral) * 100).toFixed(1);
                const icons = {DINHEIRO:'💵',DEBITO:'💳',CREDITO:'💳',PIX:'📱'};
                return `
                  <div style="margin-bottom:0.8rem;">
                    <div style="display:flex;justify-content:space-between;margin-bottom:0.3rem;">
                      <span>${icons[forma]} ${forma}</span>
                      <span class="fw-bold">${Utils.formatMoeda(val)} (${pct}%)</span>
                    </div>
                    <div class="estoque-bar">
                      <div class="estoque-bar-fill" style="width:${pct}%;background:var(--marrom);"></div>
                    </div>
                  </div>`;
              }).join('') : '<p style="color:#999;">Sem dados</p>'}
            </div>
          </div>

          <!-- DETALHE DAS VENDAS -->
          <div class="card">
            <div class="card-header"><span class="card-title">📋 Detalhe das Vendas</span></div>
            <div class="card-body">
              <div class="table-wrapper">
                <table>
                  <thead><tr><th>#</th><th>Data</th><th>Hora</th><th>Funcionária</th><th>Itens</th><th>Pagamento</th><th>Total</th></tr></thead>
                  <tbody>
                    ${res.data.map(v => `
                      <tr>
                        <td>${v.ID}</td>
                        <td>${v.DATA}</td>
                        <td>${v.HORA ? v.HORA.split(' ')[1] || v.HORA : '-'}</td>
                        <td>${v.FUNCIONARIA}</td>
                        <td style="font-size:0.8rem;">${(v.itens||[]).map(i => `${i.PRODUTO}(${i.QUANTIDADE})`).join(', ') || '-'}</td>
                        <td><span class="badge badge-info">${v.FORMA_PAGAMENTO}</span></td>
                        <td class="text-verde fw-bold">${Utils.formatMoeda(v.TOTAL)}</td>
                      </tr>`).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  // ── RELATÓRIO DE CAIXA / HORAS ─────────────────────────────
  async caixa() {
    const de   = document.getElementById('relCaixaDe')?.value;
    const ate  = document.getElementById('relCaixaAte')?.value;
    const func = document.getElementById('relCaixaFunc')?.value;

    if (!de || !ate) { Utils.toast('Selecione o período!', 'warning'); return; }

    Utils.loading(true);
    const res = await API.call('getRelatorioCaixa', { dataInicio: de, dataFim: ate, funcionaria: func });
    Utils.loading(false);

    const result = document.getElementById('relatorioResult');
    if (!result) return;

    if (!res.success || !res.data?.length) {
      result.innerHTML = `<div class="alert alert-warning">⚠️ Nenhum registro de caixa encontrado no período.</div>`;
      return;
    }

    const periodo = `${de.split('-').reverse().join('/')} a ${ate.split('-').reverse().join('/')}`;

    // Agrupar por funcionária
    const funcMap = {};
    res.data.forEach(c => {
      if (!funcMap[c.FUNCIONARIA]) funcMap[c.FUNCIONARIA] = { turnos: 0, totalMin: 0, totalVendas: 0 };
      funcMap[c.FUNCIONARIA].turnos++;
      funcMap[c.FUNCIONARIA].totalVendas += c.TOTAL_GERAL || 0;
      // Calcular minutos
      if (c.HORA_ABERTURA && c.HORA_FECHAMENTO) {
        try {
          const getTime = str => {
            const parts = str.split(' ');
            const t = parts.length > 1 ? parts[1] : parts[0];
            const [h,m,s] = t.split(':').map(Number);
            return h * 60 + m + (s||0)/60;
          };
          funcMap[c.FUNCIONARIA].totalMin += Math.abs(getTime(c.HORA_FECHAMENTO) - getTime(c.HORA_ABERTURA));
        } catch {}
      }
    });

    result.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">🕐 Relatório de Caixa / Horas — ${periodo}</span>
          <button class="btn btn-sm btn-secondary" onclick="Relatorios.imprimir('relCaixaConteudo')">🖨️ Imprimir</button>
        </div>
        <div class="card-body" id="relCaixaConteudo">

          <!-- RESUMO POR FUNCIONÁRIA -->
          <div class="card mb-2" style="border:2px solid var(--amarelo);">
            <div class="card-header"><span class="card-title">👥 Resumo por Funcionária</span></div>
            <div class="card-body">
              <div class="table-wrapper">
                <table>
                  <thead><tr><th>Funcionária</th><th>Turnos</th><th>Horas Trabalhadas</th><th>Total Vendido</th></tr></thead>
                  <tbody>
                    ${Object.entries(funcMap).map(([nome, dados]) => {
                      const h = Math.floor(dados.totalMin / 60);
                      const m = Math.floor(dados.totalMin % 60);
                      return `<tr>
                        <td><strong>${nome}</strong></td>
                        <td>${dados.turnos}</td>
                        <td class="fw-bold">${h}h ${m}min</td>
                        <td class="text-verde fw-bold">${Utils.formatMoeda(dados.totalVendas)}</td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <!-- DETALHE DOS TURNOS -->
          <div class="card">
            <div class="card-header"><span class="card-title">📋 Detalhe dos Turnos</span></div>
            <div class="card-body">
              <div class="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>#</th><th>Funcionária</th><th>Data</th>
                      <th>Abertura</th><th>Fechamento</th><th>Duração</th>
                      <th>Dinheiro</th><th>Débito</th><th>Crédito</th><th>PIX</th><th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${res.data.map(c => {
                      let duracao = '-';
                      if (c.HORA_ABERTURA && c.HORA_FECHAMENTO) {
                        try {
                          const getTime = str => {
                            const parts = str.split(' ');
                            const t = parts.length > 1 ? parts[1] : parts[0];
                            const [h,m] = t.split(':').map(Number);
                            return h * 60 + m;
                          };
                          const diff = Math.abs(getTime(c.HORA_FECHAMENTO) - getTime(c.HORA_ABERTURA));
                          duracao = `${Math.floor(diff/60)}h ${diff%60}min`;
                        } catch {}
                      }
                      return `<tr>
                        <td>${c.ID}</td>
                        <td><strong>${c.FUNCIONARIA}</strong></td>
                        <td>${c.DATA}</td>
                        <td>${c.HORA_ABERTURA ? c.HORA_ABERTURA.split(' ')[1]||c.HORA_ABERTURA : '-'}</td>
                        <td>${c.HORA_FECHAMENTO ? c.HORA_FECHAMENTO.split(' ')[1]||c.HORA_FECHAMENTO : '⏳ Aberto'}</td>
                        <td>${duracao}</td>
                        <td>${Utils.formatMoeda(c.TOTAL_DINHEIRO)}</td>
                        <td>${Utils.formatMoeda(c.TOTAL_DEBITO)}</td>
                        <td>${Utils.formatMoeda(c.TOTAL_CREDITO)}</td>
                        <td>${Utils.formatMoeda(c.TOTAL_PIX)}</td>
                        <td class="fw-bold text-verde">${Utils.formatMoeda(c.TOTAL_GERAL)}</td>
                      </tr>`;
                    }).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>`;
  },

  imprimir(containerId) {
    const conteudo = document.getElementById(containerId)?.innerHTML || '';
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head>
        <title>Relatório - Lanchonete Empório</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; color: #333; font-size: 13px; }
          h1 { color: #5D3A1A; border-bottom: 3px solid #F5C518; padding-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 10px 0; }
          th { background: #5D3A1A; color: white; padding: 6px 8px; text-align: left; font-size: 11px; }
          td { padding: 6px 8px; border-bottom: 1px solid #eee; }
          .stat-card { border: 1px solid #ddd; padding: 8px 12px; margin: 4px; display: inline-block; min-width: 120px; }
          .stat-label { font-size: 10px; color: #666; text-transform: uppercase; }
          .stat-value { font-size: 16px; font-weight: bold; color: #5D3A1A; }
          .badge { padding: 2px 6px; border-radius: 10px; font-size: 10px; font-weight: bold; }
          .card { border: 1px solid #ddd; margin: 10px 0; border-radius: 6px; overflow: hidden; }
          .card-header { background: #f5f5f5; padding: 8px 12px; font-weight: bold; border-bottom: 1px solid #ddd; }
          .card-body { padding: 12px; }
          @media print { button { display: none !important; } }
        </style>
      </head><body>
        <h1>🍔 Lanchonete Empório</h1>
        ${conteudo}
        <script>setTimeout(()=>window.print(), 500);<\/script>
      </body></html>`);
    win.document.close();
  }
};