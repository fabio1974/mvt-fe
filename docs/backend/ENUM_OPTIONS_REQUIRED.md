# ✅ RESOLVIDO: Tradução de ENUMs nas Tabelas

## 🎉 Status: IMPLEMENTADO

O backend JÁ está enviando as options corretamente! O problema era no frontend que não aceitava o tipo `"select"`.

## 🔧 Correção Aplicada (Frontend)

O frontend agora aceita **ambos** os tipos:

- `type: "enum"`
- `type: "select"` ✅ (usado pelo backend atual)

### Código Corrigido:

```typescript
// EntityTable.tsx
case "enum":
case "select":  // ✅ ADICIONADO
  if (field.options && field.options.length > 0) {
    const option = field.options.find(opt => opt.value === String(value));
    return option ? option.label : String(value);
  }
  return String(value);
```

## ✅ Backend Está Correto

O backend já está enviando as traduções corretamente:

```json
{
  "name": "eventType",
  "type": "select",
  "options": [
    { "label": "Corrida", "value": "RUNNING" },
    { "label": "Ciclismo", "value": "CYCLING" },
    { "label": "Trail Running", "value": "TRAIL_RUNNING" },
    { "label": "Triatlo", "value": "TRIATHLON" }
  ]
}
```

**NÃO é necessário alterar nada no backend!** 🎊

## ✅ Solução (BACKEND)

### O que o Backend DEVE fazer:

Para **TODOS** os campos do tipo ENUM, o backend precisa incluir as `options` com as traduções tanto em `tableFields` quanto em `formFields`.

### Exemplo INCORRETO (atual):

```json
{
  "event": {
    "name": "event",
    "label": "Eventos",
    "endpoint": "/events",
    "tableFields": [
      {
        "name": "status",
        "label": "Status",
        "type": "enum",
        "visible": true,
        "sortable": true
        // ❌ FALTA O CAMPO OPTIONS!
      }
    ]
  }
}
```

### Exemplo CORRETO:

```json
{
  "event": {
    "name": "event",
    "label": "Eventos",
    "endpoint": "/events",
    "tableFields": [
      {
        "name": "status",
        "label": "Status",
        "type": "enum",
        "visible": true,
        "sortable": true,
        "options": [
          { "value": "DRAFT", "label": "Rascunho" },
          { "value": "PUBLISHED", "label": "Publicado" },
          { "value": "RUNNING", "label": "Em Andamento" },
          { "value": "FINISHED", "label": "Finalizado" }
        ]
      },
      {
        "name": "eventType",
        "label": "Tipo de Evento",
        "type": "enum",
        "visible": true,
        "sortable": true,
        "options": [
          { "value": "RUNNING", "label": "Corrida" },
          { "value": "TRAIL_RUNNING", "label": "Trail Running" },
          { "value": "CYCLING", "label": "Ciclismo" },
          { "value": "TRIATHLON", "label": "Triatlo" }
        ]
      }
    ],
    "formFields": [
      // Os mesmos campos devem ter options aqui também
      {
        "name": "status",
        "label": "Status",
        "type": "enum",
        "required": true,
        "options": [
          { "value": "DRAFT", "label": "Rascunho" },
          { "value": "PUBLISHED", "label": "Publicado" },
          { "value": "RUNNING", "label": "Em Andamento" },
          { "value": "FINISHED", "label": "Finalizado" }
        ]
      }
    ]
  }
}
```

## 💻 Código Java Sugerido

### 1. Criar Helper para Traduzir ENUMs

```java
public class EnumTranslator {

    public static List<FilterOption> translateEnum(Class<? extends Enum<?>> enumClass) {
        return Arrays.stream(enumClass.getEnumConstants())
            .map(e -> {
                String value = e.name();
                String label = translateEnumValue(e.name());
                return new FilterOption(value, label);
            })
            .collect(Collectors.toList());
    }

    private static String translateEnumValue(String enumValue) {
        // Mapeamento de traduções
        Map<String, String> translations = Map.ofEntries(
            // EventStatus
            entry("DRAFT", "Rascunho"),
            entry("PUBLISHED", "Publicado"),
            entry("RUNNING", "Em Andamento"),
            entry("FINISHED", "Finalizado"),
            entry("CANCELLED", "Cancelado"),

            // EventType
            entry("RUNNING", "Corrida"),
            entry("TRAIL_RUNNING", "Trail Running"),
            entry("CYCLING", "Ciclismo"),
            entry("TRIATHLON", "Triatlo"),
            entry("SWIMMING", "Natação"),
            entry("WALKING", "Caminhada"),
            entry("OTHER", "Outro")
        );

        return translations.getOrDefault(enumValue, enumValue);
    }
}
```

### 2. Usar no Metadata Builder

```java
// Para tableFields
FieldMetadata statusField = FieldMetadata.builder()
    .name("status")
    .label("Status")
    .type("enum")
    .visible(true)
    .sortable(true)
    .align("center")
    .options(EnumTranslator.translateEnum(EventStatus.class)) // ✅ ADICIONA OPTIONS
    .build();

// Para formFields
FormFieldMetadata statusFormField = FormFieldMetadata.builder()
    .name("status")
    .label("Status")
    .type("select")
    .required(true)
    .defaultValue("DRAFT")
    .options(EnumTranslator.translateEnum(EventStatus.class)) // ✅ ADICIONA OPTIONS
    .build();
```

### 3. Alternativa: Usar Annotations (Mais Elegante)

```java
public enum EventStatus {
    @DisplayName("Rascunho")
    DRAFT,

    @DisplayName("Publicado")
    PUBLISHED,

    @DisplayName("Em Andamento")
    RUNNING,

    @DisplayName("Finalizado")
    FINISHED
}

// Helper que lê a annotation
public static List<FilterOption> translateEnum(Class<? extends Enum<?>> enumClass) {
    return Arrays.stream(enumClass.getEnumConstants())
        .map(e -> {
            String value = e.name();
            String label = getDisplayName(e);
            return new FilterOption(value, label);
        })
        .collect(Collectors.toList());
}

private static String getDisplayName(Enum<?> enumValue) {
    try {
        Field field = enumValue.getClass().getField(enumValue.name());
        DisplayName annotation = field.getAnnotation(DisplayName.class);
        return annotation != null ? annotation.value() : enumValue.name();
    } catch (NoSuchFieldException e) {
        return enumValue.name();
    }
}
```

## 🎯 Checklist do Backend

- [ ] Criar helper `EnumTranslator` ou usar annotations
- [ ] Adicionar `options` em TODOS os campos ENUM de `tableFields`
- [ ] Adicionar `options` em TODOS os campos ENUM de `formFields`
- [ ] Adicionar `options` em TODOS os campos ENUM de `filters`
- [ ] Testar endpoint `/metadata` e verificar se options aparecem
- [ ] Verificar TODOS os ENUMs:
  - [ ] EventStatus
  - [ ] EventType
  - [ ] RegistrationStatus
  - [ ] PaymentStatus
  - [ ] Gender
  - [ ] Outros ENUMs da aplicação

## 🧪 Como Testar

1. Acesse `http://localhost:8080/api/metadata`
2. Procure por campos com `"type": "enum"`
3. Verifique se TODOS têm o campo `"options"` com array de `{value, label}`
4. Exemplo do que você DEVE ver:

```json
{
  "name": "status",
  "type": "enum",
  "options": [
    { "value": "DRAFT", "label": "Rascunho" },
    { "value": "PUBLISHED", "label": "Publicado" }
  ]
}
```

## ⚡ Frontend já está PRONTO

O código do frontend já está implementado e funcional:

```typescript
// EntityTable.tsx - linha 230
case "enum":
  if (field.options && field.options.length > 0) {
    const option = field.options.find(opt => opt.value === String(value));
    return option ? option.label : String(value);
  }
  return String(value);
```

Assim que o backend enviar as `options`, a tradução será automática! 🎉

## 📝 Documentos Relacionados

- `ENUM_TRANSLATION.md` - Documentação completa da solução frontend
- `docs/backend/BACKEND_ENUM_METADATA.md` - Se existir, atualize com essas informações
