# Correções Necessárias no Metadata do Backend

## 🔴 CRÍTICO - Corrigir IMEDIATAMENTE

### 1. Inverter label e value nos enums

**Problema:** Todas as options de enums estão com label e value invertidos.

**Como está (ERRADO):**

```json
"options": [
  { "label": "MALE", "value": "Masculino" },
  { "label": "FEMALE", "value": "Feminino" }
]
```

**Como deveria ser (CORRETO):**

```json
"options": [
  { "value": "MALE", "label": "Masculino" },
  { "value": "FEMALE", "label": "Feminino" }
]
```

**Afeta todos os enums:**

- `gender` em eventCategory, user
- `status` em event, registration, payment
- `eventType` em event
- `role` em user
- `paymentMethod` em payment
- `transferFrequency` em event
- etc.

---

## 🟡 IMPORTANTE - Corrigir quando possível

### 2. Remover espaços extras dos valores

**Problema:** Alguns valores têm espaços entre as letras.

**Como está (ERRADO):**

```json
{ "label": "PENDING", "value": " P E N D I N G" }
{ "label": "USER", "value": " U S E R" }
```

**Como deveria ser (CORRETO):**

```json
{ "value": "PENDING", "label": "Pendente" }
{ "value": "USER", "label": "Usuário" }
```

**Afeta:**

- `status` em registration
- `role` em user
- `gender` em user

---

### 3. Traduzir labels dos formFields e options dos enums

**Problema:** Labels dos formFields e valores exibidos nos enums estão em inglês.

**Labels que precisam tradução (vistos na tela):**

- `Name` → `Nome`
- `URL Amigável` (já está ok) ✅
- `Descrição` (já está ok) ✅
- `Tipo de Evento` (já está ok) ✅
- `Início em` → `Início em` (ok) ✅
- `Horário` (ok) ✅
- `Endereço` (ok) ✅
- `Inscrições Abertas` (ok) ✅
- `Fim das Inscrições` (ok) ✅
- `Preço` (ok) ✅
- `Currency` → `Moeda`
- `Terms And Conditions` → `Termos e Condições`
- `Banner Url` → `URL do Banner`
- `Status` (ok) ✅
- `Platform Fee Percentage` → `Taxa da Plataforma (%)`
- `Transfer Frequency` → `Frequência de Transferência`

**Options dos enums que estão em inglês:**

**eventType (Tipo de Evento):**

```json
// ❌ Como está (em inglês):
"options": [
  { "value": "RUNNING", "label": "Running" },
  { "value": "CYCLING", "label": "Cycling" },
  { "value": "TRIATHLON", "label": "Triathlon" }
]

// ✅ Como deveria ser (em português):
"options": [
  { "value": "RUNNING", "label": "Corrida" },
  { "value": "CYCLING", "label": "Ciclismo" },
  { "value": "TRIATHLON", "label": "Triatlo" },
  { "value": "SWIMMING", "label": "Natação" },
  { "value": "WALKING", "label": "Caminhada" },
  { "value": "TRAIL_RUNNING", "label": "Trail Running" },
  { "value": "MOUNTAIN_BIKING", "label": "Mountain Bike" },
  { "value": "ROAD_CYCLING", "label": "Ciclismo de Estrada" },
  { "value": "MARATHON", "label": "Maratona" },
  { "value": "HALF_MARATHON", "label": "Meia Maratona" },
  { "value": "ULTRA_MARATHON", "label": "Ultra Maratona" },
  { "value": "OBSTACLE_RACE", "label": "Corrida de Obstáculos" },
  { "value": "DUATHLON", "label": "Duatlo" },
  { "value": "OTHER", "label": "Outro" }
]
```

**transferFrequency (Frequência de Transferência):**

```json
// ❌ Como está (em inglês):
"options": [
  { "value": "IMMEDIATE", "label": "Immediate" },
  { "value": "DAILY", "label": "Daily" },
  { "value": "WEEKLY", "label": "Weekly" },
  { "value": "MONTHLY", "label": "Monthly" },
  { "value": "ON_DEMAND", "label": "On Demand" }
]

// ✅ Como deveria ser (em português):
"options": [
  { "value": "IMMEDIATE", "label": "Imediato" },
  { "value": "DAILY", "label": "Diário" },
  { "value": "WEEKLY", "label": "Semanal" },
  { "value": "MONTHLY", "label": "Mensal" },
  { "value": "ON_DEMAND", "label": "Sob Demanda" }
]
```

**status em Event:**

```json
// ✅ Este já está correto no metadata que você enviou
"options": [
  { "value": "DRAFT", "label": "Rascunho" },
  { "value": "PUBLISHED", "label": "Publicado" },
  { "value": "CANCELLED", "label": "Cancelado" },
  { "value": "COMPLETED", "label": "Concluído" }
]
```

**Categorias (categories - nested):**
Labels dos campos filhos também precisam tradução:

- `Name` → `Nome da Categoria`
- `Min Age` → `Idade Mínima`
- `Max Age` → `Idade Máxima`
- `Gender` → `Gênero`
- `Distance` → `Distância`
- `Distance Unit` → `Unidade de Distância`
- `Price` → `Preço`
- `Max Participants` → `Máximo de Participantes`
- `Current Participants` → `Participantes Atuais`
- `Is Active` → `Ativa`
- `Observations` → `Observações`
- `Tenant Id` → (ocultar)

**Outras entidades que também precisam:**

**paymentMethod:**

```json
// ✅ Como deveria ser:
"options": [
  { "value": "CREDIT_CARD", "label": "Cartão de Crédito" },
  { "value": "DEBIT_CARD", "label": "Cartão de Débito" },
  { "value": "PIX", "label": "PIX" },
  { "value": "BANK_TRANSFER", "label": "Transferência Bancária" },
  { "value": "PAYPAL_ACCOUNT", "label": "Conta PayPal" },
  { "value": "CASH", "label": "Dinheiro" },
  { "value": "OTHER", "label": "Outro" }
]
```

**payment status:**

```json
// ✅ Como deveria ser:
"options": [
  { "value": "PENDING", "label": "Pendente" },
  { "value": "PROCESSING", "label": "Processando" },
  { "value": "COMPLETED", "label": "Concluído" },
  { "value": "FAILED", "label": "Falhou" },
  { "value": "CANCELLED", "label": "Cancelado" },
  { "value": "REFUNDED", "label": "Reembolsado" },
  { "value": "PARTIALLY_REFUNDED", "label": "Parcialmente Reembolsado" }
]
```

---

### 4. Ocultar campos de sistema nos formFields

**Problema:** Campos de sistema aparecem nos formulários.

**Campos que devem ter `visible: false` ou serem removidos dos formFields:**

- `id`
- `createdAt`
- `updatedAt`
- `tenantId` (a menos que seja editável pelo admin)

**Exemplo:**

```json
{
  "name": "id",
  "label": "Id",
  "type": "number",
  "visible": false, // ✅ Adicionar
  "required": false
}
```

**OU** simplesmente não incluir esses campos nos `formFields`.

---

## 🟢 OPCIONAL - Melhorias

### 5. Consistência de types

**Sugestão:** Usar `type: "select"` em vez de `type: "enum"` quando há options, tanto em tableFields quanto formFields.

**Atual (funciona, mas inconsistente):**

- tableFields: `type: "enum"`
- formFields: `type: "select"`

**Sugerido (mais consistente):**

- tableFields: `type: "select"` (com options)
- formFields: `type: "select"` (com options)

---

### 6. Adicionar seções aos formFields

**Sugestão:** Agrupar campos relacionados em seções para melhor UX.

**Exemplo para Event:**

```json
"formSections": [
  {
    "name": "basic",
    "label": "Informações Básicas",
    "fields": ["name", "slug", "description", "eventType"]
  },
  {
    "name": "dates",
    "label": "Datas e Horários",
    "fields": ["eventDate", "eventTime", "startsAt"]
  },
  {
    "name": "location",
    "label": "Localização",
    "fields": ["location", "address"]
  },
  {
    "name": "registration",
    "label": "Inscrições",
    "fields": ["registrationOpen", "registrationStartDate", "registrationEndDate", "maxParticipants", "price"]
  },
  {
    "name": "categories",
    "label": "Categorias",
    "fields": ["categories"]
  }
]
```

Se não implementar seções, o frontend criará uma seção padrão automaticamente.

---

## 📝 Resumo de Prioridades

### Prioridade 1 (Fazer AGORA):

1. ✅ Inverter label/value em TODOS os enums
2. ✅ Remover espaços extras dos valores

### Prioridade 2 (Próximos dias):

3. ✅ Traduzir labels dos formFields para português
4. ✅ Ocultar campos de sistema (id, createdAt, updatedAt)

### Prioridade 3 (Quando tiver tempo):

5. ⭐ Padronizar types (enum → select)
6. ⭐ Implementar formSections para melhor organização

---

## ✅ O que JÁ está PERFEITO (não mexer):

- ✅ Estrutura com fields, tableFields, formFields
- ✅ Relacionamentos 1:N com type: "nested"
- ✅ Validações (required, min, max, minLength, maxLength)
- ✅ Placeholders em português
- ✅ Filters com entityConfig
- ✅ Pagination configurada
- ✅ Tradução dos labels nas options (só precisa inverter com value)

---

## 🧪 Como testar após as correções:

1. Fazer as correções no backend
2. Reiniciar o servidor backend
3. No frontend, limpar o cache do navegador (Ctrl+Shift+Del)
4. Acessar `/eventos` no frontend
5. Clicar em "Criar Novo"
6. Verificar se os selects mostram os textos traduzidos corretamente
7. Preencher e salvar
8. Verificar se os valores enviados ao backend estão corretos (MALE, não "Masculino")
