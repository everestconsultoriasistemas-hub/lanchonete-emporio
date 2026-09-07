// ============================================================
// APP.JS - LANCHONETE EMPÓRIO
// Controle principal: Login, Navegação, Sidebar, Relógio
// ============================================================

const MENUS = {
  FUNCIONARIA: [
    { id: 'caixa',   icon: '🕐', label: 'Abrir/Fechar Caixa' },
    { id: 'vendas',  icon: '🛒', label: 'Registrar Venda' },
  ],
  FINANCEIRO: [
    { section: 'Operacional' },
    { id: 'dashboard',    icon: '🏠', label: 'Dashboard' },
    { id: 'caixa',        icon: '🕐', label: 'Caixas / Turnos' },
    { id: 'vendas',       icon: '🛒', label: 'Vendas' },
    { section: 'Estoque & Produtos' },
    { id: 'cardapio',     icon: '🍔', label: 'Cardápio' },
    { id: 'estoque',      icon: '📦', label: 'Estoque' },
    { section: 'Financeiro' },
    { id: 'compras',      icon: '🛍️', label: 'Compras' },
    { id: 'contas',       icon: '💳', label: 'Contas a Pagar' },
    { id: 'despesas',     icon: '🏠', label: 'Despesas Fixas' },
    { id: 'fluxo',        icon: '💵', label: 'Fluxo de Caixa' },
    { section: 'Relatórios' },
    { id: 'relatorios',   icon: '📈', label: 'Relatórios' },
  ],
  PROPRIETARIO: [
    { section: 'Operacional' },
    { id: 'dashboard',    icon: '🏠', label: 'Dashboard' },
    { id: 'caixa',        icon: '🕐', label: 'Caixas / Turnos' },
    { id: 'vendas',       icon: '🛒', label: 'Vendas' },
    { section: 'Estoque & Produtos' },
    { id: 'cardapio',     icon: '🍔', label: 'Cardápio' },
    { id: 'estoque',      icon: '📦', label: 'Estoque' },
    { section: 'Pessoal' },
    { id: 'funcionarios', icon: '👥', label: 'Funcionários' },
    { id: 'consumo',      icon: '🍽️', label: 'Consumo Funcionários' },
    { id: 'folha',        icon: '💰', label: 'Folha de Pagamento' },
    { section: 'Financeiro' },
    { id: 'fornecedores', icon: '🚚', label: 'Fornecedores' },
    { id: 'compras',      icon: '🛍️', label: 'Compras' },
    { id: 'contas',       icon: '💳', label: 'Contas a Pagar' },
    { id: 'despesas',     icon: '🏠', label: 'Despesas Fixas' },
    { id: 'fluxo',        icon: '💵', label: 'Fluxo de Caixa' },
    { section: 'Relatórios' },
    { id: 'relatorios',   icon: '📈', label: 'Relatórios' },
    { section: 'Administração' },
    { id: 'usuarios',     icon: '👤', label: 'Usuários' },
  ]
};

const PAGE_TITLES = {
  dashboard:    '🏠 Dashboard',
  caixa:        '🕐 Caixa / Turnos',
  vendas:       '🛒 Registro de Vendas',
  cardapio:     '🍔 Cardápio',
  estoque:      '📦 Controle de Estoque',
  funcionarios: '👥 Funcionários',
  consumo:      '🍽️ Consumo de Funcionários',
  folha:        '💰 Folha de Pagamento',
  fornecedores: '🚚 Fornecedores',
  compras:      '🛍️ Registro de Compras',
  contas:       '💳 Contas a Pagar',
  despesas:     '🏠 Despesas Fixas',
  fluxo:        '💵 Fluxo de Caixa',
  relatorios:   '📈 Relatórios',
  usuarios:     '👤 Cadastro de Usuários',
};

const App = {
  currentPage: null,

  // ── LOGIN ──────────────────────────────────────────────────
  async login() {
    const login = document.getElementById('loginUser').value.trim();
    const senha = document.getElementById('loginPass').value.trim();
    if (!login || !senha) { Utils.toast('Preencha usuário e senha!', 'warning'); return; }

    Utils.loading(true);
    const res = await API.call('login', { login, senha });
    Utils.loading(false);

    if (res.success) {
      Session.set(res.usuario);
      document.getElementById('loginError').classList.add('hidden');
      this.initApp();
    } else {
      document.getElementById('loginError').classList.remove('hidden');
    }
  },

  // ── INICIALIZAR APP ────────────────────────────────────────
  initApp() {
    const user = Session.get();
    document.getElementById('loginPage').classList.add('hidden');
    document.getElementById('appLayout').classList.remove('hidden');

    // Preencher sidebar
    document.getElementById('sidebarUserName').textContent = user.nome;
    const roles = { PROPRIETARIO: '👑 Proprietário', FINANCEIRO: '💰 Financeiro', FUNCIONARIA: '👩‍💼 Funcionária' };
    document.getElementById('sidebarUserRole').textContent = roles[user.perfil] || user.perfil;

    this.buildMenu(user.perfil);
    this.startClock();

    // Página inicial por perfil
    const startPage = user.perfil === 'FUNCIONARIA' ? 'caixa' : 'dashboard';
    this.navigate(startPage);

    // Enter no login
    document.getElementById('loginPass').addEventListener('keydown', e => {
      if (e.key === 'Enter') App.login();
    });
  },

  

  

    // Mostrar página
    const page = document.getElementById(`page-${pageId}`);
    if (page) page.classList.remove('hidden');

    // Ativar nav item
    const navItem = document.getElementById(`nav-${pageId}`);
    if (navItem) navItem.classList.add('active');

    // Título
    document.getElementById('topbarTitle').textContent = PAGE_TITLES[pageId] || pageId;
    this.currentPage = pageId;

    // Fechar sidebar no mobile
    this.closeSidebar();

    // Carregar dados da página
    this.loadPage(pageId);
  },

  // ── CARREGAR DADOS DA PÁGINA ───────────────────────────────
  loadPage(pageId) {
    switch (pageId) {
      case 'dashboard':    Dashboard.load(); break;
      case 'caixa':        Caixa.load(); break;
      case 'vendas':       Vendas.load(); break;
      case 'cardapio':     Cardapio.load(); break;
      case 'estoque':      Estoque.load(); break;
      case 'funcionarios': Funcionarios.load(); break;
      case 'consumo':      Consumo.load(); break;
      case 'folha':        Folha.init(); break;
      case 'fornecedores': Fornecedores.load(); break;
      case 'compras':      Compras.load(); break;
      case 'contas':       Contas.load(); break;
      case 'despesas':     Despesas.load(); break;
      case 'fluxo':        Fluxo.load(); break;
      case 'relatorios':   Relatorios.init(); break;
      case 'usuarios':     Usuarios.load(); break;
    }
  },

  // ── RELÓGIO ────────────────────────────────────────────────
  startClock() {
    const update = () => {
      const now = new Date();
      document.getElementById('topbarTime').textContent =
        now.toLocaleString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };
    update();
    setInterval(update, 1000);
  },

  // ── SIDEBAR MOBILE ─────────────────────────────────────────
  toggleSidebar() {
    document.getElementById('sidebar').classList.toggle('open');
    document.getElementById('sidebarOverlay').classList.toggle('open');
  },
  closeSidebar() {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('open');
  },

  // ── LOGOUT ─────────────────────────────────────────────────
  logout() {
    if (!Utils.confirm('Deseja sair do sistema?')) return;
    Session.clear();
    document.getElementById('appLayout').classList.add('hidden');
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
  }
};

// ── MODAL GLOBAL ──────────────────────────────────────────────
const Modal = {
  open(title, bodyHTML, footerHTML = '') {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = bodyHTML;
    document.getElementById('modalFooter').innerHTML = footerHTML;
    document.getElementById('modalOverlay').classList.add('open');
  },
  close() {
    document.getElementById('modalOverlay').classList.remove('open');
  }
};

// Fechar modal clicando fora
document.getElementById('modalOverlay').addEventListener('click', function(e) {
  if (e.target === this) Modal.close();
});

// Enter no login
window.addEventListener('DOMContentLoaded', () => {
  document.getElementById('loginUser').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('loginPass').focus();
  });
  document.getElementById('loginPass').addEventListener('keydown', e => {
    if (e.key === 'Enter') App.login();
  });
});