# Zapi10 - Sistema de Gestão de Entregas

Sistema completo para gerenciamento de entregas com cálculo automático de preços, gestão de grupos de motoboys e contratos inteligentes.

## 📖 Documentação para Apresentação

**Acesso rápido à documentação completa:**

### 📊 Documentos Principais

1. **[📄 APRESENTACAO.md](APRESENTACAO.md)** - Documentação técnica completa
   - Visão geral do sistema
   - Cálculo de preços detalhado
   - Projeções financeiras (R$ 15k a R$ 46k/mês com 50 motoboys)
   - Gestão de grupos e contratos
   - Zonas especiais

2. **[🎬 SLIDES_APRESENTACAO.md](SLIDES_APRESENTACAO.md)** - 32 slides prontos
   - Apresentação estruturada
   - Exemplos práticos
   - Projeções financeiras visuais
   - Comparativos

3. **[📋 CHEAT_SHEET_APRESENTACAO.md](CHEAT_SHEET_APRESENTACAO.md)** - Cola do apresentador
   - Números-chave memorizados
   - Frases prontas
   - Pontos obrigatórios

4. **[🎯 ROTEIRO_DEMO.md](ROTEIRO_DEMO.md)** - Roteiro de demonstração
   - Script de 5 minutos
   - Passo a passo da demo
   - O que dizer em cada etapa

5. **[❓ FAQ_APRESENTACAO.md](FAQ_APRESENTACAO.md)** - 42 Perguntas & Respostas
   - Respostas preparadas
   - Objeções e contra-argumentos
   - Projeções financeiras

### 💰 Projeções Financeiras - Grupo com 50 Motoboys

| Cenário | Entregas/Dia | Receita/Mês |
|---------|--------------|-------------|
| 😟 Pessimista | 12 | **R$ 5.070** |
| 😊 Normal | 20 | **R$ 9.750** |
| 🚀 Otimista | 28 | **R$ 15.470** |

*Comissão: Motoboy 95% / Grupo 5%*

---

## 🚀 Tecnologias

- **React 19** + **TypeScript**
- **Vite** - Build tool
- **TailwindCSS** - Estilização
- **React Router** - Navegação
- **Google Maps API** - Geolocalização

## 📚 Documentação Técnica

Documentação técnica do desenvolvimento está em **[`/docs`](docs/README.md)**:

- **[Guia Rápido](docs/guides/QUICK_START_GUIDE.md)**
- **[Arquitetura](docs/guides/ARCHITECTURE.md)**
- **[Frontend](docs/frontend/)**
- **[Backend](docs/backend/)**

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
