# Campo de Estado Automático ao Lado de Cidade

## 📋 Descrição

Sempre que houver um campo de cidade em um formulário ou filtro, automaticamente aparece um campo de "Estado" readonly ao lado direito que exibe o estado (UF) da cidade selecionada.

## ✨ Características

- **Automático**: Não precisa configurar nada no backend, é detectado automaticamente
- **Readonly**: O campo de estado é apenas para visualização, não é enviado no payload
- **Responsivo**: Ocupa duas colunas do grid, lado a lado (cidade + estado)
- **Atualização Dinâmica**: Quando seleciona uma cidade diferente, o estado muda automaticamente

## 🎯 Como Funciona

### 1. **Estado Local**

```tsx
const [cityStates, setCityStates] = useState<Record<string, string>>({});
```

- Armazena os estados das cidades selecionadas
- Key: nome do campo (ex: "city", "cityId")
- Value: UF da cidade (ex: "CE", "SP")

### 2. **Detecção Automática**

O sistema detecta campos de cidade em:

**EntityForm:**

- `case "city"` - Campos do tipo "city"
- `case "entity"` - Campos com `name === "city"` ou `name === "cityId"`

**EntityFilters:**

- `filter.name === "city"`
- `filter.name === "cityId"`
- `filter.entityConfig.entityName === "city"`

### 3. **Layout Responsivo**

```tsx
<>
  <FormField label="Cidade" required={true}>
    <CityTypeahead ... />
  </FormField>

  <FormField label="Estado">
    <FormInput
      value={cityStates[field.name] || ""}
      readOnly
      disabled
      style={{ backgroundColor: "#f3f4f6", cursor: "not-allowed" }}
    />
  </FormField>
</>
```

- Usa `<>` (Fragment) para retornar dois campos
- Cada campo ocupa 1 coluna do grid responsivo
- No desktop: ficam lado a lado
- No mobile: empilham verticalmente

## 📝 Exemplo de Uso

### Formulário de Evento

```
Nome*                    Tipo de Evento*          Data do Evento*
[Digite nome      ]      [Selecione...    ▼]      [DD/MM/YYYY      ]

Cidade                   Estado                   Local
[Tianguá          ]      [CE              ]       [Digite local    ]
```

### Filtros de Evento

```
Cidade                   Estado
[Fortaleza        ]      [CE              ]
```

## 🔄 Fluxo de Dados

1. **Usuário digita** no CityTypeahead
2. **Busca cidades** na API `/cities/search`
3. **Seleciona uma cidade**
4. **onCitySelect** é chamado com objeto `City`
5. **handleChange** atualiza o formData com `city.name`
6. **setCityStates** armazena `city.stateCode` ou `city.state`
7. **Campo Estado** exibe o valor armazenado

## 🎨 Estilo do Campo Estado

```tsx
style={{
  backgroundColor: "#f3f4f6",  // Cinza claro
  cursor: "not-allowed"         // Cursor de bloqueado
}}
```

- **readOnly + disabled**: Impede edição e envio no form
- **Cor de fundo cinza**: Indica visualmente que é readonly
- **Sem largura fixa**: Ocupa espaço natural do grid (responsivo)

## 📦 Onde Foi Implementado

### EntityForm.tsx

- Linha ~471: `case "city"`
- Linha ~518: `case "entity"` (quando city/cityId)

### EntityFilters.tsx

- Linha ~153: Detecção de `isCityFilter`
- Linha ~158: Renderização dos dois campos

## 🚀 Benefícios

1. **UX Melhorada**: Usuário vê imediatamente o estado da cidade
2. **Validação Visual**: Confirma que selecionou a cidade certa
3. **Informação Contextual**: Útil em formulários longos
4. **Não Polui o Payload**: Estado não é enviado (só cidade)
5. **Responsivo**: Funciona bem em mobile e desktop

## 🔍 Observações

- O campo de estado **não é enviado** no payload do formulário
- Apenas o campo de cidade é incluído nos dados
- O estado é puramente informativo/visual
- Funciona tanto em formulários principais quanto em filtros
- Compatível com o grid responsivo existente (`repeat(auto-fit, minmax(250px, 1fr))`)

## 📱 Responsividade

**Desktop (≥640px):**

```
[Cidade              ] [Estado    ]
```

**Mobile (<640px):**

```
[Cidade              ]
[Estado              ]
```

Cada campo ocupa 1 coluna do grid, e o comportamento responsivo é automático graças ao `auto-fit`.
