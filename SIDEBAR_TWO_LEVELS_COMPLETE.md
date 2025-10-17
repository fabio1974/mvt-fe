# Sidebar com Dois Níveis - Implementação Completa ✅

## Resumo

A Sidebar foi completamente refatorada para ter uma estrutura hierárquica de dois níveis com grupos expansíveis e ordenação alfabética automática.

---

## 🎯 Recursos Implementados

### 1. **Estrutura Hierárquica**

- **Grupos expansíveis**: Containers que agrupam itens relacionados
- **Items de primeiro nível**: Itens independentes sem agrupamento
- **Sub-items**: Itens dentro de grupos (segundo nível)

### 2. **Grupo "Meus Dados"**

Grupo especial que contém itens relacionados ao usuário:

- ✅ Dados Pessoais
- ✅ Meus Eventos (ORGANIZER/ADMIN)
- ✅ Minhas Inscrições
- ✅ Organização (ORGANIZER/ADMIN)

**Ordenação**: Sub-items ordenados alfabeticamente automaticamente

### 3. **Items de Primeiro Nível**

Items independentes (não agrupados):

- ✅ Gerenciar Eventos (ORGANIZER/ADMIN)
- ✅ Gerenciar Inscrições (ORGANIZER/ADMIN)
- ✅ Gerenciar Organização (ORGANIZER/ADMIN)
- ✅ Inscrições (ORGANIZER/ADMIN)

**Ordenação**: Alfabética automática, com "Meus Dados" sempre no topo

### 4. **Funcionalidades de UX**

- ✅ Chevron (▼/▶) indica estado expandido/recolhido
- ✅ "Meus Dados" expandido por padrão
- ✅ Animação suave de expansão (`slideDown`)
- ✅ Item ativo destacado com cor e borda
- ✅ Hover com efeitos visuais
- ✅ Permissões por role (USER/ORGANIZER/ADMIN)

---

## 📋 Estrutura de Código

### Interfaces TypeScript

```typescript
interface MenuItem {
  label: string;
  icon: React.ReactNode;
  path: string;
  roles?: string[];
}

interface MenuGroup {
  label: string;
  icon: React.ReactNode;
  items: MenuItem[];
  roles?: string[];
}
```

### Menu Structure

```typescript
const menuStructure: (MenuItem | MenuGroup)[] = [
  // Grupo: Meus Dados
  {
    label: "Meus Dados",
    icon: <FiUser size={22} color="#0099ff" />,
    items: [
      { label: "Dados Pessoais", icon: <FiUser />, path: "/dados-pessoais" },
      {
        label: "Meus Eventos",
        icon: <FiCalendar />,
        path: "/meus-eventos",
        roles: ["ROLE_ORGANIZER", "ROLE_ADMIN"],
      },
      {
        label: "Minhas Inscrições",
        icon: <FiBookmark />,
        path: "/minhas-inscricoes",
      },
      {
        label: "Organização",
        icon: <FiSettings />,
        path: "/organizacao",
        roles: ["ROLE_ORGANIZER", "ROLE_ADMIN"],
      },
    ].sort((a, b) => a.label.localeCompare(b.label, "pt-BR")),
  },
  // Items de primeiro nível
  {
    label: "Gerenciar Eventos",
    icon: <FiPlus />,
    path: "/eventos",
    roles: ["ROLE_ORGANIZER", "ROLE_ADMIN"],
  },
  {
    label: "Gerenciar Inscrições",
    icon: <FiClipboard />,
    path: "/inscricoes",
    roles: ["ROLE_ORGANIZER", "ROLE_ADMIN"],
  },
  {
    label: "Gerenciar Organização",
    icon: <FiBriefcase />,
    path: "/organizacao/gerenciar",
    roles: ["ROLE_ORGANIZER", "ROLE_ADMIN"],
  },
  {
    label: "Inscrições",
    icon: <FiUsers />,
    path: "/organizacao/inscricoes",
    roles: ["ROLE_ORGANIZER", "ROLE_ADMIN"],
  },
].sort((a, b) => {
  if ("items" in a && a.label === "Meus Dados") return -1;
  if ("items" in b && b.label === "Meus Dados") return 1;
  return a.label.localeCompare(b.label, "pt-BR");
});
```

### Estado do Componente

```typescript
// "Meus Dados" expandido por padrão
const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
  new Set(["Meus Dados"])
);
```

### Funções Principais

#### 1. **toggleGroup**

```typescript
const toggleGroup = (groupLabel: string) => {
  if (collapsed) {
    setCollapsed(false); // Expande sidebar se estiver colapsada
  }

  setExpandedGroups((prev) => {
    const newSet = new Set(prev);
    newSet.has(groupLabel) ? newSet.delete(groupLabel) : newSet.add(groupLabel);
    return newSet;
  });
};
```

#### 2. **isActive**

```typescript
const isActive = (path: string): boolean => {
  return location.pathname === path;
};
```

#### 3. **hasPermission**

```typescript
const hasPermission = (item: MenuItem | MenuGroup): boolean => {
  if (!item.roles || item.roles.length === 0) return true;
  return item.roles.includes(userRole || "");
};
```

#### 4. **groupHasVisibleItems**

```typescript
const groupHasVisibleItems = (group: MenuGroup): boolean => {
  return group.items.some((item) => hasPermission(item));
};
```

---

## 🎨 Estilos CSS

### Classes Principais

| Classe                   | Descrição                   |
| ------------------------ | --------------------------- |
| `.sidebar-menu-group`    | Container do grupo          |
| `.sidebar-group-header`  | Cabeçalho clicável do grupo |
| `.sidebar-group-chevron` | Ícone de expansão (▼/▶)     |
| `.sidebar-sub-items`     | Container dos sub-items     |
| `.sidebar-sub-item`      | Item dentro de um grupo     |
| `.active`                | Item/sub-item ativo         |

### Animação de Expansão

```css
@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.sidebar-sub-items {
  animation: slideDown 0.3s ease;
}
```

### Estados Visuais

#### Grupo Header

```css
.sidebar-group-header {
  font-weight: 600;
  background: linear-gradient(
    135deg,
    rgba(0, 153, 255, 0.12),
    rgba(0, 109, 199, 0.08)
  );
  border-color: rgba(0, 153, 255, 0.3);
}

.sidebar-group-header:hover {
  background: linear-gradient(
    135deg,
    rgba(0, 153, 255, 0.18),
    rgba(0, 109, 199, 0.12)
  );
}
```

#### Sub-Item

```css
.sidebar-sub-item {
  font-size: 0.88rem;
  padding: 11px 16px;
  background: rgba(255, 255, 255, 0.35);
  border-left: 3px solid transparent;
  margin-left: 12px;
}

.sidebar-sub-item:hover {
  background: rgba(0, 153, 255, 0.06);
  border-left-color: #0099ff;
  transform: translateX(6px);
}

.sidebar-sub-item.active {
  background: rgba(0, 153, 255, 0.12);
  border-left-color: #0099ff;
  color: #0369a1;
  font-weight: 600;
}
```

---

## 🔄 Fluxo de Renderização

### 1. **Menu Structure Loop**

```typescript
{
  menuStructure.map((item) => {
    if ("items" in item) {
      return renderMenuGroup(item); // Renderiza grupo
    } else {
      return renderMenuItem(item); // Renderiza item simples
    }
  });
}
```

### 2. **Render Menu Group**

```typescript
const renderMenuGroup = (group: MenuGroup) => {
  if (!hasPermission(group) || !groupHasVisibleItems(group)) return null;

  const isExpanded = expandedGroups.has(group.label);

  return (
    <div className="sidebar-menu-group">
      {/* Header do grupo */}
      <button onClick={() => toggleGroup(group.label)}>
        {group.icon}
        <span>{group.label}</span>
        {isExpanded ? <FiChevronDown /> : <FiChevronRight />}
      </button>

      {/* Sub-items (renderiza só se expandido) */}
      {isExpanded && !collapsed && (
        <div className="sidebar-sub-items">
          {group.items.map((item) => renderMenuItem(item, true))}
        </div>
      )}
    </div>
  );
};
```

### 3. **Render Menu Item**

```typescript
const renderMenuItem = (item: MenuItem, isSubItem = false) => {
  if (!hasPermission(item)) return null;

  return (
    <button
      onClick={() => navigate(item.path)}
      className={`sidebar-menu-item${isSubItem ? " sidebar-sub-item" : ""}${
        isActive(item.path) ? " active" : ""
      }`}
    >
      {item.icon}
      {!collapsed && <span>{item.label}</span>}
    </button>
  );
};
```

---

## 📱 Responsividade

### Desktop

- Sidebar expansível/colapsável
- Grupos funcionam normalmente
- Chevrons visíveis

### Mobile

- Sidebar ocupa largura fixa (280px)
- Overlay escuro ao abrir
- Fecha ao clicar fora
- Grupos sempre expandem ao clicar

---

## ✅ Checklist de Validação

- [x] Estrutura de dois níveis (grupos + items)
- [x] Grupo "Meus Dados" com 4 sub-items
- [x] 4 items de primeiro nível
- [x] Ordenação alfabética automática
- [x] "Meus Dados" sempre no topo
- [x] Chevron (▼/▶) funcional
- [x] "Meus Dados" expandido por padrão
- [x] Animação suave de expansão
- [x] Item ativo destacado visualmente
- [x] Permissões por role
- [x] Responsive (desktop + mobile)
- [x] Sem erros TypeScript
- [x] CSS completo e consistente

---

## 🎯 Conclusão

A Sidebar está **100% funcional** com:

- ✅ Hierarquia de dois níveis
- ✅ Expansão/recolhimento de grupos
- ✅ Ordenação alfabética automática
- ✅ Animações suaves
- ✅ Estados visuais bem definidos
- ✅ Sistema de permissões integrado
- ✅ Totalmente responsiva

**Nenhuma ação adicional necessária!** 🎉
