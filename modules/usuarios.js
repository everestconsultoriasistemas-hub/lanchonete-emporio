// ============================================================
// MÓDULO: CADASTRO DE USUÁRIOS - Login, Senha e Permissões
// ============================================================
const Usuarios = {
  dados: [],

  // Definição de todas as abas disponíveis e seus perfis
  ABAS: [
    { id: 'dashboard',    label: '🏠 Dashboard',              grupo: 'Operacional' },
    { id: 'caixa',        label: '🕐 Caixa / Turnos',         grupo: 'Operacional' },
    { id: 'vendas',       label: '🛒 Registro de Vendas',     grupo: 'Operacional' },
    { id: 'cardapio',     label: '🍔 Cardápio',               grupo: 'Estoque & Produtos' },
    { id: 'estoque',      label: '📦 Controle de Estoque',    grupo: 'Estoque & Produtos' },
    { id: 'funcionarios', label: '👥 Funcionários',           grupo: 'Pessoal' },
    { id: 'consumo',      label: '🍽️ Consumo Funcionários',   grupo: 'Pessoal' },
    { id: 'folha',        label: '💰 Folha de Pagamento',     grupo: 'Pessoal' },
    { id: 'fornecedores', label: '🚚 Fornecedores',           grupo: 'Financeiro' },
    { id: 'compras',      label: '🛍️ Compras',                grupo: 'Financeiro' },
    { id: 'contas',       label: '💳 Contas a Pagar',         grupo: 'Financeiro' },
    { id: 'despesas',     label: '🏠 Despesas Fixas',         grupo: 'Financeiro' },
    { id: 'fluxo',        label: '💵 Fluxo de Caixa',         grupo: 'Financeiro' },
    { id: 'relatorios',   label: '📈 Relatórios',             grupo: 'Relatórios' },
    { id: 'usuarios',     label: '👤 Cadastro de Usuários',   grupo: 'Administração' },
  ],

  // Perfis pré-definidos com permissões padrão
  PERFIS_PADRAO: {
    PROPRIETARIO: {
      label: '👑 Proprietário',
      abas: ['dashboard','caixa','vendas','cardapio','estoque','funcionarios',
             'consumo','folha','fornecedores','compras','contas','despesas',
             'fluxo','relatorios','usuarios']
    },
    FINANCEIRO: {
      label: '💰 Financeiro',
      abas: ['dashboard','caixa','vendas','cardapio','estoque',
             'fornecedores','compras','contas','despesas','fluxo','relatorios']
    },
    FUNCIONARIA: {
      label: '👩‍💼 Funcionária',
      abas: ['caixa','vendas']
    },
    PERSONALIZADO: {
      label: '⚙️ Personalizado',
      abas: []
    }
  },

  async load() {
    // Apenas proprietário pode acessar
    const user = Session.get();
    if (user?.perfil !== 'PROPRIETARIO') {
      document.getElementById('usuariosContent').innerHTML = `
        <div class="alert alert-danger">🚫 Acesso restrito ao Proprietário!</div>`;
      return;
    }
    Utils.loading(true);
    const res = await API.call('getUsuarios', {});
    Utils.loading(false);
    this.dados = res.success ? res.data : this.getDemoUsers();
    this.renderTabela();
  },

  getDemoUsers() {
    return [
      { ID: 1, NOME: 'Proprietário', LOGIN: 'admin',      PERFIL: 'PROPRIETARIO', ATIVO: 'SIM',
        ABAS: 'dashboard,caixa,vendas,cardapio,estoque,funcionarios,consumo,folha,fornecedores,compras,contas,despesas,fluxo,relatorios,usuarios' },
      { ID: 2, NOME: 'Financeiro',   LOGIN: 'financeiro', PERFIL: 'FINANCEIRO',   ATIVO: 'SIM',
        ABAS: 'dashboard,caixa,vendas,cardapio,estoque,fornecedores,compras,contas,despesas,fluxo,relatorios' },
      { ID: 3, NOME: 'Ana Silva',    LOGIN: 'ana',        PERFIL: 'FUNCIONARIA',  ATIVO: 'SIM',
        ABAS: 'caixa,vendas' },
      { ID: 4, NOME: 'Maria Santos', LOGIN: 'maria',      PERFIL: 'FUNCIONARIA',  ATIVO: 'SIM',
        ABAS: 'caixa,vendas' },
    ];
  },

  renderTabela() {
    const content = document.getElementById('usuariosContent');
    if (!content) return;

    content.innerHTML = `
      <div class="card">
        <div class="card-header">
          <span class="card-title">👤 Usuários do Sistema</span>
          <button class="btn btn-primary btn-sm" onclick="Usuarios.novo()">+ Novo Usuário</button>
        </div>
        <div class="card-body">
          <div class="alert alert-info" style="font-size:0.82rem;">
            🔒 Gerencie quem pode acessar o sistema e quais módulos cada usuário pode ver.
          </div>
          <div class="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Nome</th>
                  <th>Login</th>
                  <th>Perfil</th>
                  <th>Módulos Liberados</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody id="usuariosTable"></tbody>
            </table>
          </div>
        </div>
      </div>`;

    const tbody = document.getElementById('usuariosTable');
    if (!this.dados.length) {
      tbody.innerHTML = `<tr><td colspan="7" class="text-center" style="padding:2rem;color:#999;">Nenhum usuário cadastrado</td></tr>`;
      return;
    }

    const perfilLabels = {
      PROPRIETARIO: { label: '👑 Proprietário', badge: 'badge-danger' },
      FINANCEIRO:   { label: '💰 Financeiro',   badge: 'badge-info' },
      FUNCIONARIA:  { label: '👩‍💼 Funcionária',  badge: 'badge-primary' },
      PERSONALIZADO:{ label: '⚙️ Personalizado', badge: 'badge-warning' },
    };

    tbody.innerHTML = this.dados.map(u => {
      const perfil = perfilLabels[u.PERFIL] || { label: u.PERFIL, badge: 'badge-primary' };
      const abas = (u.ABAS || '').split(',').filter(Boolean);
      const abasLabels = abas.map(a => {
        const aba = this.ABAS.find(x => x.id === a);
        return aba ? `<span class="badge badge-primary" style="margin:1px;font-size:0.65rem;">${aba.label}</span>` : '';
      }).join('');

      return `<tr>
        <td>${u.ID}</td>
        <td><strong>${u.NOME}</strong></td>
        <td><code style="background:var(--cinza);padding:2px 6px;border-radius:4px;">${u.LOGIN}</code></td>
        <td><span class="badge ${perfil.badge}">${perfil.label}</span></td>
        <td style="max-width:280px;">${abasLabels || '<span style="color:#999;font-size:0.8rem;">Nenhum</span>'}</td>
        <td><span class="badge ${u.ATIVO === 'SIM' ? 'badge-success' : 'badge-danger'}">${u.ATIVO === 'SIM' ? 'Ativo' : 'Inativo'}</span></td>
        <td>
          <button class="btn btn-sm btn-info" onclick="Usuarios.editar(${u.ID})">✏️ Editar</button>
          <button class="btn btn-sm btn-warning" onclick="Usuarios.resetSenha(${u.ID})">🔑 Senha</button>
          ${u.PERFIL !== 'PROPRIETARIO' ? `
            <button class="btn btn-sm btn-danger" onclick="Usuarios.toggleAtivo(${u.ID})">${u.ATIVO === 'SIM' ? '🚫' : '✅'}</button>
          ` : ''}
        </td>
      </tr>`;
    }).join('');
  },

  novo() { this.abrirModal(null); },
  editar(id) {
    const u = this.dados.find(u => u.ID == id);
    if (u) this.abrirModal(u);
  },

  abrirModal(u) {
    const titulo = u ? `✏️ Editar Usuário: ${u.NOME}` : '➕ Novo Usuário';
    const abasUsuario = u ? (u.ABAS || '').split(',').filter(Boolean) : [];

    // Agrupar abas por grupo
    const grupos = {};
    this.ABAS.forEach(aba => {
      if (!grupos[aba.grupo]) grupos[aba.grupo] = [];
      grupos[aba.grupo].push(aba);
    });

    Modal.open(titulo, `
      <div class="form-row">
        <div class="form-group">
          <label>Nome Completo *</label>
          <input type="text" class="form-control" id="mUserNome"
            value="${u?.NOME || ''}" placeholder="Nome do usuário">
        </div>
        <div class="form-group">
          <label>Login (usuário) *</label>
          <input type="text" class="form-control" id="mUserLogin"
            value="${u?.LOGIN || ''}" placeholder="Ex: maria" autocomplete="off"
            ${u?.PERFIL === 'PROPRIETARIO' ? 'disabled' : ''}>
        </div>
      </div>

      ${!u ? `
      <div class="form-row">
        <div class="form-group">
          <label>Senha *</label>
          <input type="password" class="form-control" id="mUserSenha"
            placeholder="Mínimo 6 caracteres" autocomplete="new-password">
        </div>
        <div class="form-group">
          <label>Confirmar Senha *</label>
          <input type="password" class="form-control" id="mUserSenha2"
            placeholder="Repita a senha" autocomplete="new-password">
        </div>
      </div>` : ''}

      <div class="form-row">
        <div class="form-group">
          <label>Perfil de Acesso *</label>
          <select class="form-control" id="mUserPerfil"
            onchange="Usuarios.aplicarPerfil()"
            ${u?.PERFIL === 'PROPRIETARIO' ? 'disabled' : ''}>
            ${Object.entries(this.PERFIS_PADRAO).map(([key, val]) =>
              `<option value="${key}" ${u?.PERFIL === key ? 'selected' : ''}>${val.label}</option>`
            ).join('')}
          </select>
        </div>
        <div class="form-group">
          <label>Status</label>
          <select class="form-control" id="mUserAtivo"
            ${u?.PERFIL === 'PROPRIETARIO' ? 'disabled' : ''}>
            <option value="SIM" ${u?.ATIVO !== 'NAO' ? 'selected' : ''}>Ativo</option>
            <option value="NAO" ${u?.ATIVO === 'NAO' ? 'selected' : ''}>Inativo</option>
          </select>
        </div>
      </div>

      <!-- PERMISSÕES POR ABA -->
      <div style="border:2px solid var(--cinza);border-radius:var(--radius-sm);padding:1rem;margin-top:0.5rem;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:0.8rem;">
          <strong style="color:var(--marrom);">🔐 Permissões de Acesso por Módulo</strong>
          <div class="d-flex gap-1">
            <button type="button" class="btn btn-sm btn-success" onclick="Usuarios.marcarTodos(true)">✅ Todos</button>
            <button type="button" class="btn btn-sm btn-danger" onclick="Usuarios.marcarTodos(false)">🚫 Nenhum</button>
          </div>
        </div>

        ${Object.entries(grupos).map(([grupo, abas]) => `
          <div style="margin-bottom:0.8rem;">
            <div style="font-size:0.75rem;font-weight:700;text-transform:uppercase;color:var(--texto-claro);
                        letter-spacing:0.05em;margin-bottom:0.4rem;padding-bottom:0.3rem;
                        border-bottom:1px solid var(--cinza);">
              ${grupo}
            </div>
            <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:0.4rem;">
              ${abas.map(aba => `
                <label style="display:flex;align-items:center;gap:0.5rem;cursor:pointer;
                              padding:0.4rem 0.6rem;border-radius:6px;
                              border:1px solid var(--cinza);font-size:0.83rem;
                              transition:all 0.2s;"
                       class="perm-label" id="label-${aba.id}">
                  <input type="checkbox" id="perm-${aba.id}"
                    ${abasUsuario.includes(aba.id) ? 'checked' : ''}
                    ${u?.PERFIL === 'PROPRIETARIO' ? 'disabled checked' : ''}
                    onchange="Usuarios.onPermChange('${aba.id}', this.checked)"
                    style="width:16px;height:16px;accent-color:var(--marrom);">
                  <span>${aba.label}</span>
                </label>`).join('')}
            </div>
          </div>`).join('')}
      </div>

      <div id="mUserAviso" class="alert alert-warning mt-1 hidden">
        ⚠️ Ao alterar o perfil, as permissões são redefinidas automaticamente.
      </div>`,

      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-primary" onclick="Usuarios.salvar(${u?.ID || 'null'})">💾 Salvar Usuário</button>`
    );

    // Aplicar estilos iniciais nos checkboxes
    this.ABAS.forEach(aba => {
      this.onPermChange(aba.id, abasUsuario.includes(aba.id));
    });
  },

  onPermChange(abaId, checked) {
    const label = document.getElementById(`label-${abaId}`);
    if (!label) return;
    if (checked) {
      label.style.background = 'rgba(93,58,26,0.08)';
      label.style.borderColor = 'var(--marrom)';
      label.style.color = 'var(--marrom)';
      label.style.fontWeight = '600';
    } else {
      label.style.background = '';
      label.style.borderColor = 'var(--cinza)';
      label.style.color = '';
      label.style.fontWeight = '';
    }
    // Mudar perfil para PERSONALIZADO se alterou manualmente
    const perfilSel = document.getElementById('mUserPerfil');
    if (perfilSel && perfilSel.value !== 'PROPRIETARIO') {
      const aviso = document.getElementById('mUserAviso');
    }
  },

  aplicarPerfil() {
    const perfil = document.getElementById('mUserPerfil')?.value;
    if (!perfil || perfil === 'PERSONALIZADO') return;

    const abasPerfil = this.PERFIS_PADRAO[perfil]?.abas || [];
    this.ABAS.forEach(aba => {
      const cb = document.getElementById(`perm-${aba.id}`);
      if (cb && !cb.disabled) {
        cb.checked = abasPerfil.includes(aba.id);
        this.onPermChange(aba.id, cb.checked);
      }
    });

    const aviso = document.getElementById('mUserAviso');
    if (aviso) aviso.classList.remove('hidden');
    setTimeout(() => aviso?.classList.add('hidden'), 3000);
  },

  marcarTodos(marcar) {
    this.ABAS.forEach(aba => {
      const cb = document.getElementById(`perm-${aba.id}`);
      if (cb && !cb.disabled) {
        cb.checked = marcar;
        this.onPermChange(aba.id, marcar);
      }
    });
    // Mudar para personalizado
    const perfilSel = document.getElementById('mUserPerfil');
    if (perfilSel && perfilSel.value !== 'PROPRIETARIO') {
      perfilSel.value = 'PERSONALIZADO';
    }
  },

  getAbasSelecionadas() {
    return this.ABAS
      .filter(aba => document.getElementById(`perm-${aba.id}`)?.checked)
      .map(aba => aba.id)
      .join(',');
  },

  async salvar(id) {
    const nome   = document.getElementById('mUserNome')?.value.trim();
    const login  = document.getElementById('mUserLogin')?.value.trim();
    const perfil = document.getElementById('mUserPerfil')?.value;
    const ativo  = document.getElementById('mUserAtivo')?.value;
    const abas   = this.getAbasSelecionadas();

    if (!nome)  { Utils.toast('Informe o nome!', 'warning'); return; }
    if (!login) { Utils.toast('Informe o login!', 'warning'); return; }
    if (!abas)  { Utils.toast('Selecione pelo menos um módulo!', 'warning'); return; }

    // Validar senha apenas para novo usuário
    let senha = null;
    if (!id) {
      senha  = document.getElementById('mUserSenha')?.value;
      const senha2 = document.getElementById('mUserSenha2')?.value;
      if (!senha || senha.length < 6) { Utils.toast('Senha deve ter mínimo 6 caracteres!', 'warning'); return; }
      if (senha !== senha2) { Utils.toast('As senhas não coincidem!', 'danger'); return; }
    }

    // Verificar login duplicado
    const loginExiste = this.dados.find(u => u.LOGIN === login && u.ID != id);
    if (loginExiste) { Utils.toast('Este login já está em uso!', 'danger'); return; }

    Utils.loading(true);
    const res = await API.call('saveUsuario', { id, nome, login, senha, perfil, ativo, abas });
    Utils.loading(false);

    if (res.success) {
      Modal.close();
      Utils.toast(res.message || '✅ Usuário salvo com sucesso!', 'success');

      // Atualizar localmente para demo
      if (id) {
        const idx = this.dados.findIndex(u => u.ID == id);
        if (idx >= 0) {
          this.dados[idx] = { ...this.dados[idx], NOME: nome, LOGIN: login, PERFIL: perfil, ATIVO: ativo, ABAS: abas };
        }
      } else {
        const newId = Math.max(...this.dados.map(u => u.ID), 0) + 1;
        this.dados.push({ ID: newId, NOME: nome, LOGIN: login, PERFIL: perfil, ATIVO: ativo, ABAS: abas });
      }

      // Atualizar menu se for o usuário logado
      const userAtual = Session.get();
      if (userAtual?.id == id) {
        Utils.toast('⚠️ Suas permissões foram alteradas. Faça login novamente.', 'warning');
      }

      this.renderTabela();
    } else {
      Utils.toast(res.message || 'Erro ao salvar!', 'danger');
    }
  },

  resetSenha(id) {
    const u = this.dados.find(u => u.ID == id);
    if (!u) return;

    Modal.open(`🔑 Redefinir Senha: ${u.NOME}`, `
      <div class="alert alert-warning">
        ⚠️ Você está redefinindo a senha de <strong>${u.NOME}</strong> (login: <code>${u.LOGIN}</code>)
      </div>
      <div class="form-group">
        <label>Nova Senha *</label>
        <input type="password" class="form-control" id="mResetSenha"
          placeholder="Mínimo 6 caracteres" autocomplete="new-password">
      </div>
      <div class="form-group">
        <label>Confirmar Nova Senha *</label>
        <input type="password" class="form-control" id="mResetSenha2"
          placeholder="Repita a nova senha" autocomplete="new-password">
      </div>`,
      `<button class="btn btn-outline" onclick="Modal.close()">Cancelar</button>
       <button class="btn btn-danger" onclick="Usuarios.confirmarResetSenha(${id})">🔑 Redefinir Senha</button>`
    );
  },

  async confirmarResetSenha(id) {
    const senha  = document.getElementById('mResetSenha')?.value;
    const senha2 = document.getElementById('mResetSenha2')?.value;

    if (!senha || senha.length < 6) { Utils.toast('Senha deve ter mínimo 6 caracteres!', 'warning'); return; }
    if (senha !== senha2) { Utils.toast('As senhas não coincidem!', 'danger'); return; }

    Utils.loading(true);
    const res = await API.call('resetSenha', { id, senha });
    Utils.loading(false);

    if (res.success) {
      Modal.close();
      Utils.toast('✅ Senha redefinida com sucesso!', 'success');
    } else {
      Utils.toast(res.message || 'Erro ao redefinir senha!', 'danger');
    }
  },

  async toggleAtivo(id) {
    const u = this.dados.find(u => u.ID == id);
    if (!u) return;
    const novoStatus = u.ATIVO === 'SIM' ? 'NAO' : 'SIM';
    const acao = novoStatus === 'SIM' ? 'ativar' : 'desativar';
    if (!Utils.confirm(`Deseja ${acao} o usuário "${u.NOME}"?`)) return;

    Utils.loading(true);
    const res = await API.call('saveUsuario', { ...u, id: u.ID, ativo: novoStatus });
    Utils.loading(false);

    if (res.success) {
      const idx = this.dados.findIndex(x => x.ID == id);
      if (idx >= 0) this.dados[idx].ATIVO = novoStatus;
      Utils.toast(res.message || '✅ Status atualizado!', 'success');
      this.renderTabela();
    } else {
      Utils.toast(res.message || 'Erro!', 'danger');
    }
  }
};