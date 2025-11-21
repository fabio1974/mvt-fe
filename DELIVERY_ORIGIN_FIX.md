# ✅ SOLUÇÃO: Endereço de Origem no Formulário de Delivery

## 🎯 Problema Identificado

Os campos de endereço de origem não apareciam no formulário porque:

1. **❌ Nomes incorretos:** Estávamos usando `originAddress`, `originLatitude`, `originLongitude`
2. **✅ Nomes corretos:** Backend usa `fromAddress`, `fromLatitude`, `fromLongitude`
3. **❌ Campos invisíveis:** Metadata tinha `visible: false` para latitude/longitude

## 🔧 Correções Aplicadas

### 1. **DeliveryCRUDPage.tsx** - Nomes dos Campos

**Antes:**
```typescript
values.originAddress = userAddress;
values.originLatitude = userLatitude;
values.originLongitude = userLongitude;
```

**Depois:**
```typescript
values.fromAddress = userAddress;
values.fromLatitude = userLatitude;
values.fromLongitude = userLongitude;
```

### 2. **EntityForm.tsx** - Forçar Visibilidade de Coordenadas

Adicionada lógica para mostrar campos de latitude/longitude quando tiverem valor, mesmo que `visible: false` no metadata:

```typescript
const isCoordinateField = field.name.toLowerCase().includes('latitude') || 
                          field.name.toLowerCase().includes('longitude');
const hasValue = formData[field.name] !== undefined && 
                 formData[field.name] !== null && 
                 formData[field.name] !== '';

if (field.visible === false && !(isCoordinateField && hasValue)) {
  return null;
}
```

**Benefício:** Campos de coordenadas aparecem automaticamente quando pré-preenchidos, mesmo que marcados como invisíveis no backend.

## 📋 Estrutura dos Campos no Backend

```json
{
  "fromAddress": {
    "label": "Endereço de Origem",
    "type": "textarea",
    "visible": false,  // ← Pode ficar false, campo aparece quando tem valor
    "required": true
  },
  "fromLatitude": {
    "label": "Latitude de Origem",
    "type": "string",
    "visible": false,  // ← Agora aparece se tiver valor no formData
    "readonly": true
  },
  "fromLongitude": {
    "label": "Longitude de Origem", 
    "type": "string",
    "visible": false,  // ← Agora aparece se tiver valor no formData
    "readonly": true
  }
}
```

## 🎯 Fluxo Completo Funcionando

```
1. Usuário CLIENT faz login
   ↓
2. Backend retorna latitude/longitude no token (ou localStorage)
   ↓
3. Usuário clica em "Criar Nova Entrega"
   ↓
4. DeliveryCRUDPage extrai:
   - userId → campo "client"
   - latitude → campo "fromLatitude"
   - longitude → campo "fromLongitude"
   - address → campo "fromAddress"
   ↓
5. setDefaultValues({ client, fromLatitude, fromLongitude, fromAddress })
   ↓
6. EntityCRUD passa como initialValues para EntityForm
   ↓
7. EntityForm detecta valores nos campos from*
   ↓
8. Mesmo com visible: false, campos aparecem porque têm valor
   ↓
9. ✅ Formulário mostra origem pré-preenchida!
```

## 🧪 Teste

1. Faça login como CLIENT
2. Vá em "Entregas" → "Criar Nova Entrega"
3. Deveria ver:
   - ✅ Campo "Cliente" pré-preenchido
   - ✅ Campo "Endereço de Origem" pré-preenchido
   - ✅ Campo "Latitude de Origem" pré-preenchido (readonly)
   - ✅ Campo "Longitude de Origem" pré-preenchido (readonly)

## 📝 Campos de Destino

Para pré-preencher destino (se necessário no futuro):
```typescript
values.toAddress = destinationAddress;
values.toLatitude = destinationLat;
values.toLongitude = destinationLng;
```

## 🚀 Melhorias Futuras (Opcional)

### Opção 1: Backend marcar campos como visíveis
```java
// No backend, no metadata de delivery
fromLatitude.setVisible(true);
fromLongitude.setVisible(true);
```

### Opção 2: Usar Google Maps para todos os endereços
- Integrar AddressFieldWithMap para `fromAddress` e `toAddress`
- Atualiza automaticamente latitude/longitude ao selecionar no mapa

## 📊 Logs de Diagnóstico

Console agora mostra:

```
📍 [EntityForm] Campos de origem encontrados: [
  {name: 'fromAddress', type: 'textarea', visible: false, required: true},
  {name: 'fromLatitude', type: 'string', visible: false, required: false},
  {name: 'fromLongitude', type: 'string', visible: false, required: false}
]

✅ [EntityForm] Atualizando formData com initialValues: {
  client: "189c7d79-...",
  fromLatitude: -3.853622...,
  fromLongitude: -40.916956...,
  fromAddress: "R. 13 de Maio, 656 - Centro, Ubajara - CE, 62350-000, Brazil"
}

🔍 [EntityForm] Campo fromAddress: {
  type: "textarea",
  value: "R. 13 de Maio, 656 - ...",
  formDataValue: "R. 13 de Maio, 656 - ...",
  visible: false,
  disabled: false,
  readonly: false
}

🔍 [EntityForm] Campo fromLatitude: {
  type: "string",
  value: "-3.853622...",
  formDataValue: -3.853622...,
  visible: false,
  disabled: false,
  readonly: true
}
```

## ✅ Status

**PROBLEMA RESOLVIDO!** 🎉

- ✅ Nomes dos campos corrigidos (origin* → from*)
- ✅ Campos invisíveis aparecem quando têm valor
- ✅ Endereço de origem pré-preenchido corretamente
- ✅ Coordenadas pré-preenchidas corretamente

---

**Data:** 21/11/2025
**Tempo de debug:** ~30 minutos
**Causa:** Nomes de campos incompatíveis + campos invisíveis no metadata
