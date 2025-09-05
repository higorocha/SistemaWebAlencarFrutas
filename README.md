# Base Web App - AlencarFrutas (Template Reutilizável)

Este projeto é uma **base moderna e reutilizável** para sistemas web, construída com React, NestJS e PostgreSQL. Ele serve como ponto de partida para qualquer sistema administrativo, permitindo que você foque apenas na lógica negocial do seu domínio.

> **Atenção:** Ainda **NÃO** implementa regras de negócio específicas do "AlencarFrutas". Tudo aqui é base, pronta para ser plugada em qualquer projeto futuro.

---

## 🚀 O que já está pronto?

- **Autenticação JWT** (login, expiração, proteção de rotas, contexto global)
- **Página de Login** moderna, responsiva, com UX otimizada e carregamento suave
- **Sistema de Notificações** completo (API REST, WebSocket, tempo real, tipos variados)
- **Estrutura de páginas e rotas** (React Router)
- **Exemplo de layout de tabela** (ver `src/pages/Hidrometros.js`)
- **Tema global customizável** (`src/theme.js`), com paleta de cores para tabelas
- **Componentização e organização de código**
- **Pronto para integração de lógica negocial**

---

## 🧩 Como usar esta base em outros projetos?

1. **Clone este repositório**
2. **Implemente sua lógica de negócio** (CRUD, regras, integrações)
3. **Aproveite os exemplos de layout e tema**
4. **Personalize o tema e as páginas conforme sua identidade visual**

---

## 📦 Estrutura do Projeto

```
SistemaWebAlencarFrutas/
├── frontend/          # Aplicação React (base)
│   ├── src/
│   │   ├── pages/
│   │   │   └── Hidrometros.js   # Exemplo de layout de tabela
│   │   ├── components/
│   │   │   └── hidrometros/     # Componentes de tabela (referência)
│   │   ├── theme.js             # Tema global e paleta de cores
│   │   └── ...
│   └── public/
├── backend/           # API NestJS (base)
│   └── ...
└── README.md
```

---

## 🛠️ Tecnologias Utilizadas

- **Frontend:** React 18, Ant Design, Material-UI, Styled Components, Axios, Socket.io
- **Backend:** NestJS, Prisma ORM, PostgreSQL, JWT

---

## 🎨 Tema Global e Paleta de Tabelas

O arquivo [`src/theme.js`](frontend/src/theme.js) define **toda a paleta de cores** do sistema, incluindo uma seção exclusiva para tabelas:

```js
palette: {
  ...
  table: {
    headerBg: "#059669",      // Verde principal
    headerText: "#fff",
    rowEven: "#fafafa",
    rowOdd: "#fff",
    rowHover: "#e6f7ff",
    rowSelected: "#d1fae5",
    border: "#e0e0e0",
    focus: "#10b981",
    focusBg: "#f0f7ff",
    newRowBg: "#f6ffed",
    newRowBorder: "#52c41a",
    error: "#ff4d4f",
    errorBg: "#fff2f0",
  }
}
```

> **Como usar:** Ao criar novas tabelas, utilize as cores de `theme.palette.table` para manter o padrão visual e garantir consistência em todos os projetos derivados.

---

## 📄 Exemplo de Layout de Tabela

O arquivo [`src/pages/Hidrometros.js`](frontend/src/pages/Hidrometros.js) e os componentes em [`src/components/hidrometros/`](frontend/src/components/hidrometros/) servem **apenas como referência de layout** para páginas de dados e tabelas. Eles mostram como aplicar o tema, alternar cores de linhas, foco, hover, etc.

> **Importante:** Não existe lógica negocial real em Hidrometros.js. Use como inspiração para suas próprias páginas de domínio.

---

## 🔐 Login e Autenticação

- **Página de login** moderna, com UX otimizada, carregamento suave e feedback visual
- **Autenticação JWT** pronta para uso, com contexto global e proteção de rotas
- **Expiração de token** automática e tratamento de sessão

---

## 🧑‍💻 Como começar um novo projeto?

1. **Clone este repositório**
2. **Implemente suas entidades, regras e páginas**
3. **Aproveite o tema, login, tabelas e estrutura já prontos**
4. **Personalize o visual no `theme.js`**
5. **Plugue sua lógica negocial**

---

## 📚 Notas Finais

- Este projeto é uma base sólida para sistemas administrativos modernos
- Foco em **reutilização, escalabilidade e produtividade**
- Basta plugar sua lógica e criar sistemas robustos rapidamente
- **Hidrometros.js** é só exemplo de layout, não lógica real

---

## 📝 Licença

MIT (Livre para uso e modificação) 