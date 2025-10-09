# Campo Array - Guia de Uso

## Visão Geral

O tipo de campo `array` permite criar listas dinâmicas no formulário, onde o usuário pode adicionar/remover itens. É perfeito para cenários como:

- Categorias de um evento
- Tags/palavras-chave
- Lista de produtos
- Contatos múltiplos
- Qualquer lista de itens relacionados

## Tipos de Array

### 1. Array Simples (texto)

Lista de strings simples:

```typescript
{
  name: "tags",
  label: "Tags do Evento",
  type: "array",
  arrayConfig: {
    itemType: "text",
    addLabel: "Adicionar Tag",
    itemLabel: "Tag {index}",
    placeholder: "Ex: corrida, trail, montanha",
    minItems: 1,
    maxItems: 10,
  },
}
```

**Valor gerado:**

```json
{
  "tags": ["corrida", "trail", "montanha"]
}
```

### 2. Array de Números

Lista de valores numéricos:

```typescript
{
  name: "checkpoints",
  label: "Checkpoints (km)",
  type: "array",
  arrayConfig: {
    itemType: "number",
    addLabel: "Adicionar Checkpoint",
    itemLabel: "Checkpoint {index}",
    placeholder: "Ex: 5",
    minItems: 0,
    maxItems: 20,
  },
}
```

**Valor gerado:**

```json
{
  "checkpoints": [5, 10, 15, 21]
}
```

### 3. Array de Select

Lista de valores predefinidos:

```typescript
{
  name: "amenities",
  label: "Comodidades Oferecidas",
  type: "array",
  arrayConfig: {
    itemType: "select",
    addLabel: "Adicionar Comodidade",
    itemLabel: "Comodidade {index}",
    minItems: 0,
    maxItems: 10,
    options: [
      { value: "parking", label: "Estacionamento" },
      { value: "water", label: "Água" },
      { value: "medical", label: "Atendimento Médico" },
      { value: "locker", label: "Guarda-Volumes" },
      { value: "shower", label: "Vestiário" },
    ],
  },
}
```

**Valor gerado:**

```json
{
  "amenities": ["parking", "water", "medical"]
}
```

### 4. Array de Objetos (mais complexo)

Lista de objetos com múltiplos campos:

```typescript
{
  name: "categories",
  label: "Categorias do Evento",
  type: "array",
  required: true,
  arrayConfig: {
    itemType: "object",
    addLabel: "Adicionar Categoria",
    itemLabel: "Categoria {index}",
    minItems: 1,
    maxItems: 10,
    fields: [
      {
        name: "name",
        label: "Nome da Categoria",
        type: "text",
        placeholder: "Ex: 5km Masculino",
        required: true,
      },
      {
        name: "distance",
        label: "Distância (km)",
        type: "number",
        placeholder: "Ex: 5",
        required: true,
        validation: {
          min: 0.1,
          max: 500,
        },
      },
      {
        name: "price",
        label: "Preço (R$)",
        type: "number",
        placeholder: "Ex: 50.00",
        required: true,
        validation: {
          min: 0,
        },
      },
      {
        name: "gender",
        label: "Gênero",
        type: "select",
        required: true,
        options: [
          { value: "M", label: "Masculino" },
          { value: "F", label: "Feminino" },
          { value: "BOTH", label: "Ambos" },
        ],
      },
      {
        name: "maxParticipants",
        label: "Vagas",
        type: "number",
        placeholder: "Ex: 100",
        validation: {
          min: 1,
        },
      },
    ],
  },
}
```

**Valor gerado:**

```json
{
  "categories": [
    {
      "name": "5km Masculino",
      "distance": 5,
      "price": 50,
      "gender": "M",
      "maxParticipants": 100
    },
    {
      "name": "10km Feminino",
      "distance": 10,
      "price": 60,
      "gender": "F",
      "maxParticipants": 80
    }
  ]
}
```

## Configuração ArrayFieldConfig

```typescript
interface ArrayFieldConfig {
  /** Tipo de item no array */
  itemType: "text" | "number" | "select" | "object";

  /** Label para o botão de adicionar */
  addLabel?: string;

  /** Label para cada item (pode usar {index}) */
  itemLabel?: string;

  /** Placeholder para itens simples */
  placeholder?: string;

  /** Opções para select items */
  options?: FilterOption[];

  /** Campos do objeto (se itemType === 'object') */
  fields?: FormFieldMetadata[];

  /** Valor mínimo de itens */
  minItems?: number;

  /** Valor máximo de itens */
  maxItems?: number;

  /** Se pode reordenar itens */
  sortable?: boolean;
}
```

## Exemplos Práticos

### Exemplo 1: Tags de Evento

```typescript
{
  id: "metadata",
  title: "Informações Adicionais",
  columns: 1,
  fields: [
    {
      name: "tags",
      label: "Tags",
      type: "array",
      arrayConfig: {
        itemType: "text",
        addLabel: "+ Adicionar Tag",
        itemLabel: "Tag {index}",
        placeholder: "Digite uma tag",
        maxItems: 10,
      },
    },
  ],
}
```

### Exemplo 2: Kits do Evento

```typescript
{
  name: "kits",
  label: "Kits Disponíveis",
  type: "array",
  required: true,
  arrayConfig: {
    itemType: "object",
    addLabel: "Adicionar Kit",
    itemLabel: "Kit {index}",
    minItems: 1,
    maxItems: 5,
    fields: [
      {
        name: "name",
        label: "Nome do Kit",
        type: "text",
        placeholder: "Ex: Kit Básico",
        required: true,
      },
      {
        name: "description",
        label: "Descrição",
        type: "textarea",
        placeholder: "O que inclui?",
      },
      {
        name: "price",
        label: "Preço Adicional (R$)",
        type: "number",
        defaultValue: 0,
      },
    ],
  },
}
```

### Exemplo 3: Premiações

```typescript
{
  name: "prizes",
  label: "Premiações",
  type: "array",
  arrayConfig: {
    itemType: "object",
    addLabel: "Adicionar Premiação",
    itemLabel: "Colocação {index}",
    maxItems: 10,
    fields: [
      {
        name: "position",
        label: "Posição",
        type: "select",
        required: true,
        options: [
          { value: "1", label: "1º Lugar" },
          { value: "2", label: "2º Lugar" },
          { value: "3", label: "3º Lugar" },
          { value: "4", label: "4º Lugar" },
          { value: "5", label: "5º Lugar" },
        ],
      },
      {
        name: "category",
        label: "Categoria",
        type: "text",
        placeholder: "Ex: Geral Masculino",
        required: true,
      },
      {
        name: "prize",
        label: "Prêmio",
        type: "text",
        placeholder: "Ex: R$ 500,00",
        required: true,
      },
    ],
  },
}
```

### Exemplo 4: Parceiros/Patrocinadores

```typescript
{
  name: "sponsors",
  label: "Patrocinadores",
  type: "array",
  arrayConfig: {
    itemType: "object",
    addLabel: "+ Adicionar Patrocinador",
    itemLabel: "Patrocinador {index}",
    maxItems: 20,
    fields: [
      {
        name: "name",
        label: "Nome",
        type: "text",
        required: true,
      },
      {
        name: "tier",
        label: "Nível",
        type: "select",
        required: true,
        options: [
          { value: "diamond", label: "Diamante" },
          { value: "gold", label: "Ouro" },
          { value: "silver", label: "Prata" },
          { value: "bronze", label: "Bronze" },
        ],
      },
      {
        name: "website",
        label: "Website",
        type: "text",
        placeholder: "https://...",
      },
    ],
  },
}
```

## Validação

### Validação de Quantidade

```typescript
arrayConfig: {
  minItems: 1,  // Obrigatório pelo menos 1 item
  maxItems: 10, // Máximo 10 itens
}
```

Mensagens automáticas:

- Se `minItems` não for atingido: "Mínimo de X itens"
- Se `maxItems` for atingido: "Máximo de X itens atingido"

### Validação de Campos Internos

Para objetos, você pode validar cada campo:

```typescript
fields: [
  {
    name: "price",
    label: "Preço",
    type: "number",
    required: true,
    validation: {
      min: 0,
      max: 10000,
      message: "Preço deve estar entre R$ 0 e R$ 10.000",
    },
  },
];
```

## Comportamento da UI

### Itens Simples (text, number, select)

- Cada item aparece em uma linha
- Botão de remover ao lado (ícone de lixeira)
- Label numerado (Item 1, Item 2, etc.)

### Itens de Objeto

- Cada item em um card separado
- Ícone de menu para indicar que é um bloco
- Campos organizados em grid responsivo
- Botão de remover no canto superior direito

### Estados Especiais

- **Lista vazia**: Mostra mensagem "Nenhum item adicionado"
- **Botão adicionar desabilitado**: Quando atinge `maxItems`
- **Botão remover desabilitado**: Quando está em `minItems`

## Integração com Backend

O array é enviado diretamente no JSON:

```typescript
// Frontend envia:
{
  "name": "Corrida da Montanha",
  "categories": [
    { "name": "5km", "distance": 5, "price": 50 },
    { "name": "10km", "distance": 10, "price": 60 }
  ]
}
```

### Exemplo Backend (Spring Boot)

```java
@Entity
public class Event {
    @Id
    private Long id;

    private String name;

    @OneToMany(cascade = CascadeType.ALL, orphanRemoval = true)
    private List<Category> categories;
}

@Entity
public class Category {
    @Id
    private Long id;

    private String name;
    private Double distance;
    private Double price;

    @ManyToOne
    private Event event;
}
```

## Dicas e Boas Práticas

### 1. Use Labels Claros com {index}

```typescript
// ✅ BOM
itemLabel: "Categoria {index}";
// Resultado: Categoria 1, Categoria 2, Categoria 3

// ❌ EVITE
itemLabel: "Item";
// Resultado: Item, Item, Item (confuso)
```

### 2. Defina Limites Razoáveis

```typescript
// ✅ BOM
minItems: 1,   // Pelo menos uma categoria
maxItems: 10,  // Máximo razoável

// ❌ EVITE
maxItems: 1000, // Muito! Interface vai ficar pesada
```

### 3. Use itemType Apropriado

```typescript
// Para listas simples
itemType: "text"; // tags, palavras-chave

// Para valores numéricos
itemType: "number"; // distâncias, preços

// Para opções fixas
itemType: "select"; // comodidades, níveis

// Para dados estruturados
itemType: "object"; // categorias, kits, premiações
```

### 4. Organize Campos de Objeto

```typescript
// ✅ BOM: Campos relacionados juntos
fields: [
  { name: "name", ... },        // Identificação
  { name: "distance", ... },    // Dados técnicos
  { name: "price", ... },       // Dados técnicos
  { name: "maxParticipants", ...}, // Limites
]

// Ordem lógica facilita o preenchimento
```

## Troubleshooting

### Array não aparece no formulário

- Verifique se `arrayConfig` está definido
- Confirme que o tipo é `"array"`

### Itens não são salvos

- Verifique se o backend está esperando um array
- Confira a estrutura dos dados no Network tab

### Validação não funciona

- Para objetos, a validação é por campo
- Para arrays simples, use `minItems`/`maxItems`

### Botão adicionar desabilitado

- Verifique se atingiu `maxItems`
- Confirme que `disabled` não está true

## Exemplos Completos

Veja os arquivos:

- `/src/metadata/eventFormMetadata.ts` - Categorias de evento
- `/src/components/Generic/ArrayField.tsx` - Implementação do componente
