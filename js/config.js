// ============================================================
// CONFIGURAÇÃO DO SISTEMA - LANCHONETE EMPÓRIO
// ============================================================

const CONFIG = {
  // URL do Google Apps Script - Lanchonete Empório
  APPS_SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbwCkvRjiFXAW4cMgjLU6qKAIWTelHYTbncl1UNM-w4flgyN0BMJ6pozT5d4aZGEZ4-z/exec',

  // Nome do sistema
  NOME_SISTEMA: 'Lanchonete Empório',

  // Versão
  VERSAO: '1.0.0',

  // Perfis de acesso
  PERFIS: {
    PROPRIETARIO: 'PROPRIETARIO',
    FINANCEIRO: 'FINANCEIRO',
    FUNCIONARIA: 'FUNCIONARIA'
  },

  // Formas de pagamento
  FORMAS_PAGAMENTO: ['DINHEIRO', 'DEBITO', 'CREDITO', 'PIX'],

  // Tipos de salário
  TIPOS_SALARIO: ['MENSAL', 'QUINZENAL', 'HORA'],

  // Categorias do cardápio
  CATEGORIAS_CARDAPIO: [
    'LANCHES', 'BEBIDAS', 'SALGADOS', 'DOCES',
    'COMBOS', 'SOBREMESAS', 'OUTROS'
  ],

  // Categorias de contas a pagar
  CATEGORIAS_CONTAS: [
    'COMPRA', 'ALUGUEL', 'ENERGIA', 'AGUA',
    'GAS', 'INTERNET', 'SALARIO', 'OUTROS'
  ]
};

// ============================================================
// SERVIÇO DE API - Comunicação com Google Sheets
// ============================================================
const API = {
  async call(action, params = {}) {
    try {
      if (CONFIG.APPS_SCRIPT_URL === 'COLE_SUA_URL_AQUI') {
        return this.mockResponse(action, params);
      }
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...params })
      });
      return await response.json();
    } catch (err) {
      console.error('Erro na API:', err);
      return { success: false, message: 'Erro de conexão com o servidor.' };
    }
  },

  
      getDashboard: () => ({
        success: true,
        dashboard: {
          totalVendasHoje: 1250.50,
          qtdVendasHoje: 23,
          caixasAbertos: 1,
          estoqueCritico: 3,
          contasPendentes: 5,
          totalContasPendentes: 3200.00,
          saldoAtual: 8750.00
        }
      }),
      getCardapio: () => ({
        success: true,
        data: [
          { ID: 1, PRODUTO: 'X-Burguer', CATEGORIA: 'LANCHES', PRECO: 18.00, CUSTO: 8.00, ATIVO: 'SIM' },
          { ID: 2, PRODUTO: 'X-Salada', CATEGORIA: 'LANCHES', PRECO: 20.00, CUSTO: 9.00, ATIVO: 'SIM' },
          { ID: 3, PRODUTO: 'X-Bacon', CATEGORIA: 'LANCHES', PRECO: 22.00, CUSTO: 10.00, ATIVO: 'SIM' },
          { ID: 4, PRODUTO: 'Coca-Cola Lata', CATEGORIA: 'BEBIDAS', PRECO: 6.00, CUSTO: 2.50, ATIVO: 'SIM' },
          { ID: 5, PRODUTO: 'Suco Natural', CATEGORIA: 'BEBIDAS', PRECO: 8.00, CUSTO: 3.00, ATIVO: 'SIM' },
          { ID: 6, PRODUTO: 'Coxinha', CATEGORIA: 'SALGADOS', PRECO: 5.00, CUSTO: 2.00, ATIVO: 'SIM' },
          { ID: 7, PRODUTO: 'Pastel', CATEGORIA: 'SALGADOS', PRECO: 6.00, CUSTO: 2.50, ATIVO: 'SIM' },
          { ID: 8, PRODUTO: 'Combo Lanche+Bebida', CATEGORIA: 'COMBOS', PRECO: 22.00, CUSTO: 10.00, ATIVO: 'SIM' },
        ]
      }),
      getEstoque: () => ({
        success: true,
        data: [
          { ID: 1, PRODUTO: 'X-Burguer', QUANTIDADE: 15, UNIDADE: 'UN', ESTOQUE_MINIMO: 10 },
          { ID: 2, PRODUTO: 'X-Salada', QUANTIDADE: 8, UNIDADE: 'UN', ESTOQUE_MINIMO: 10 },
          { ID: 3, PRODUTO: 'Coca-Cola Lata', QUANTIDADE: 5, UNIDADE: 'UN', ESTOQUE_MINIMO: 12 },
          { ID: 4, PRODUTO: 'Coxinha', QUANTIDADE: 30, UNIDADE: 'UN', ESTOQUE_MINIMO: 20 },
        ]
      }),
      getFuncionarios: () => ({
        success: true,
        data: [
          { ID: 1, NOME: 'Ana Silva', TELEFONE: '(11) 99999-1111', CARGO: 'Atendente', TIPO_SALARIO: 'HORA', VALOR_SALARIO: 15.00, ATIVO: 'SIM' },
          { ID: 2, NOME: 'Maria Santos', TELEFONE: '(11) 99999-2222', CARGO: 'Atendente', TIPO_SALARIO: 'MENSAL', VALOR_SALARIO: 1500.00, ATIVO: 'SIM' },
          { ID: 3, NOME: 'Joana Lima', TELEFONE: '(11) 99999-3333', CARGO: 'Cozinheira', TIPO_SALARIO: 'MENSAL', VALOR_SALARIO: 1800.00, ATIVO: 'SIM' },
        ]
      }),
      getFornecedores: () => ({
        success: true,
        data: [
          { ID: 1, NOME: 'Distribuidora ABC', TELEFONE: '(11) 3333-1111', EMAIL: 'abc@email.com', PRODUTO_PRINCIPAL: 'Bebidas', ATIVO: 'SIM' },
          { ID: 2, NOME: 'Frigorífico XYZ', TELEFONE: '(11) 3333-2222', EMAIL: 'xyz@email.com', PRODUTO_PRINCIPAL: 'Carnes', ATIVO: 'SIM' },
        ]
      }),
      getContasPagar: () => ({
        success: true,
        data: [
          { ID: 1, DESCRICAO: 'Aluguel', FORNECEDOR: '-', VALOR: 2000.00, DATA_VENCIMENTO: '10/09/2026', STATUS: 'PENDENTE', CATEGORIA: 'ALUGUEL' },
          { ID: 2, DESCRICAO: 'Energia Elétrica', FORNECEDOR: 'CPFL', VALOR: 450.00, DATA_VENCIMENTO: '15/09/2026', STATUS: 'PENDENTE', CATEGORIA: 'ENERGIA' },
          { ID: 3, DESCRICAO: 'Compra Distribuidora ABC', FORNECEDOR: 'Distribuidora ABC', VALOR: 750.00, DATA_VENCIMENTO: '20/09/2026', STATUS: 'PENDENTE', CATEGORIA: 'COMPRA' },
        ]
      }),
      getFluxoCaixa: () => ({
        success: true,
        data: [
          { ID: 1, DATA: '01/09/2026', TIPO: 'ENTRADA', DESCRICAO: 'Vendas do dia', VALOR: 1200.00, SALDO_ACUMULADO: 1200.00 },
          { ID: 2, DATA: '02/09/2026', TIPO: 'ENTRADA', DESCRICAO: 'Vendas do dia', VALOR: 980.00, SALDO_ACUMULADO: 2180.00 },
          { ID: 3, DATA: '03/09/2026', TIPO: 'SAIDA', DESCRICAO: 'Compra Distribuidora', VALOR: 500.00, SALDO_ACUMULADO: 1680.00 },
        ]
      }),
      default: () => ({ success: true, data: [], message: 'OK' })
    };
    const fn = mocks[action] || mocks.default;
    return fn(params);
  }
};


  getCaixa() {
    const c = sessionStorage.getItem('emporio_caixa');
    return c ? JSON.parse(c) : null;
  },
  setCaixa(caixa) {
    sessionStorage.setItem('emporio_caixa', JSON.stringify(caixa));
  },
  clear() {
    sessionStorage.removeItem('emporio_user');
    sessionStorage.removeItem('emporio_caixa');
  },
  isLoggedIn() { return !!this.get(); },
  isPropietario() { return this.get()?.perfil === 'PROPRIETARIO'; },
  isFinanceiro() { return ['PROPRIETARIO', 'FINANCEIRO'].includes(this.get()?.perfil); },
  isFuncionaria() { return !!this.get(); }
};

// ============================================================
// UTILITÁRIOS
// ============================================================
const Utils = {
  formatMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  },
  formatData(data) {
    if (!data) return '';
    return data;
  },
  agora() {
    return new Date().toLocaleString('pt-BR');
  },
  hoje() {
    return new Date().toLocaleDateString('pt-BR');
  },
  toast(msg, tipo = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast toast-${tipo} show`;
    setTimeout(() => t.classList.remove('show'), 3500);
  },
  confirm(msg) {
    return window.confirm(msg);
  },
  loading(show) {
    const l = document.getElementById('loading');
    if (l) l.style.display = show ? 'flex' : 'none';
  }
};