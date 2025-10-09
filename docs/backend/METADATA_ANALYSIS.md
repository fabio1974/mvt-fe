# Análise do Metadata Atual - O que falta traduzir

## 📊 Status das Traduções por Entidade

### 🔴 EVENT - Precisa de MUITAS correções

#### Labels dos formFields (em inglês):

```json
❌ "name": "Name" → deveria ser "Nome"
❌ "slug": "Slug" → deveria ser "URL Amigável" ou "Identificador"
❌ "description": "Description" → deveria ser "Descrição"
❌ "eventType": "Event Type" → deveria ser "Tipo de Evento"
❌ "startsAt": "Starts At" → deveria ser "Início em"
❌ "eventDate": "Event Date" → deveria ser "Data do Evento"
❌ "eventTime": "Event Time" → deveria ser "Horário"
❌ "location": "Location" → deveria ser "Local"
❌ "address": "Address" → deveria ser "Endereço"
❌ "maxParticipants": "Max Participants" → deveria ser "Máximo de Participantes"
❌ "registrationOpen": "Registration Open" → deveria ser "Inscrições Abertas"
❌ "registrationStartDate": "Registration Start Date" → deveria ser "Início das Inscrições"
❌ "registrationEndDate": "Registration End Date" → deveria ser "Fim das Inscrições"
❌ "price": "Price" → deveria ser "Preço"
❌ "currency": "Currency" → deveria ser "Moeda"
❌ "termsAndConditions": "Terms And Conditions" → deveria ser "Termos e Condições"
❌ "bannerUrl": "Banner Url" → deveria ser "URL do Banner"
❌ "status": "Status" → já está ok ✅
❌ "platformFeePercentage": "Platform Fee Percentage" → deveria ser "Taxa da Plataforma (%)"
❌ "transferFrequency": "Transfer Frequency" → deveria ser "Frequência de Transferência"
❌ "categories": "Categories" → deveria ser "Categorias"
```

#### Options dos enums:

**eventType - TODOS EM INGLÊS:**

```json
❌ { "label": "RUNNING", "value": "Running" }
❌ { "label": "CYCLING", "value": "Cycling" }
❌ { "label": "TRIATHLON", "value": "Triathlon" }
❌ { "label": "SWIMMING", "value": "Swimming" }
❌ { "label": "WALKING", "value": "Walking" }
❌ { "label": "TRAIL_RUNNING", "value": "Trail Running" }
❌ { "label": "MOUNTAIN_BIKING", "value": "Mountain Biking" }
❌ { "label": "ROAD_CYCLING", "value": "Road Cycling" }
❌ { "label": "MARATHON", "value": "Marathon" }
❌ { "label": "HALF_MARATHON", "value": "Half Marathon" }
❌ { "label": "ULTRA_MARATHON", "value": "Ultra Marathon" }
❌ { "label": "OBSTACLE_RACE", "value": "Obstacle Race" }
❌ { "label": "DUATHLON", "value": "Duathlon" }
❌ { "label": "OTHER", "value": "Other" }

// ✅ CORRETO deveria ser:
{ "value": "RUNNING", "label": "Corrida" }
{ "value": "CYCLING", "label": "Ciclismo" }
{ "value": "TRIATHLON", "label": "Triatlo" }
{ "value": "SWIMMING", "label": "Natação" }
{ "value": "WALKING", "label": "Caminhada" }
{ "value": "TRAIL_RUNNING", "label": "Trail Running" }
{ "value": "MOUNTAIN_BIKING", "label": "Mountain Bike" }
{ "value": "ROAD_CYCLING", "label": "Ciclismo de Estrada" }
{ "value": "MARATHON", "label": "Maratona" }
{ "value": "HALF_MARATHON", "label": "Meia Maratona" }
{ "value": "ULTRA_MARATHON", "label": "Ultra Maratona" }
{ "value": "OBSTACLE_RACE", "label": "Corrida de Obstáculos" }
{ "value": "DUATHLON", "label": "Duatlo" }
{ "value": "OTHER", "label": "Outro" }
```

**status - TRADUZIDO MAS INVERTIDO:**

```json
❌ { "label": "DRAFT", "value": "Rascunho" }
❌ { "label": "PUBLISHED", "value": "Publicado" }
❌ { "label": "CANCELLED", "value": "Cancelado" }
❌ { "label": "COMPLETED", "value": "Concluído" }

// ✅ CORRETO deveria ser:
{ "value": "DRAFT", "label": "Rascunho" }
{ "value": "PUBLISHED", "label": "Publicado" }
{ "value": "CANCELLED", "label": "Cancelado" }
{ "value": "COMPLETED", "label": "Concluído" }
```

**transferFrequency - TODOS EM INGLÊS E INVERTIDOS:**

```json
❌ { "label": "IMMEDIATE", "value": "Immediate" }
❌ { "label": "DAILY", "value": "Daily" }
❌ { "label": "WEEKLY", "value": "Weekly" }
❌ { "label": "MONTHLY", "value": "Monthly" }
❌ { "label": "ON_DEMAND", "value": "On Demand" }

// ✅ CORRETO deveria ser:
{ "value": "IMMEDIATE", "label": "Imediato" }
{ "value": "DAILY", "label": "Diário" }
{ "value": "WEEKLY", "label": "Semanal" }
{ "value": "MONTHLY", "label": "Mensal" }
{ "value": "ON_DEMAND", "label": "Sob Demanda" }
```

#### Nested: categories (EventCategory) - TODOS EM INGLÊS:

```json
❌ "name": "Name" → "Nome da Categoria"
❌ "minAge": "Min Age" → "Idade Mínima"
❌ "maxAge": "Max Age" → "Idade Máxima"
❌ "gender": "Gender" → "Gênero"
❌ "distance": "Distance" → "Distância"
❌ "distanceUnit": "Distance Unit" → "Unidade de Distância"
❌ "price": "Price" → "Preço"
❌ "maxParticipants": "Max Participants" → "Máximo de Participantes"
❌ "currentParticipants": "Current Participants" → "Participantes Atuais"
❌ "isActive": "Is Active" → "Ativa"
❌ "observations": "Observations" → "Observações"
❌ "tenantId": "Tenant Id" → deveria estar oculto (visible: false)
```

**gender nas categories - TRADUZIDO MAS INVERTIDO:**

```json
❌ { "label": "MALE", "value": "Masculino" }
❌ { "label": "FEMALE", "value": "Feminino" }
❌ { "label": "MIXED", "value": "Misto" }
❌ { "label": "OTHER", "value": "Outro" }

// ✅ CORRETO:
{ "value": "MALE", "label": "Masculino" }
{ "value": "FEMALE", "label": "Feminino" }
{ "value": "MIXED", "label": "Misto" }
{ "value": "OTHER", "label": "Outro" }
```

---

### 🔴 EVENT_CATEGORY - Precisa correções

#### Labels dos formFields:

```json
❌ "name": "Name" → "Nome da Categoria"
❌ "minAge": "Min Age" → "Idade Mínima"
❌ "maxAge": "Max Age" → "Idade Máxima"
❌ "gender": "Gender" → "Gênero"
❌ "distance": "Distance" → "Distância"
❌ "distanceUnit": "Distance Unit" → "Unidade de Distância"
❌ "price": "Price" → "Preço"
❌ "maxParticipants": "Max Participants" → "Máximo de Participantes"
❌ "currentParticipants": "Current Participants" → "Participantes Atuais"
❌ "isActive": "Is Active" → "Ativa"
❌ "observations": "Observations" → "Observações"
❌ "tenantId": "Tenant Id" → ocultar
```

#### gender options - INVERTIDOS:

```json
❌ { "label": "MALE", "value": "Masculino" }
// ✅ { "value": "MALE", "label": "Masculino" }
```

---

### 🔴 ORGANIZATION - Precisa correções

#### Labels dos formFields:

```json
❌ "name": "Name" → "Nome"
❌ "slug": "Slug" → "URL Amigável"
❌ "contactEmail": "Contact Email" → "E-mail de Contato"
❌ "phone": "Phone" → "Telefone"
❌ "website": "Website" → "Website"
❌ "description": "Description" → "Descrição"
❌ "logoUrl": "Logo Url" → "URL do Logo"
```

---

### 🔴 REGISTRATION - Precisa correções

#### Labels dos formFields:

```json
❌ "registrationDate": "Registration Date" → "Data de Inscrição"
❌ "status": "Status" → ok ✅
❌ "notes": "Notes" → "Observações"
❌ "tenantId": "Tenant Id" → ocultar
❌ "payments": "Payments" → "Pagamentos"
```

#### status options - COM ESPAÇOS E INVERTIDOS:

```json
❌ { "label": "PENDING", "value": " P E N D I N G" }
❌ { "label": "ACTIVE", "value": " A C T I V E" }
❌ { "label": "CANCELLED", "value": " C A N C E L L E D" }
❌ { "label": "COMPLETED", "value": " C O M P L E T E D" }

// ✅ CORRETO:
{ "value": "PENDING", "label": "Pendente" }
{ "value": "ACTIVE", "label": "Ativa" }
{ "value": "CANCELLED", "label": "Cancelada" }
{ "value": "COMPLETED", "label": "Concluída" }
```

#### Nested: payments - TODOS EM INGLÊS:

```json
❌ "amount": "Amount" → "Valor"
❌ "currency": "Currency" → "Moeda"
❌ "status": "Status" → "Status" ✅
❌ "paymentMethod": "Payment Method" → "Método de Pagamento"
❌ "gatewayProvider": "Gateway Provider" → "Gateway de Pagamento"
❌ "gatewayPaymentId": "Gateway Payment Id" → "ID do Pagamento no Gateway"
❌ "gatewayFee": "Gateway Fee" → "Taxa do Gateway"
❌ "gatewayResponse": "Gateway Response" → "Resposta do Gateway"
❌ "processedAt": "Processed At" → "Processado em"
❌ "refundedAt": "Refunded At" → "Reembolsado em"
❌ "refundAmount": "Refund Amount" → "Valor do Reembolso"
❌ "refundReason": "Refund Reason" → "Motivo do Reembolso"
```

---

### 🔴 PAYMENT - Precisa correções

#### Labels dos formFields:

```json
❌ "tenantId": "Tenant Id" → ocultar
❌ "amount": "Amount" → "Valor"
❌ "currency": "Currency" → "Moeda"
❌ "status": "Status" → ok ✅
❌ "paymentMethod": "Payment Method" → "Método de Pagamento"
❌ "gatewayProvider": "Gateway Provider" → "Gateway de Pagamento"
❌ "gatewayPaymentId": "Gateway Payment Id" → "ID do Pagamento"
❌ "gatewayFee": "Gateway Fee" → "Taxa do Gateway"
❌ "gatewayResponse": "Gateway Response" → "Resposta do Gateway"
❌ "processedAt": "Processed At" → "Processado em"
❌ "refundedAt": "Refunded At" → "Reembolsado em"
❌ "refundAmount": "Refund Amount" → "Valor do Reembolso"
❌ "refundReason": "Refund Reason" → "Motivo do Reembolso"
```

#### status options - TRADUZIDOS MAS INVERTIDOS:

```json
❌ { "label": "PENDING", "value": "Pending" }
// ✅ { "value": "PENDING", "label": "Pendente" }
```

#### paymentMethod options - TRADUZIDOS MAS INVERTIDOS:

```json
❌ { "label": "CREDIT_CARD", "value": "Credit Card" }
❌ { "label": "DEBIT_CARD", "value": "Debit Card" }
❌ { "label": "PIX", "value": "PIX" }
❌ { "label": "BANK_TRANSFER", "value": "Bank Transfer" }
❌ { "label": "PAYPAL_ACCOUNT", "value": "PayPal Account" }
❌ { "label": "CASH", "value": "Cash" }
❌ { "label": "OTHER", "value": "Other" }

// ✅ CORRETO:
{ "value": "CREDIT_CARD", "label": "Cartão de Crédito" }
{ "value": "DEBIT_CARD", "label": "Cartão de Débito" }
{ "value": "PIX", "label": "PIX" }
{ "value": "BANK_TRANSFER", "label": "Transferência Bancária" }
{ "value": "PAYPAL_ACCOUNT", "label": "Conta PayPal" }
{ "value": "CASH", "label": "Dinheiro" }
{ "value": "OTHER", "label": "Outro" }
```

---

### 🔴 USER - Precisa correções

#### Labels dos formFields:

```json
❌ "username": "Username" → "E-mail"
❌ "password": "Password" → "Senha"
❌ "enabled": "Enabled" → "Ativo"
❌ "role": "Role" → "Perfil"
❌ "address": "Address" → "Endereço"
❌ "city": "City" → "Cidade"
❌ "country": "Country" → "País"
❌ "dateOfBirth": "Date Of Birth" → "Data de Nascimento"
❌ "cpf": "Cpf" → "CPF"
❌ "emergencyContact": "Emergency Contact" → "Contato de Emergência"
❌ "gender": "Gender" → "Gênero"
❌ "name": "Name" → "Nome Completo"
❌ "phone": "Phone" → "Telefone"
❌ "state": "State" → "Estado"
```

#### role options - COM ESPAÇOS E INVERTIDOS:

```json
❌ { "label": "USER", "value": " U S E R" }
❌ { "label": "ORGANIZER", "value": " O R G A N I Z E R" }
❌ { "label": "ADMIN", "value": " A D M I N" }

// ✅ CORRETO:
{ "value": "USER", "label": "Usuário" }
{ "value": "ORGANIZER", "label": "Organizador" }
{ "value": "ADMIN", "label": "Administrador" }
```

#### gender options - COM ESPAÇOS E INVERTIDOS:

```json
❌ { "label": "MALE", "value": " M A L E" }
❌ { "label": "FEMALE", "value": " F E M A L E" }
❌ { "label": "OTHER", "value": " O T H E R" }

// ✅ CORRETO:
{ "value": "MALE", "label": "Masculino" }
{ "value": "FEMALE", "label": "Feminino" }
{ "value": "OTHER", "label": "Outro" }
```

---

## 📊 RESUMO GERAL

### 🔴 Problemas CRÍTICOS encontrados:

1. **100% dos labels dos formFields estão em inglês**
2. **100% das options têm label/value invertidos**
3. **Alguns enums têm espaços extras nos valores** (USER, ROLE, GENDER em user e registration)
4. **Algumas traduções estão incompletas** (paymentMethod tem "Credit Card" em vez de "Cartão de Crédito")

### ✅ O que está CORRETO:

1. Labels dos tableFields estão em português ✅
2. Placeholders estão em português ✅
3. Estrutura de fields, tableFields, formFields está correta ✅
4. Relacionamentos nested estão corretos ✅
5. Validações estão presentes ✅

### 📋 AÇÃO NECESSÁRIA:

**TUDO precisa ser traduzido no backend:**

- Todos os labels de formFields
- Todos os labels de options (e inverter com value)
- Remover espaços extras dos valores
- Ocultar campos de sistema (id, createdAt, updatedAt, tenantId)
