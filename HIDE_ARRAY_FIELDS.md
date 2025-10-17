# Hide Array Fields - Esconder Campos de Relacionamento 1:N

## 📋 Descrição

Implementação de uma prop `hideArrayFields` no `EntityCRUD` que permite esconder completamente todos os painéis de relacionamentos 1:N (campos array), deixando apenas os campos da entidade principal visíveis.

## ✨ Funcionalidade

### Antes

- Formulário exibia todos os campos, incluindo seções de array (relacionamentos 1:N)
- Exemplo: formulário de Organização mostrava eventos relacionados

### Depois

- Possibilidade de esconder todas as seções de array
- Apenas campos da entidade principal são exibidos
- Útil para páginas de perfil e configurações simples

## 🎯 Uso

### EntityCRUD

```tsx
<EntityCRUD
  entityName="organization"
  entityId={organizationId}
  hideArrayFields={true} // ← Nova prop
  hideTable={true}
  showEditButton={true}
/>
```

### Comportamento

- **`hideArrayFields={true}`**: Esconde todos os campos array (relacionamentos 1:N)
- **`hideArrayFields={false}`** ou **não informado**: Mostra todos os campos (padrão)

## 📦 Implementação

### 1. EntityCRUD.tsx

**Interface:**

```tsx
interface EntityCRUDProps {
  // ...props existentes...
  /** Esconde campos de array (relacionamentos 1:N) */
  hideArrayFields?: boolean;
}
```

**Destructuring:**

```tsx
const EntityCRUD: React.FC<EntityCRUDProps> = ({
  // ...outras props...
  hideArrayFields = false,  // ← Valor padrão: false
}) => {
```

**Passagem para EntityForm:**

```tsx
<EntityForm
  metadata={formMetadata}
  entityId={selectedEntityId}
  // ...outras props...
  hideArrayFields={hideArrayFields} // ← Repassa a prop
/>
```

### 2. EntityForm.tsx

**Interface:**

```tsx
interface EntityFormProps {
  // ...props existentes...
  /** Esconde campos de array (relacionamentos 1:N) */
  hideArrayFields?: boolean;
}
```

**Destructuring:**

```tsx
const EntityForm: React.FC<EntityFormProps> = ({
  // ...outras props...
  hideArrayFields = false,
}) => {
```

**Lógica de Filtragem:**

```tsx
// Separa campos por tipo para organização
const regularFields = section.fields.filter(
  (f) => f.type !== "array" && f.type !== "textarea"
);
const textareaFields = section.fields.filter((f) => f.type === "textarea");

// 🔥 Se hideArrayFields é true, array fica vazio
const arrayFields = hideArrayFields
  ? []
  : section.fields.filter((f) => f.type === "array");
```

## 🎨 Casos de Uso

### 1. Página de Organização (OrganizationPage)

```tsx
const OrganizationPage: React.FC = () => {
  const { organizationId } = useOrganization();

  if (!organizationId) {
    return (
      <EntityCRUD
        entityName="organization"
        initialMode="create"
        hideTable={true}
        hideArrayFields={true} // ← Esconde eventos relacionados
        pageTitle="Criar Organização"
      />
    );
  }

  return (
    <EntityCRUD
      entityName="organization"
      entityId={organizationId}
      initialMode="view"
      hideTable={true}
      showEditButton={true}
      hideArrayFields={true} // ← Esconde eventos relacionados
      pageTitle="Minha Organização"
    />
  );
};
```

**Benefícios:**

- ✅ Formulário mais limpo e focado
- ✅ Usuário edita apenas dados da organização
- ✅ Eventos são gerenciados em tela separada

### 2. Página de Dados Pessoais (PersonalDataPage)

```tsx
const PersonalDataPage: React.FC = () => {
  const userId = getUserId();

  return (
    <EntityCRUD
      entityName="user"
      entityId={userId}
      initialMode="view"
      hideTable={true}
      showEditButton={true}
      hideArrayFields={true} // ← Esconde inscrições, etc
      pageTitle="Meus Dados Pessoais"
    />
  );
};
```

**Benefícios:**

- ✅ Apenas dados pessoais básicos
- ✅ Inscrições são visualizadas em tela separada

## 🔄 Comparação

### Com `hideArrayFields={false}` (padrão)

```
┌─────────────────────────────────────┐
│ Organização                         │
├─────────────────────────────────────┤
│ Nome: Minha Empresa                 │
│ CNPJ: 12.345.678/0001-90           │
│ Email: contato@empresa.com          │
├─────────────────────────────────────┤
│ Eventos                             │
├─────────────────────────────────────┤
│ ┌─────────────────────────────────┐ │
│ │ + Adicionar Evento              │ │
│ │                                 │ │
│ │ [Lista de eventos...]           │ │
│ └─────────────────────────────────┘ │
└─────────────────────────────────────┘
```

### Com `hideArrayFields={true}`

```
┌─────────────────────────────────────┐
│ Organização                         │
├─────────────────────────────────────┤
│ Nome: Minha Empresa                 │
│ CNPJ: 12.345.678/0001-90           │
│ Email: contato@empresa.com          │
└─────────────────────────────────────┘
```

## ✅ Checklist de Implementação

- [x] Interface `EntityCRUDProps` com nova prop
- [x] Destructuring no componente `EntityCRUD`
- [x] Passagem da prop para `EntityForm`
- [x] Interface `EntityFormProps` com nova prop
- [x] Destructuring no componente `EntityForm`
- [x] Lógica de filtragem dos `arrayFields`
- [x] Aplicação em `OrganizationPage`
- [x] Build sem erros
- [x] Documentação criada

## 🎯 Próximos Passos (Opcional)

1. **Filtro Seletivo**: Permitir esconder campos array específicos

   ```tsx
   hideArrayFields={["events", "registrations"]}
   ```

2. **Modo Condicional**: Esconder apenas no modo view

   ```tsx
   hideArrayFieldsInViewMode={true}
   ```

3. **Callback de Navegação**: Botão para ir à tela de gerenciamento
   ```tsx
   onManageRelated={(fieldName) => navigate(`/organization/events`)}
   ```

## 📝 Notas

- A prop é **opcional** e tem valor padrão `false`
- Não afeta a submissão do formulário
- Campos array continuam funcionando normalmente quando visíveis
- Compatível com todos os modos: `view`, `edit`, `create`

## 🔗 Arquivos Modificados

1. `/src/components/Generic/EntityCRUD.tsx`
2. `/src/components/Generic/EntityForm.tsx`
3. `/src/components/Organization/OrganizationPage.tsx`

---

**Data de Implementação**: 15 de Outubro de 2025  
**Versão**: 1.0.0
