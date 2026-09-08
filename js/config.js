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

      // Google Apps Script: usar Content-Type text/plain para evitar CORS preflight
      const response = await fetch(CONFIG.APPS_SCRIPT_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action, ...params })
      });

      const text = await response.text();
      try {
        return JSON.parse(text);
      } catch {
        throw new Error('Resposta inválida do servidor');
      }

    } catch (err) {
      console.warn('Apps Script indisponível, usando modo demo:', err.message);
      return this.mockResponse(action, params);
    }
  },

  // Respostas simuladas para demonstração
  mockResponse(action, params) {
    const mocks = {
      login: (p) => {
        const users = [
          { id: 1, nome: 'Proprietário', perfil: 'PROPRIETARIO', login: 'admin',      senha: 'admin123', ativo: 'SIM',
            abas: ['dashboard','caixa','vendas','cardapio','estoque','funcionarios','consumo','folha','fornecedores','compras','contas','despesas','fluxo','relatorios','usuarios'] },
          { id: 2, nome: 'Financeiro',   perfil: 'FINANCEIRO',   login: 'financeiro', senha: 'fin123',   ativo: 'SIM',
            abas: ['dashboard','caixa','vendas','cardapio','estoque','fornecedores','compras','contas','despesas','fluxo','relatorios'] },
          { id: 3, nome: 'Ana Silva',    perfil: 'FUNCIONARIA',  login: 'ana',        senha: '123456',   ativo: 'SIM',
            abas: ['caixa','vendas'] },
          { id: 4, nome: 'Maria Santos', perfil: 'FUNCIONARIA',  login: 'maria',      senha: '123456',   ativo: 'SIM',
            abas: ['caixa','vendas'] },
        ];
        const user = users.find(u => u.login === p.login && u.senha === p.senha);
        if (!user) return { success: false, message: 'Login ou senha incorretos!' };
        if (user.ativo === 'NAO') return { success: false, message: 'Usuário inativo! Contate o administrador.' };
        return { success: true, usuario: { id: user.id, nome: user.nome, perfil: user.perfil, abas: user.abas } };
      },
      getUsuarios: () => ({
        success: true,
        data: [
          { ID: 1, NOME: 'Proprietário', LOGIN: 'admin',      PERFIL: 'PROPRIETARIO', ATIVO: 'SIM',
            ABAS: 'dashboard,caixa,vendas,cardapio,estoque,funcionarios,consumo,folha,fornecedores,compras,contas,despesas,fluxo,relatorios,usuarios' },
          { ID: 2, NOME: 'Financeiro',   LOGIN: 'financeiro', PERFIL: 'FINANCEIRO',   ATIVO: 'SIM',
            ABAS: 'dashboard,caixa,vendas,cardapio,estoque,fornecedores,compras,contas,despesas,fluxo,relatorios' },
          { ID: 3, NOME: 'Ana Silva',    LOGIN: 'ana',        PERFIL: 'FUNCIONARIA',  ATIVO: 'SIM',
            ABAS: 'caixa,vendas' },
          { ID: 4, NOME: 'Maria Santos', LOGIN: 'maria',      PERFIL: 'FUNCIONARIA',  ATIVO: 'SIM',
            ABAS: 'caixa,vendas' },
        ]
      }),
      saveUsuario: () => ({ success: true, message: '✅ Usuário salvo! (modo demo - conecte o Sheets para persistir)' }),
      resetSenha:  () => ({ success: true, message: '✅ Senha redefinida! (modo demo - conecte o Sheets para persistir)' }),
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
          { ID: 1, PRODUTO: 'X-Burguer',          CATEGORIA: 'LANCHES',  PRECO: 18.00, CUSTO: 8.00,  ATIVO: 'SIM' },
          { ID: 2, PRODUTO: 'X-Salada',            CATEGORIA: 'LANCHES',  PRECO: 20.00, CUSTO: 9.00,  ATIVO: 'SIM' },
          { ID: 3, PRODUTO: 'X-Bacon',             CATEGORIA: 'LANCHES',  PRECO: 22.00, CUSTO: 10.00, ATIVO: 'SIM' },
          { ID: 4, PRODUTO: 'Coca-Cola Lata',      CATEGORIA: 'BEBIDAS',  PRECO: 6.00,  CUSTO: 2.50,  ATIVO: 'SIM' },
          { ID: 5, PRODUTO: 'Suco Natural',        CATEGORIA: 'BEBIDAS',  PRECO: 8.00,  CUSTO: 3.00,  ATIVO: 'SIM' },
          { ID: 6, PRODUTO: 'Coxinha',             CATEGORIA: 'SALGADOS', PRECO: 5.00,  CUSTO: 2.00,  ATIVO: 'SIM' },
          { ID: 7, PRODUTO: 'Pastel',              CATEGORIA: 'SALGADOS', PRECO: 6.00,  CUSTO: 2.50,  ATIVO: 'SIM' },
          { ID: 8, PRODUTO: 'Combo Lanche+Bebida', CATEGORIA: 'COMBOS',   PRECO: 22.00, CUSTO: 10.00, ATIVO: 'SIM' },
        ]
      }),
      getEstoque: () => ({
        success: true,
        data: [
          { ID: 1, PRODUTO: 'X-Burguer',      QUANTIDADE: 15, UNIDADE: 'UN', ESTOQUE_MINIMO: 10 },
          { ID: 2, PRODUTO: 'X-Salada',       QUANTIDADE: 8,  UNIDADE: 'UN', ESTOQUE_MINIMO: 10 },
          { ID: 3, PRODUTO: 'Coca-Cola Lata', QUANTIDADE: 5,  UNIDADE: 'UN', ESTOQUE_MINIMO: 12 },
          { ID: 4, PRODUTO: 'Coxinha',        QUANTIDADE: 30, UNIDADE: 'UN', ESTOQUE_MINIMO: 20 },
        ]
      }),
      getFuncionarios: () => ({
        success: true,
        data: [
          { ID: 1, NOME: 'Ana Silva',    TELEFONE: '(11) 99999-1111', CARGO: 'Atendente',  TIPO_SALARIO: 'HORA',   VALOR_SALARIO: 15.00,   ATIVO: 'SIM' },
          { ID: 2, NOME: 'Maria Santos', TELEFONE: '(11) 99999-2222', CARGO: 'Atendente',  TIPO_SALARIO: 'MENSAL', VALOR_SALARIO: 1500.00, ATIVO: 'SIM' },
          { ID: 3, NOME: 'Joana Lima',   TELEFONE: '(11) 99999-3333', CARGO: 'Cozinheira', TIPO_SALARIO: 'MENSAL', VALOR_SALARIO: 1800.00, ATIVO: 'SIM' },
        ]
      }),
      getFornecedores: () => ({
        success: true,
        data: [
          { ID: 1, NOME: 'Distribuidora ABC', TELEFONE: '(11) 3333-1111', EMAIL: 'abc@email.com', PRODUTO_PRINCIPAL: 'Bebidas', ATIVO: 'SIM' },
          { ID: 2, NOME: 'Frigorífico XYZ',   TELEFONE: '(11) 3333-2222', EMAIL: 'xyz@email.com', PRODUTO_PRINCIPAL: 'Carnes',  ATIVO: 'SIM' },
        ]
      }),
      getContasPagar: () => ({
        success: true,
        data: [
          { ID: 1, DESCRICAO: 'Aluguel',          FORNECEDOR: '-',    VALOR: 2000.00, DATA_VENCIMENTO: '10/09/2026', STATUS: 'PENDENTE', CATEGORIA: 'ALUGUEL' },
          { ID: 2, DESCRICAO: 'Energia Elétrica', FORNECEDOR: 'CPFL', VALOR: 450.00,  DATA_VENCIMENTO: '15/09/2026', STATUS: 'PENDENTE', CATEGORIA: 'ENERGIA' },
          { ID: 3, DESCRICAO: 'Água',             FORNECEDOR: 'SABESP',VALOR: 120.00, DATA_VENCIMENTO: '20/09/2026', STATUS: 'PENDENTE', CATEGORIA: 'AGUA'   },
        ]
      }),
      getDespesasFixas: () => ({
        success: true,
        data: [
          { ID: 1, DESCRICAO: 'Aluguel',          VALOR: 2000.00, DIA_VENCIMENTO: 10, ATIVO: 'SIM' },
          { ID: 2, DESCRICAO: 'Energia Elétrica', VALOR: 450.00,  DIA_VENCIMENTO: 15, ATIVO: 'SIM' },
          { ID: 3, DESCRICAO: 'Água',             VALOR: 120.00,  DIA_VENCIMENTO: 20, ATIVO: 'SIM' },
          { ID: 4, DESCRICAO: 'Internet',         VALOR: 150.00,  DIA_VENCIMENTO:  5, ATIVO: 'SIM' },
          { ID: 5, DESCRICAO: 'Gás',              VALOR: 200.00,  DIA_VENCIMENTO: 10, ATIVO: 'SIM' },
        ]
      }),
      getFluxoCaixa: () => ({
        success: true,
        data: [
          { ID: 1, DATA: '01/09/2026', TIPO: 'ENTRADA', DESCRICAO: 'Vendas do dia',        VALOR: 1200.00, SALDO_ACUMULADO: 1200.00 },
          { ID: 2, DATA: '02/09/2026', TIPO: 'ENTRADA', DESCRICAO: 'Vendas do dia',        VALOR: 980.00,  SALDO_ACUMULADO: 2180.00 },
          { ID: 3, DATA: '03/09/2026', TIPO: 'SAIDA',   DESCRICAO: 'Compra Distribuidora', VALOR: 500.00,  SALDO_ACUMULADO: 1680.00 },
          { ID: 4, DATA: '04/09/2026', TIPO: 'ENTRADA', DESCRICAO: 'Vendas do dia',        VALOR: 1100.00, SALDO_ACUMULADO: 2780.00 },
          { ID: 5, DATA: '05/09/2026', TIPO: 'SAIDA',   DESCRICAO: 'Pagamento Aluguel',    VALOR: 2000.00, SALDO_ACUMULADO: 780.00  },
        ]
      }),
      getRelatorioCaixa: () => ({
        success: true,
        data: [
          { ID: 1, FUNCIONARIA: 'Ana Silva',    DATA: '08/09/2026', HORA_ABERTURA: '08/09/2026 08:00:00', HORA_FECHAMENTO: '08/09/2026 14:00:00', TOTAL_DINHEIRO: 300.00, TOTAL_DEBITO: 200.00, TOTAL_CREDITO: 150.00, TOTAL_PIX: 100.00, TOTAL_GERAL: 750.00 },
          { ID: 2, FUNCIONARIA: 'Maria Santos', DATA: '08/09/2026', HORA_ABERTURA: '08/09/2026 14:00:00', HORA_FECHAMENTO: '08/09/2026 20:00:00', TOTAL_DINHEIRO: 250.00, TOTAL_DEBITO: 180.00, TOTAL_CREDITO: 120.00, TOTAL_PIX: 80.00,  TOTAL_GERAL: 630.00 },
        ]
      }),
      getRelatorioVendas: () => ({
        success: true,
        data: [
          { ID: 1, DATA: '08/09/2026', HORA: '08/09/2026 09:30:00', FUNCIONARIA: 'Ana Silva',    FORMA_PAGAMENTO: 'DINHEIRO', TOTAL: 44.00, itens: [{ PRODUTO: 'X-Burguer', QUANTIDADE: 2, SUBTOTAL: 36.00 }, { PRODUTO: 'Coca-Cola Lata', QUANTIDADE: 2, SUBTOTAL: 12.00 }] },
          { ID: 2, DATA: '08/09/2026', HORA: '08/09/2026 10:15:00', FUNCIONARIA: 'Ana Silva',    FORMA_PAGAMENTO: 'PIX',      TOTAL: 20.00, itens: [{ PRODUTO: 'X-Salada', QUANTIDADE: 1, SUBTOTAL: 20.00 }] },
          { ID: 3, DATA: '08/09/2026', HORA: '08/09/2026 15:00:00', FUNCIONARIA: 'Maria Santos', FORMA_PAGAMENTO: 'DEBITO',   TOTAL: 22.00, itens: [{ PRODUTO: 'Combo Lanche+Bebida', QUANTIDADE: 1, SUBTOTAL: 22.00 }] },
        ],
        resumo: { totalGeral: 86.00, totalDinheiro: 44.00, totalDebito: 22.00, totalCredito: 0, totalPix: 20.00, qtdVendas: 3 }
      }),
      getConsumoFunc:    () => ({ success: true, data: [] }),
      getFolhaPagamento: () => ({ success: true, data: [] }),
      getCompras:        () => ({ success: true, data: [] }),
      abrirCaixa:        () => ({ success: true, idCaixa: 1, horaAbertura: new Date().toLocaleString('pt-BR'), message: 'Caixa aberto! (modo demo)' }),
      fecharCaixa:       () => ({ success: true, horaFechamento: new Date().toLocaleString('pt-BR'), totalGeral: 750.00, message: 'Caixa fechado! (modo demo)' }),
      registrarVenda:    () => ({ success: true, idVenda: Math.floor(Math.random()*1000)+1, message: 'Venda registrada! (modo demo)' }),
      saveCardapio:      () => ({ success: true, message: 'Produto salvo! (modo demo)' }),
      updateEstoque:     () => ({ success: true, message: 'Estoque atualizado! (modo demo)' }),
      saveFuncionario:   () => ({ success: true, message: 'Funcionário salvo! (modo demo)' }),
      saveConsumoFunc:   () => ({ success: true, message: 'Consumo registrado! (modo demo)' }),
      gerarFolha:        () => ({ success: true, message: 'Folha gerada! (modo demo)' }),
      saveFornecedor:    () => ({ success: true, message: 'Fornecedor salvo! (modo demo)' }),
      saveCompra:        () => ({ success: true, idConta: 1, message: 'Compra registrada! (modo demo)' }),
      saveContaPagar:    () => ({ success: true, message: 'Conta salva! (modo demo)' }),
      pagarConta:        () => ({ success: true, message: 'Pagamento registrado! (modo demo)' }),
      saveDespesaFixa:   () => ({ success: true, message: 'Despesa salva! (modo demo)' }),
      default:           () => ({ success: true, data: [], message: 'OK (modo demo)' })
    };
    const fn = mocks[action] || mocks.default;
    return fn(params);
  }
};

// ============================================================
// GERENCIADOR DE SESSÃO
// ============================================================
const Session = {
  set(usuario) {
    if (usuario.abas && typeof usuario.abas === 'string') {
      usuario.abas = usuario.abas.split(',').filter(Boolean);
    }
    sessionStorage.setItem('emporio_user', JSON.stringify(usuario));
    sessionStorage.setItem('emporio_caixa', JSON.stringify(null));
  },
  get() {
    const u = sessionStorage.getItem('emporio_user');
    return u ? JSON.parse(u) : null;
  },
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
  isLoggedIn()    { return !!this.get(); },
  isPropietario() { return this.get()?.perfil === 'PROPRIETARIO'; },
  isFinanceiro()  { return ['PROPRIETARIO','FINANCEIRO'].includes(this.get()?.perfil); },
  isFuncionaria() { return !!this.get(); }
};

// ============================================================
// UTILITÁRIOS
// ============================================================
const Utils = {
  formatMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  },
  formatData(data) { return data || ''; },
  agora()  { return new Date().toLocaleString('pt-BR'); },
  hoje()   { return new Date().toLocaleDateString('pt-BR'); },
  toast(msg, tipo = 'success') {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = `toast toast-${tipo} show`;
    setTimeout(() => t.classList.remove('show'), 3500);
  },
  confirm(msg) { return window.confirm(msg); },
  loading(show) {
    const l = document.getElementById('loading');
    if (l) l.style.display = show ? 'flex' : 'none';
  }
};