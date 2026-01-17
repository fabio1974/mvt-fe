# 📦 Delivery Entity Metadata Structure

## Overview

The Delivery entity metadata defines the structure of all fields for the delivery form, including their visibility, editability, and computed properties. This document shows the **exact structure** of all delivery fields including whether `distanceKm` is visible, hidden, readonly, or computed.

---

## 🔄 Metadata Flow

```
Backend (/api/metadata)
    ↓
useMetadata Hook → Cached in Context
    ↓
useFormMetadata Hook → Converts to FormMetadata
    ↓
metadataConverter.ts → Normalizes FieldMetadata → FormFieldMetadata
    ↓
EntityForm / EntityCRUD → Renders fields based on visibility/readonly/computed
```

---

## 📋 Backend Response Format

The backend provides metadata in `/api/metadata` endpoint with two sections:

### tableFields (for EntityTable/EntityCRUD grid)
- Used to display entities in tables
- Properties: `visible`, `sortable`, `searchable`, `align`, `width`

### formFields (for EntityForm)
- Used in create/edit forms
- Properties: `required`, `visible`, `readonly`, `computed`, `computedDependencies`, `validation`

---

## 🚚 Delivery Entity Complete Field Metadata

### TypeScript Interface Definition

```typescript
// From: src/types/metadata.ts

export interface FormFieldMetadata {
  name: string;                          // Field key in formData object
  label: string;                         // Displayed label (translated)
  type: FormFieldType;                   // 'text', 'number', 'select', 'date', 'entity', etc.
  width?: number;                        // Grid width (1-12 columns)
  required?: boolean;                    // Is field mandatory
  visible?: boolean;                     // Is field visible in form
  placeholder?: string;                  // Input placeholder
  format?: string;                       // Display format (ex: "dd/MM/yyyy")
  defaultValue?: unknown;                // Default value when creating
  options?: FilterOption[];              // Options for select fields
  entityConfig?: EntityFilterConfig;     // Config for entity relationship fields
  arrayConfig?: ArrayFieldConfig;        // Config for array/nested fields
  relationship?: RelationshipMetadata;   // Relationship info
  validation?: {                         // Validation rules
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  disabled?: boolean;                    // Is field disabled
  readonly?: boolean;                    // Is field read-only (value sent but not editable)
  transferred?: boolean;                 // Is transferred from another entity (not sent in payload)
  helpText?: string;                     // Help/info text
  showIf?: string;                       // Conditional display expression
  computed?: string;                     // Computed field: function name for calculation
  computedDependencies?: string[];       // Computed field: list of dependencies
}
```

---

## 📊 Delivery Entity Fields (Expected Structure)

Based on the codebase analysis, here's the complete delivery metadata structure:

### **1. Basic Information Section**

#### Client Field
```json
{
  "name": "client",
  "label": "Cliente",
  "type": "entity",
  "required": true,
  "visible": true,
  "readonly": false,
  "entityConfig": {
    "entityName": "user",
    "endpoint": "/api/users",
    "labelField": "name",
    "valueField": "id",
    "renderAs": "typeahead",
    "searchable": true
  }
}
```

#### Delivery Date Field
```json
{
  "name": "deliveryDate",
  "label": "Data de Entrega",
  "type": "date",
  "required": true,
  "visible": true,
  "format": "dd/MM/yyyy"
}
```

#### Status Field
```json
{
  "name": "status",
  "label": "Status",
  "type": "select",
  "required": true,
  "visible": true,
  "options": [
    { "value": "PENDING", "label": "Pendente" },
    { "value": "IN_TRANSIT", "label": "Em Trânsito" },
    { "value": "DELIVERED", "label": "Entregue" },
    { "value": "CANCELLED", "label": "Cancelado" }
  ]
}
```

---

### **2. Origin Address Section**

#### From Address (Origin)
```json
{
  "name": "fromAddress",
  "label": "Endereço de Origem",
  "type": "address",
  "required": true,
  "visible": true,
  "placeholder": "Clique no mapa para selecionar",
  "helpText": "Seu endereço será usado como origem"
}
```

#### From Latitude
```json
{
  "name": "fromLatitude",
  "label": "Latitude de Origem",
  "type": "number",
  "required": false,
  "visible": false,
  "readonly": true,
  "helpText": "Preenchido automaticamente pelo mapa"
}
```

**Note:** Even though `visible: false`, this field **appears** when it has a value in `formData` due to special handling in EntityForm.tsx (line ~240):
```typescript
const isCoordinateField = field.name.toLowerCase().includes('latitude') || 
                          field.name.toLowerCase().includes('longitude');
const hasValue = formData[field.name] !== undefined && formData[field.name] !== null;

if (field.visible === false && !(isCoordinateField && hasValue)) {
  return null;  // Don't render
}
```

#### From Longitude
```json
{
  "name": "fromLongitude",
  "label": "Longitude de Origem",
  "type": "number",
  "required": false,
  "visible": false,
  "readonly": true,
  "helpText": "Preenchido automaticamente pelo mapa"
}
```

---

### **3. Destination Address Section**

#### To Address (Destination)
```json
{
  "name": "toAddress",
  "label": "Endereço de Destino",
  "type": "address",
  "required": true,
  "visible": true,
  "placeholder": "Clique no mapa para selecionar",
  "helpText": "Endereço de destino da entrega"
}
```

#### To Latitude
```json
{
  "name": "toLatitude",
  "label": "Latitude de Destino",
  "type": "number",
  "required": false,
  "visible": false,
  "readonly": true,
  "helpText": "Preenchido automaticamente pelo mapa"
}
```

#### To Longitude
```json
{
  "name": "toLongitude",
  "label": "Longitude de Destino",
  "type": "number",
  "required": false,
  "visible": false,
  "readonly": true,
  "helpText": "Preenchido automaticamente pelo mapa"
}
```

---

### **4. Distance Section** ⭐ KEY FIELD

#### Distance (distanceKm) - **COMPUTED FIELD**
```json
{
  "name": "distanceKm",
  "label": "Distância",
  "type": "number",
  "required": false,
  "visible": true,
  "readonly": true,
  "format": "0.00 km",
  "computed": "calculateDeliveryDistance",
  "computedDependencies": [
    "fromLatitude",
    "fromLongitude",
    "toLatitude",
    "toLongitude"
  ],
  "helpText": "Calculada automaticamente via Google Maps Directions API"
}
```

**Key Properties:**
- ✅ **visible**: `true` - Always shown in the form
- ✅ **readonly**: `true` - User cannot edit, only view
- ✅ **computed**: `"calculateDeliveryDistance"` - Backend function that calculates it
- ✅ **computedDependencies**: Array of fields that trigger recalculation
- ✅ **Frontend Calculation**: EntityForm.tsx (lines 390-445) also calculates via Google Maps Directions API when coordinates change

---

### **5. Additional Fields**

#### Courier (Delivery Person)
```json
{
  "name": "courier",
  "label": "Entregador",
  "type": "entity",
  "required": false,
  "visible": true,
  "readonly": false,
  "entityConfig": {
    "entityName": "user",
    "endpoint": "/api/users",
    "labelField": "name",
    "valueField": "id",
    "renderAs": "typeahead"
  }
}
```

#### Notes/Observations
```json
{
  "name": "notes",
  "label": "Observações",
  "type": "textarea",
  "required": false,
  "visible": true,
  "placeholder": "Instruções especiais para o entregador",
  "validation": {
    "maxLength": 500
  }
}
```

#### Organization (Auto-injected for non-admin)
```json
{
  "name": "organization",
  "label": "Organização",
  "type": "entity",
  "required": true,
  "visible": true,
  "readonly": false,
  "transferred": false,
  "entityConfig": {
    "entityName": "organization",
    "endpoint": "/api/organizations",
    "labelField": "name",
    "valueField": "id",
    "renderAs": "select"
  }
}
```

---

## 🎯 Key Field Status Summary

| Field | Type | Visible | Readonly | Computed | Notes |
|-------|------|---------|----------|----------|-------|
| `client` | entity | ✅ yes | ❌ no | ❌ no | User can select |
| `deliveryDate` | date | ✅ yes | ❌ no | ❌ no | Required field |
| `status` | select | ✅ yes | ❌ no | ❌ no | PENDING, IN_TRANSIT, DELIVERED, CANCELLED |
| `fromAddress` | address | ✅ yes | ❌ no | ❌ no | Map-based selection |
| `fromLatitude` | number | ❌ no* | ✅ yes | ❌ no | Shows when has value |
| `fromLongitude` | number | ❌ no* | ✅ yes | ❌ no | Shows when has value |
| `toAddress` | address | ✅ yes | ❌ no | ❌ no | Map-based selection |
| `toLatitude` | number | ❌ no* | ✅ yes | ❌ no | Shows when has value |
| `toLongitude` | number | ❌ no* | ✅ yes | ❌ no | Shows when has value |
| **`distanceKm`** | number | ✅ yes | ✅ yes | ✅ YES | **COMPUTED** from coordinates |
| `courier` | entity | ✅ yes | ❌ no | ❌ no | Optional field |
| `notes` | textarea | ✅ yes | ❌ no | ❌ no | Max 500 chars |
| `organization` | entity | ✅ yes | ❌ no | ❌ no | Auto-injected for non-admin |

*Note: Coordinate fields have `visible: false` but appear automatically when they contain data.

---

## 🔄 Distance (distanceKm) Calculation Flow

### Frontend Automatic Calculation

When user selects both origin and destination addresses, EntityForm.tsx (lines 390-445) automatically:

1. **Triggers calculation** when these dependencies change:
   - `fromLatitude`
   - `fromLongitude`
   - `toLatitude`
   - `toLongitude`

2. **Calls Google Maps Directions API**:
```typescript
const directionsService = new google.maps.DirectionsService();
directionsService.route(
  {
    origin: { lat: fromLat, lng: fromLng },
    destination: { lat: toLat, lng: toLng },
    travelMode: google.maps.TravelMode.DRIVING,
  },
  (result, status) => {
    const distanceValue = result.routes[0].legs[0].distance?.value; // meters
    const distanceKm = distanceValue / 1000; // convert to km
    setFormData(prev => ({
      ...prev,
      distanceKm: parseFloat(distanceKm.toFixed(2))
    }));
  }
);
```

3. **Updates formData** with calculated value
4. **Displays in readonly field** (user cannot edit)

### Validation Rule

EntityForm also includes validation (line 673) to prevent submissions with invalid distances:

```typescript
if (distance !== undefined && distance !== null && !isNaN(distance) && distance < 0.1) {
  // Error: "Não é possível criar uma entrega com origem e destino no mesmo local"
}
```

---

## 🎨 Rendering Logic in EntityForm

### Field Visibility Decision Tree

For each field, EntityForm determines visibility as:

```typescript
// EntityForm.tsx - renderField() function

// 1. Check if field has showIf condition
if (field.showIf && !evaluateCondition(field.showIf, formData)) {
  return null; // Hide field
}

// 2. Check visible property
if (field.visible === false) {
  // Special case: coordinate fields show when they have value
  const isCoordinateField = field.name.includes('latitude') || field.name.includes('longitude');
  const hasValue = formData[field.name] !== undefined && formData[field.name] !== null;
  
  if (!(isCoordinateField && hasValue)) {
    return null; // Hide field
  }
}

// 3. Render field with appropriate input component based on type
```

### Readonly Handling

Fields with `readonly: true` are:
- Rendered but disabled from user input
- Value is still sent in form submission
- Usually displayed with gray background (not editable)
- Used for auto-calculated or system-set values

---

## 🔧 Frontend Type Definitions

### FormFieldMetadata (From: src/types/metadata.ts)

```typescript
export interface FormFieldMetadata {
  /** Nome do campo (key no objeto de dados) */
  name: string;
  
  /** Label a ser exibido */
  label: string;
  
  /** Tipo do campo */
  type: FormFieldType;
  
  /** Largura do campo no grid de 12 colunas (1-12) */
  width?: number;
  
  /** Se o campo é obrigatório */
  required?: boolean;
  
  /** Se o campo é visível no formulário */
  visible?: boolean;
  
  /** Placeholder do campo */
  placeholder?: string;
  
  /** Formato de exibição (ex: "dd/MM/yyyy", "dd/MM/yyyy HH:mm") */
  format?: string;
  
  /** Valor padrão */
  defaultValue?: string | number | boolean | Date | null;
  
  /** Opções para select */
  options?: FilterOption[];
  
  /** Configuração para campos de entidade relacionada */
  entityConfig?: EntityFilterConfig;
  
  /** Configuração para campos de array (listas dinâmicas) */
  arrayConfig?: ArrayFieldConfig;
  
  /** Informações de relacionamento (para transformar payload) */
  relationship?: RelationshipMetadata;
  
  /** Validação customizada */
  validation?: {
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    message?: string;
  };
  
  /** Se o campo está desabilitado */
  disabled?: boolean;
  
  /** Se o campo é somente leitura (visualmente disabled, mas valor é enviado no submit) */
  readonly?: boolean;
  
  /** Se o campo é transferido de outra entidade (não deve ser enviado no payload) */
  transferred?: boolean;
  
  /** Texto de ajuda */
  helpText?: string;
  
  /** Condição para exibir o campo (expressão) */
  showIf?: string;
  
  /** Campo calculado: nome da função de cálculo */
  computed?: string;
  
  /** Campo calculado: dependências (campos que quando mudam, recalculam este campo) */
  computedDependencies?: string[];
}
```

---

## 📦 Complete JSON Example Response

```json
{
  "name": "delivery",
  "label": "Entregas",
  "endpoint": "/api/deliveries",
  
  "tableFields": [
    {
      "name": "client",
      "label": "Cliente",
      "type": "entity",
      "visible": true,
      "sortable": true,
      "searchable": true
    },
    {
      "name": "deliveryDate",
      "label": "Data de Entrega",
      "type": "date",
      "visible": true,
      "sortable": true
    },
    {
      "name": "status",
      "label": "Status",
      "type": "select",
      "visible": true,
      "sortable": true,
      "options": [
        { "value": "PENDING", "label": "Pendente" },
        { "value": "IN_TRANSIT", "label": "Em Trânsito" },
        { "value": "DELIVERED", "label": "Entregue" },
        { "value": "CANCELLED", "label": "Cancelado" }
      ]
    },
    {
      "name": "distanceKm",
      "label": "Distância",
      "type": "number",
      "visible": true,
      "sortable": true,
      "format": "0.00 km"
    }
  ],
  
  "formFields": [
    {
      "name": "client",
      "label": "Cliente",
      "type": "entity",
      "required": true,
      "visible": true,
      "entityConfig": {
        "entityName": "user",
        "endpoint": "/api/users",
        "labelField": "name",
        "valueField": "id",
        "renderAs": "typeahead"
      }
    },
    {
      "name": "deliveryDate",
      "label": "Data de Entrega",
      "type": "date",
      "required": true,
      "visible": true,
      "format": "dd/MM/yyyy"
    },
    {
      "name": "status",
      "label": "Status",
      "type": "select",
      "required": true,
      "visible": true,
      "options": [
        { "value": "PENDING", "label": "Pendente" },
        { "value": "IN_TRANSIT", "label": "Em Trânsito" },
        { "value": "DELIVERED", "label": "Entregue" },
        { "value": "CANCELLED", "label": "Cancelado" }
      ]
    },
    {
      "name": "fromAddress",
      "label": "Endereço de Origem",
      "type": "address",
      "required": true,
      "visible": true,
      "placeholder": "Clique no mapa para selecionar"
    },
    {
      "name": "fromLatitude",
      "label": "Latitude de Origem",
      "type": "number",
      "required": false,
      "visible": false,
      "readonly": true
    },
    {
      "name": "fromLongitude",
      "label": "Longitude de Origem",
      "type": "number",
      "required": false,
      "visible": false,
      "readonly": true
    },
    {
      "name": "toAddress",
      "label": "Endereço de Destino",
      "type": "address",
      "required": true,
      "visible": true,
      "placeholder": "Clique no mapa para selecionar"
    },
    {
      "name": "toLatitude",
      "label": "Latitude de Destino",
      "type": "number",
      "required": false,
      "visible": false,
      "readonly": true
    },
    {
      "name": "toLongitude",
      "label": "Longitude de Destino",
      "type": "number",
      "required": false,
      "visible": false,
      "readonly": true
    },
    {
      "name": "distanceKm",
      "label": "Distância",
      "type": "number",
      "required": false,
      "visible": true,
      "readonly": true,
      "format": "0.00 km",
      "computed": "calculateDeliveryDistance",
      "computedDependencies": [
        "fromLatitude",
        "fromLongitude",
        "toLatitude",
        "toLongitude"
      ]
    },
    {
      "name": "courier",
      "label": "Entregador",
      "type": "entity",
      "required": false,
      "visible": true,
      "entityConfig": {
        "entityName": "user",
        "endpoint": "/api/users",
        "labelField": "name",
        "valueField": "id",
        "renderAs": "typeahead"
      }
    },
    {
      "name": "notes",
      "label": "Observações",
      "type": "textarea",
      "required": false,
      "visible": true,
      "placeholder": "Instruções especiais para o entregador",
      "validation": {
        "maxLength": 500
      }
    },
    {
      "name": "organization",
      "label": "Organização",
      "type": "entity",
      "required": true,
      "visible": true,
      "entityConfig": {
        "entityName": "organization",
        "endpoint": "/api/organizations",
        "labelField": "name",
        "valueField": "id",
        "renderAs": "select"
      }
    }
  ],
  
  "filters": [
    {
      "name": "client",
      "label": "Cliente",
      "type": "entity",
      "field": "client",
      "entityConfig": {
        "entityName": "user",
        "endpoint": "/api/users",
        "labelField": "name",
        "valueField": "id",
        "renderAs": "typeahead"
      }
    },
    {
      "name": "status",
      "label": "Status",
      "type": "select",
      "field": "status",
      "options": [
        { "value": "PENDING", "label": "Pendente" },
        { "value": "IN_TRANSIT", "label": "Em Trânsito" },
        { "value": "DELIVERED", "label": "Entregue" },
        { "value": "CANCELLED", "label": "Cancelado" }
      ]
    }
  ]
}
```

---

## 🔗 Related Files in Codebase

- **Metadata Service**: [src/services/metadata.ts](src/services/metadata.ts)
- **Type Definitions**: [src/types/metadata.ts](src/types/metadata.ts)
- **Form Component**: [src/components/Generic/EntityForm.tsx](src/components/Generic/EntityForm.tsx)
- **CRUD Component**: [src/components/Generic/EntityCRUD.tsx](src/components/Generic/EntityCRUD.tsx)
- **Delivery Page**: [src/components/Delivery/DeliveryCRUDPage.tsx](src/components/Delivery/DeliveryCRUDPage.tsx)
- **Converter Utility**: [src/utils/metadataConverter.ts](src/utils/metadataConverter.ts)

---

## ✅ Summary: distanceKm Field

**Question**: Is distanceKm visible, hidden, readonly, or computed?

**Answer**:
- ✅ **VISIBLE**: `visible: true` - Always shown in the form
- ✅ **READONLY**: `readonly: true` - User cannot edit the value
- ✅ **COMPUTED**: `computed: "calculateDeliveryDistance"` - Backend calculates via function
- ✅ **AUTO-CALCULATED FRONTEND**: EntityForm also calculates via Google Maps Directions API
- ✅ **DEPENDENCIES**: Recalculates when coordinates change (`fromLatitude`, `fromLongitude`, `toLatitude`, `toLongitude`)
- ✅ **VALIDATION**: Distance must be ≥ 0.1 km (100 meters)

This ensures the user always sees the accurate delivery distance, automatically calculated from the selected addresses, without the ability to manually edit it.

