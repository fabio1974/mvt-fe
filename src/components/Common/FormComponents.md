# Componentes de Formulário Reutilizáveis

Este sistema de componentes foi criado baseado no padrão bem-sucedido do EventFilters, proporcionando uma experiência consistente em todos os formulários da aplicação.

## Componentes Disponíveis

### FormContainer

Container principal para formulários com título e ícone opcional.

```tsx
<FormContainer title="Título do Formulário" icon={<FiSettings />}>
  {/* Conteúdo do formulário */}
</FormContainer>
```

### FormRow

Sistema de grid responsivo para organizar campos em linhas.

```tsx
<FormRow columns={3}>
  {" "}
  {/* 1, 2, 3 ou 4 colunas */}
  <FormField>...</FormField>
  <FormField>...</FormField>
  <FormField>...</FormField>
</FormRow>
```

### FormField

Wrapper para campos com label, validação e erro.

```tsx
<FormField label="Nome do Campo" required error={errors.fieldName?.message}>
  <FormInput />
</FormField>
```

### FormInput

Input com suporte a ícones e estilos consistentes.

```tsx
<FormInput
  type="text"
  placeholder="Digite aqui..."
  value={value}
  onChange={(e) => setValue(e.target.value)}
  icon={<FiUser />} // Opcional
/>
```

### FormSelect

Select com opções e placeholder.

```tsx
<FormSelect
  options={[
    { value: "1", label: "Opção 1" },
    { value: "2", label: "Opção 2" },
  ]}
  placeholder="Selecione uma opção"
  value={selectedValue}
  onChange={(e) => setSelectedValue(e.target.value)}
/>
```

### FormTextarea

Textarea com redimensionamento vertical.

```tsx
<FormTextarea
  placeholder="Digite uma descrição..."
  rows={4}
  value={description}
  onChange={(e) => setDescription(e.target.value)}
/>
```

### FormActions

Container para botões de ação do formulário.

```tsx
<FormActions align="right">
  {" "}
  {/* left, center, right */}
  <FormButton variant="secondary">Cancelar</FormButton>
  <FormButton variant="primary">Salvar</FormButton>
</FormActions>
```

### FormButton

Botões com variantes e ícones.

```tsx
<FormButton
  variant="primary" // primary, secondary, danger, success
  icon={<FiSave />}
  disabled={loading}
>
  Salvar
</FormButton>
```

## Exemplo Completo

```tsx
import { useState } from "react";
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormTextarea,
  FormActions,
  FormButton,
} from "../Common/FormComponents";
import { FiUser, FiSave } from "react-icons/fi";

export default function ExampleForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");

  const categories = [
    { value: "tech", label: "Tecnologia" },
    { value: "business", label: "Negócios" },
    { value: "education", label: "Educação" },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Lógica de envio
  };

  return (
    <FormContainer title="Exemplo de Formulário" icon={<FiUser />}>
      <form onSubmit={handleSubmit}>
        <FormRow columns={2}>
          <FormField label="Nome" required>
            <FormInput
              type="text"
              placeholder="Seu nome"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </FormField>

          <FormField label="E-mail" required>
            <FormInput
              type="email"
              placeholder="seu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </FormField>
        </FormRow>

        <FormRow columns={1}>
          <FormField label="Categoria">
            <FormSelect
              options={categories}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
          </FormField>
        </FormRow>

        <FormRow columns={1}>
          <FormField label="Descrição">
            <FormTextarea
              placeholder="Descreva aqui..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </FormField>
        </FormRow>

        <FormActions>
          <FormButton variant="secondary" type="button">
            Cancelar
          </FormButton>
          <FormButton variant="primary" type="submit" icon={<FiSave />}>
            Salvar
          </FormButton>
        </FormActions>
      </form>
    </FormContainer>
  );
}
```

## Características do Sistema

### Responsividade

- **Desktop**: Layouts em múltiplas colunas
- **Tablet**: Adaptação automática com minmax
- **Mobile**: Uma coluna para melhor usabilidade

### Acessibilidade

- Labels associados aos inputs
- Estados de foco bem definidos
- Mensagens de erro claras
- Suporte a navegação por teclado

### Consistência Visual

- Espaçamentos padronizados (baseado no EventFilters)
- Cores e tipografia unificadas
- Estados hover/focus consistentes
- Ícones e interações familiares

### Flexibilidade

- Suporte a diferentes layouts (1-4 colunas)
- Variantes de botões para diferentes ações
- Sistema de temas (incluindo dark mode)
- Customização via props e CSS

## Migração de Formulários Existentes

1. **Importe os componentes**:

```tsx
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormActions,
  FormButton,
} from "../Common/FormComponents";
```

2. **Substitua a estrutura**:

   - `<div>` containers → `<FormContainer>`
   - `<label>` + `<input>` → `<FormField>` + `<FormInput>`
   - Botões → `<FormActions>` + `<FormButton>`

3. **Configure o layout**:

   - Use `<FormRow columns={n}>` para organizar campos
   - Ajuste conforme o design necessário

4. **Teste responsividade**:
   - Verifique em diferentes tamanhos de tela
   - Garanta que os campos se comportam bem

Este sistema mantém a qualidade e consistência visual estabelecida pelo EventFilters, aplicando-a em toda a aplicação.
