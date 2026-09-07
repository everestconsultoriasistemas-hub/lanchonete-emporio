# 🍔 Sistema de Gestão - Lanchonete Empório

## ✅ O que está incluído

### Módulos do Sistema
| Módulo | Descrição |
|--------|-----------|
| 🔐 Login | 3 níveis de acesso: Proprietário, Financeiro, Funcionária |
| 🏠 Dashboard | Visão geral: vendas, caixa, estoque crítico, contas |
| 🕐 Caixa | Abertura/Fechamento com horário automático |
| 🛒 Vendas | Registro por produto com carrinho e formas de pagamento |
| 🍔 Cardápio | Cadastro de produtos, preços e margem de lucro |
| 📦 Estoque | Controle com alertas de estoque mínimo |
| 👥 Funcionários | Cadastro com tipo de salário (mensal/quinzenal/hora) |
| 🍽️ Consumo | Registro de consumo de funcionárias (desconto automático) |
| 💰 Folha | Fechamento mensal com cálculo automático de horas e descontos |
| 🚚 Fornecedores | Cadastro completo |
| 🛍️ Compras | Registro com geração automática de contas a pagar |
| 💳 Contas a Pagar | Controle com alertas de vencimento |
| 🏠 Despesas Fixas | Aluguel, energia, água, etc. |
| 💵 Fluxo de Caixa | Entradas e saídas automáticas |
| 📈 Relatórios | Vendas por período, funcionária, produto e caixa/horas |

---

## 🚀 COMO CONFIGURAR (Passo a Passo)

### ETAPA 1 — Google Sheets (Banco de Dados)

1. Acesse [sheets.google.com](https://sheets.google.com)
2. Crie uma nova planilha chamada **"BD - Lanchonete Empório"**
3. Crie as abas conforme o arquivo `SETUP_GOOGLE_SHEETS.md`
4. Preencha a aba **USUARIOS** com os logins iniciais:

| ID | NOME | LOGIN | SENHA | PERFIL |
|----|------|-------|-------|--------|
| 1 | Proprietário | admin | admin123 | PROPRIETARIO |
| 2 | Financeiro | financeiro | fin123 | FINANCEIRO |
| 3 | Ana Silva | ana | 123456 | FUNCIONARIA |

### ETAPA 2 — Google Apps Script (API)

1. Na planilha, clique em **Extensões > Apps Script**
2. Apague o código existente
3. Cole todo o conteúdo do arquivo `APPS_SCRIPT.js`
4. Salve (Ctrl+S)
5. Clique em **Implantar > Nova implantação**
6. Configure:
   - Tipo: **Aplicativo da Web**
   - Executar como: **Eu (seu email)**
   - Quem tem acesso: **Qualquer pessoa**
7. Clique em **Implantar** e autorize
8. **COPIE A URL** gerada (começa com `https://script.google.com/macros/s/...`)

### ETAPA 3 — Configurar o Sistema

1. Abra o arquivo `js/config.js`
2. Encontre a linha:
   ```javascript
   APPS_SCRIPT_URL: 'COLE_SUA_URL_AQUI',
   ```
3. Substitua `COLE_SUA_URL_AQUI` pela URL copiada no passo anterior

### ETAPA 4 — GitHub Pages

1. Crie um repositório no GitHub (ex: `lanchonete-emporio`)
2. Faça upload de todos os arquivos desta pasta
3. Vá em **Settings > Pages**
4. Em **Source**, selecione **main branch**
5. Clique em **Save**
6. Aguarde alguns minutos
7. Acesse: `https://SEU_USUARIO.github.io/lanchonete-emporio`

---

## 👥 Logins de Demonstração

> ⚠️ Antes de conectar o Google Sheets, o sistema funciona em modo demonstração com dados fictícios.

| Usuário | Senha | Acesso |
|---------|-------|--------|
| `admin` | `admin123` | 👑 Proprietário (tudo) |
| `financeiro` | `fin123` | 💰 Financeiro (sem pessoal) |
| `ana` | `123456` | 👩‍💼 Funcionária (caixa e vendas) |

---

## 📱 Compatibilidade

- ✅ Computador (Chrome, Firefox, Edge, Safari)
- ✅ Celular Android e iPhone
- ✅ Tablet
- ✅ Funciona offline após carregado (modo demo)

---

## 🔒 Níveis de Acesso

### 👑 Proprietário
Acesso completo a todos os módulos

### 💰 Financeiro
- Dashboard, Caixa, Vendas
- Cardápio, Estoque
- Compras, Contas a Pagar, Despesas Fixas
- Fluxo de Caixa, Relatórios
- ❌ Sem acesso: Funcionários, Consumo, Folha

### 👩‍💼 Funcionária
- Abertura/Fechamento de Caixa
- Registro de Vendas

---

## ⚙️ Funcionalidades Automáticas

| Funcionalidade | Como funciona |
|----------------|---------------|
| **Horário de caixa** | Registrado automaticamente ao abrir/fechar |
| **Horas trabalhadas** | Calculadas pela diferença abertura/fechamento |
| **Estoque** | Decrementado automaticamente a cada venda |
| **Contas a pagar** | Criadas automaticamente ao registrar compra a prazo |
| **Fluxo de caixa** | Atualizado automaticamente em vendas e pagamentos |
| **Desconto consumo** | Calculado automaticamente na folha de pagamento |
| **Salário por hora** | Calculado pelas horas de caixa do mês |

---

## 📞 Estrutura de Arquivos

```
sistema-emporio/
├── index.html              ← Arquivo principal
├── APPS_SCRIPT.js          ← Cole no Google Apps Script
├── SETUP_GOOGLE_SHEETS.md  ← Instruções do banco de dados
├── README.md               ← Este arquivo
├── css/
│   └── style.css           ← Estilos (Marrom + Amarelo)
├── js/
│   ├── config.js           ← Configurações e API
│   ├── app.js              ← Login, navegação, sidebar
│   └── dashboard.js        ← Dashboard principal
└── modules/
    ├── caixa.js            ← Abertura/Fechamento de caixa
    ├── vendas.js           ← Registro de vendas
    ├── cardapio.js         ← Produtos e preços
    ├── estoque.js          ← Controle de estoque
    ├── funcionarios.js     ← Cadastro de funcionários
    ├── consumo.js          ← Consumo de funcionários
    ├── folha.js            ← Folha de pagamento
    ├── fornecedores.js     ← Cadastro de fornecedores
    ├── compras.js          ← Registro de compras
    ├── contas.js           ← Contas a pagar
    ├── despesas.js         ← Despesas fixas
    ├── fluxo.js            ← Fluxo de caixa
    └── relatorios.js       ← Relatórios e análises
```