# MVT-FE - Mountain Valley Trails Frontend

Sistema de gestão de eventos esportivos de corrida de montanha.

## 🚀 Tecnologias

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **React Router** - Navegação
- **Stripe** - Pagamentos

## 📚 Documentação

Toda a documentação do projeto está organizada na pasta **[`/docs`](docs/README.md)**:

- **[Guia Rápido](docs/guides/QUICK_START_GUIDE.md)** - Como começar
- **[Arquitetura](docs/guides/ARCHITECTURE.md)** - Visão geral do projeto
- **[Frontend](docs/frontend/)** - Componentes e guias frontend
- **[Backend](docs/backend/)** - Especificações e exemplos backend
- **[⚠️ Correções Necessárias](docs/backend/BACKEND_FIXES_NEEDED.md)** - Lista de issues críticas

## 🏃 Início Rápido

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

## 🎯 Componentes Genéricos

O projeto utiliza componentes metadata-driven que geram UI automaticamente:

```tsx
// Cria um CRUD completo em 1 linha
<EntityCRUD entityName="event" />
```

Veja os guias:

- **[EntityCRUD](docs/frontend/ENTITY_CRUD_GUIDE.md)** - CRUD completo
- **[EntityForm](docs/frontend/ENTITY_FORM_GUIDE.md)** - Formulários dinâmicos
- **[EntityFilters](docs/frontend/ENTITY_FILTERS_GUIDE.md)** - Filtros automáticos
- **[ArrayField](docs/frontend/ARRAY_FIELD_GUIDE.md)** - Relacionamentos 1:N

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── Common/         # Componentes reutilizáveis
│   ├── Generic/        # Componentes metadata-driven
│   ├── Events/         # Páginas de eventos
│   ├── Auth/           # Autenticação
│   └── ...
├── contexts/           # React Context (Metadata)
├── hooks/              # Custom hooks
├── services/           # API e serviços
├── types/              # TypeScript types
└── utils/              # Utilitários
```

## 🔗 Links Úteis

- **Documentação completa**: [`/docs`](docs/README.md)
- **Repositório**: [fabio1974/mvt-fe](https://github.com/fabio1974/mvt-fe)

---

## React + Vite - Template Original

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      ...tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      ...tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      ...tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from "eslint-plugin-react-x";
import reactDom from "eslint-plugin-react-dom";

export default tseslint.config([
  globalIgnores(["dist"]),
  {
    files: ["**/*.{ts,tsx}"],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs["recommended-typescript"],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.node.json", "./tsconfig.app.json"],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
]);
```
