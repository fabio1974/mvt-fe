# Backend: Computed Fields Support

## O Que São Campos Computados?

Campos cujo valor é **calculado automaticamente** pelo frontend com base em outros campos. O usuário não pode editá-los - são sempre readonly e recalculados em tempo real.

## Exemplo: Nome de Categoria

**Antes** (manual):

- Usuário preenche: Distância = 5, Gênero = Masculino, Idade Mín = 30, Idade Máx = 39
- Usuário digita manualmente: Nome = "5KM - Masculino - 30 a 39 anos"
- ❌ Sujeito a erros de digitação
- ❌ Inconsistente entre diferentes usuários

**Agora** (automático):

- Usuário preenche: Distância = 5, Gênero = Masculino, Idade Mín = 30, Idade Máx = 39
- Frontend calcula automaticamente: Nome = "5KM - Masculino - 30 a 39 anos"
- ✅ Sempre consistente
- ✅ Impossível ter erro

## Como Configurar no Metadata

### Estrutura Básica

```json
{
  "name": "name",
  "type": "text",
  "label": "Nome da Categoria",
  "required": true,
  "computed": "categoryName",
  "computedDependencies": ["distance", "gender", "minAge", "maxAge"]
}
```

### Propriedades Novas

#### `computed` (string, opcional)

Nome da função de cálculo a ser executada pelo frontend.

**Funções disponíveis:**

- `"categoryName"` - Gera nome de categoria (distância + gênero + faixa etária)
- (Mais funções serão adicionadas conforme necessário)

**Exemplo:**

```json
"computed": "categoryName"
```

#### `computedDependencies` (string[], opcional)

Lista de campos que, quando mudarem, disparam o recálculo.

**Importante:**

- Deve conter os nomes **exatos** dos campos (como aparecem em `name`)
- Frontend observa mudanças nesses campos
- Quando qualquer um mudar, o campo computado é recalculado

**Exemplo:**

```json
"computedDependencies": ["distance", "gender", "minAge", "maxAge"]
```

## Exemplo Completo: Categoria

### Metadata Completo

```json
{
  "endpoint": "/categories",
  "title": "Categorias",
  "entityName": "category",
  "sections": [
    {
      "id": "basic-info",
      "title": "Informações da Categoria",
      "fields": [
        {
          "name": "distance",
          "type": "number",
          "label": "Distância (KM)",
          "required": true,
          "validation": {
            "min": 1,
            "max": 100,
            "message": "Distância deve estar entre 1 e 100 KM"
          },
          "width": 1
        },
        {
          "name": "gender",
          "type": "enum",
          "label": "Gênero",
          "required": true,
          "options": [
            { "value": "MALE", "label": "Masculino" },
            { "value": "FEMALE", "label": "Feminino" },
            { "value": "MIXED", "label": "Misto" },
            { "value": "OTHER", "label": "Outro" }
          ],
          "width": 1
        },
        {
          "name": "minAge",
          "type": "number",
          "label": "Idade Mínima",
          "validation": {
            "min": 0,
            "max": 120
          },
          "width": 1
        },
        {
          "name": "maxAge",
          "type": "number",
          "label": "Idade Máxima",
          "validation": {
            "min": 0,
            "max": 120
          },
          "width": 1
        },
        {
          "name": "name",
          "type": "text",
          "label": "Nome da Categoria",
          "required": true,
          "computed": "categoryName",
          "computedDependencies": ["distance", "gender", "minAge", "maxAge"],
          "width": 2
        },
        {
          "name": "maxParticipants",
          "type": "number",
          "label": "Máximo de Participantes",
          "validation": {
            "min": 1
          },
          "width": 1
        },
        {
          "name": "registrationFee",
          "type": "number",
          "label": "Taxa de Inscrição (R$)",
          "validation": {
            "min": 0
          },
          "width": 1
        }
      ]
    }
  ]
}
```

### Comportamento no Frontend

1. **Ordem dos campos:** Campos dependentes (`distance`, `gender`, `minAge`, `maxAge`) devem vir **antes** do campo computado (`name`)
2. **Recálculo automático:** Quando usuário muda qualquer dependência, `name` recalcula
3. **Readonly:** Campo `name` é sempre readonly (fundo cinza, não editável)
4. **Validação:** Campo `name` pode ter `required: true` - validação normal

## Lógica da Função `categoryName`

### Formato de Saída

- **Completo:** `"5KM - Masculino - 30 a 39"`
- **Idade mínima apenas:** `"10KM - Feminino - 60+"` (60 anos ou mais)
- **Idade máxima ≤ 18:** `"21KM - Misto - Sub-18"` (menores de 18)
- **Idade máxima > 18:** `"42.195KM - Feminino - até 25"`
- **Sem restrição de idade:** `"100M - Masculino - Geral"`
- **Com unidade diferente:** `"10MI - Feminino - 40 a 49"` (milhas)
- **Fallback:** `"Nova Categoria"` (quando campos estão vazios)

### Mapeamento de Gênero

```
MALE   → "Masculino"
FEMALE → "Feminino"
MIXED  → "Misto"
OTHER  → "Outro"
```

### Mapeamento de Unidades

```
KM → KM (padrão se não informado)
M  → M  (metros)
MI → MI (milhas)
```

### Exemplos de Saída

| distance | unit | gender | minAge | maxAge | **Resultado**                  |
| -------- | ---- | ------ | ------ | ------ | ------------------------------ |
| 5        | KM   | MALE   | 30     | 39     | `5KM - Masculino - 30 a 39`    |
| 10       | KM   | FEMALE | 60     | null   | `10KM - Feminino - 60+`        |
| 21       | KM   | MIXED  | null   | 18     | `21KM - Misto - Sub-18`        |
| 42.195   | KM   | FEMALE | null   | 25     | `42.195KM - Feminino - até 25` |
| 100      | M    | MALE   | null   | null   | `100M - Masculino - Geral`     |
| 10       | MI   | FEMALE | 40     | 49     | `10MI - Feminino - 40 a 49`    |
| 5        | null | MALE   | null   | null   | `5KM - Masculino - Geral`      |
| null     | null | FEMALE | 30     | 39     | `Feminino - 30 a 39`           |
| null     | null | null   | null   | null   | `Nova Categoria`               |

## Integração com Backend

### No Save (POST/PUT)

O campo computado é enviado normalmente no payload:

```json
{
  "distance": 5,
  "gender": "MALE",
  "minAge": 30,
  "maxAge": 39,
  "name": "5KM - Masculino - 30 a 39 anos",
  "maxParticipants": 100,
  "registrationFee": 50.0
}
```

**Backend deve:**

- ✅ Aceitar o campo `name` normalmente
- ✅ Salvar no banco de dados
- ⚠️ **NÃO precisa recalcular** - valor já vem correto do frontend
- ⚠️ **NÃO deve validar a lógica de cálculo** - frontend é responsável

### No Load (GET)

Backend retorna o valor salvo normalmente:

```json
{
  "id": 123,
  "distance": 5,
  "gender": "MALE",
  "minAge": 30,
  "maxAge": 39,
  "name": "5KM - Masculino - 30 a 39 anos"
}
```

**Frontend:**

- Carrega o valor existente
- Renderiza como readonly
- Se usuário mudar dependências, recalcula

## Validações

### Frontend

- Campo computado é readonly - usuário não pode editar diretamente
- Validações normais aplicam (`required`, `minLength`, etc.)
- Se `required: true`, campo é validado antes do submit

### Backend

```java
@Entity
public class Category {
    @NotBlank(message = "Nome é obrigatório")
    @Size(max = 200, message = "Nome muito longo")
    private String name;

    @NotNull(message = "Distância é obrigatória")
    @Min(value = 1, message = "Distância mínima é 1 KM")
    @Max(value = 100, message = "Distância máxima é 100 KM")
    private Integer distance;

    @NotNull(message = "Gênero é obrigatório")
    @Enumerated(EnumType.STRING)
    private Gender gender;

    private Integer minAge;
    private Integer maxAge;
}
```

**Recomendações:**

- ✅ Validar campos dependentes (distance, gender, age)
- ✅ Validar constraints básicos de `name` (not blank, max length)
- ❌ **NÃO** validar se o cálculo está correto - confie no frontend

## Solicitação de Novas Funções

Se precisar de outros tipos de campos computados, solicite ao time de frontend:

**Exemplo de solicitação:**

```
Precisamos de um campo "fullAddress" que combine:
- address.street
- address.number
- address.city
- address.state

Formato: "Rua X, 123 - Cidade/UF"
```

**Frontend criará:**

1. Nova função no registry (`computedFieldFunctions`)
2. Documentação da lógica de cálculo
3. Exemplos de uso

## Checklist de Implementação

Backend:

- [x] ✅ Adicionar `"computed": "categoryName"` no campo `name`
- [x] ✅ Adicionar `"computedDependencies": ["distance", "gender", "minAge", "maxAge"]`
- [x] ✅ Garantir que campos dependentes vêm antes do computado no metadata
- [ ] Aceitar campo computado no POST/PUT (sem recalcular)
- [ ] Retornar campo computado normalmente no GET
- [ ] Validações básicas (required, max length)

Frontend:

- [x] ✅ Detectar campos com `computed` no metadata
- [x] ✅ Observar mudanças nas dependências
- [x] ✅ Recalcular automaticamente
- [x] ✅ Renderizar como readonly
- [x] ✅ Função `categoryName` implementada
- [x] ✅ **FIX: Converter metadata corretamente** (ver `/COMPUTED_FIELDS_FIX.md`)

## Dúvidas?

Consulte a documentação completa em:

- `/docs/frontend/COMPUTED_FIELDS_GUIDE.md` - Guia completo do frontend
- `/src/utils/computedFields.ts` - Implementação das funções

Ou pergunte ao time de frontend! 🚀
