# Backend: Como Enviar Metadata de Campos ENUM

## Problema Atual

O backend está enviando campos com `type: "enum"` mas **sem o array `options`**:

```json
{
  "name": "eventType",
  "label": "Esporte",
  "type": "enum",
  "required": null,
  "relationship": null
  // ❌ Falta: "options": [...]
}
```

Isso faz com que o frontend renderize um `<select>` vazio (sem opções).

## Solução

Quando o campo for do tipo `enum`, o backend deve incluir um array `options` com todos os valores possíveis.

### Estrutura do Campo Enum

```json
{
  "name": "eventType",
  "label": "Esporte",
  "type": "enum",
  "required": true,
  "placeholder": "Selecione o esporte",
  "options": [
    { "value": "RUNNING", "label": "Corrida" },
    { "value": "CYCLING", "label": "Ciclismo" },
    { "value": "TRIATHLON", "label": "Triathlon" },
    { "value": "SWIMMING", "label": "Natação" }
  ]
}
```

### Outro Exemplo: Status

```json
{
  "name": "status",
  "label": "Status",
  "type": "enum",
  "required": true,
  "options": [
    { "value": "DRAFT", "label": "Rascunho" },
    { "value": "PUBLISHED", "label": "Publicado" },
    { "value": "CANCELLED", "label": "Cancelado" },
    { "value": "FINISHED", "label": "Finalizado" }
  ]
}
```

## Implementação Java/Spring Boot

### 1. Criar Classe FilterOption (se não existir)

```java
package br.com.mvt.metadata;

public class FilterOption {
    private String value;
    private String label;

    public FilterOption() {}

    public FilterOption(String value, String label) {
        this.value = value;
        this.label = label;
    }

    // Getters e Setters
    public String getValue() { return value; }
    public void setValue(String value) { this.value = value; }

    public String getLabel() { return label; }
    public void setLabel(String label) { this.label = label; }
}
```

### 2. Adicionar Campo options na FieldMetadata

```java
public class FieldMetadata {
    private String name;
    private String label;
    private String type;
    // ... outros campos ...

    private List<FilterOption> options; // ✅ Adicionar este campo

    // Getters e Setters
    public List<FilterOption> getOptions() { return options; }
    public void setOptions(List<FilterOption> options) { this.options = options; }
}
```

### 3. Método Helper para Criar Enum Field

```java
public class EventMetadataProvider {

    /**
     * Cria um FieldMetadata para campo enum com suas opções
     */
    private FieldMetadata createEnumField(
        String name,
        String label,
        List<FilterOption> options,
        boolean required
    ) {
        FieldMetadata field = new FieldMetadata();
        field.setName(name);
        field.setLabel(label);
        field.setType("enum");
        field.setRequired(required);
        field.setOptions(options);
        field.setSortable(true);
        field.setSearchable(true);
        field.setVisible(true);
        field.setAlign("left");
        field.setWidth(120);
        return field;
    }

    /**
     * Converte um Java Enum em lista de FilterOption
     */
    private <E extends Enum<E>> List<FilterOption> enumToOptions(Class<E> enumClass) {
        return Arrays.stream(enumClass.getEnumConstants())
            .map(e -> new FilterOption(
                e.name(),                    // RUNNING
                formatEnumLabel(e.name())    // Corrida
            ))
            .collect(Collectors.toList());
    }

    /**
     * Formata o nome do enum para label legível
     * RUNNING -> Corrida
     * DRAFT_STATUS -> Rascunho
     */
    private String formatEnumLabel(String enumName) {
        // Aqui você pode implementar uma lógica de tradução
        // ou usar um mapa de traduções
        Map<String, String> translations = Map.of(
            "RUNNING", "Corrida",
            "CYCLING", "Ciclismo",
            "TRIATHLON", "Triathlon",
            "SWIMMING", "Natação",
            "DRAFT", "Rascunho",
            "PUBLISHED", "Publicado",
            "CANCELLED", "Cancelado",
            "FINISHED", "Finalizado"
        );

        return translations.getOrDefault(enumName, enumName);
    }
}
```

### 4. Exemplo Completo: EventType Enum

Supondo que você tenha um enum EventType:

```java
public enum EventType {
    RUNNING,
    CYCLING,
    TRIATHLON,
    SWIMMING,
    OBSTACLE_RACE,
    HIKING
}
```

No seu MetadataProvider:

```java
public EntityMetadata getEventMetadata() {
    EntityMetadata metadata = new EntityMetadata();
    metadata.setName("event");
    metadata.setLabel("Eventos");
    metadata.setEndpoint("/api/events");

    List<FieldMetadata> fields = new ArrayList<>();

    // Campo eventType com opções do enum
    List<FilterOption> eventTypeOptions = Arrays.asList(
        new FilterOption("RUNNING", "Corrida"),
        new FilterOption("CYCLING", "Ciclismo"),
        new FilterOption("TRIATHLON", "Triathlon"),
        new FilterOption("SWIMMING", "Natação"),
        new FilterOption("OBSTACLE_RACE", "Corrida de Obstáculos"),
        new FilterOption("HIKING", "Caminhada")
    );

    fields.add(createEnumField("eventType", "Esporte", eventTypeOptions, true));

    // Campo status com opções do enum
    List<FilterOption> statusOptions = Arrays.asList(
        new FilterOption("DRAFT", "Rascunho"),
        new FilterOption("PUBLISHED", "Publicado"),
        new FilterOption("CANCELLED", "Cancelado"),
        new FilterOption("FINISHED", "Finalizado")
    );

    fields.add(createEnumField("status", "Status", statusOptions, true));

    metadata.setFields(fields);
    return metadata;
}
```

### 5. Alternativa: Usando Reflexão para Enums

Se você quiser automatizar a conversão de qualquer enum:

```java
/**
 * Converte automaticamente um Enum Java em options
 */
private <E extends Enum<E>> List<FilterOption> autoConvertEnum(Class<E> enumClass) {
    return Arrays.stream(enumClass.getEnumConstants())
        .map(e -> {
            String value = e.name();
            String label = translateEnum(enumClass, e.name());
            return new FilterOption(value, label);
        })
        .collect(Collectors.toList());
}

/**
 * Busca tradução em arquivo de mensagens (messages.properties)
 */
private String translateEnum(Class<?> enumClass, String enumValue) {
    String key = enumClass.getSimpleName() + "." + enumValue;
    try {
        return messageSource.getMessage(key, null, LocaleContextHolder.getLocale());
    } catch (NoSuchMessageException e) {
        // Fallback: formata o nome
        return enumValue.replace("_", " ")
            .toLowerCase()
            .replaceAll("\\b\\w", m -> m.group().toUpperCase());
    }
}
```

Arquivo `messages_pt_BR.properties`:

```properties
EventType.RUNNING=Corrida
EventType.CYCLING=Ciclismo
EventType.TRIATHLON=Triathlon
EventType.SWIMMING=Natação
EventType.OBSTACLE_RACE=Corrida de Obstáculos
EventType.HIKING=Caminhada

EventStatus.DRAFT=Rascunho
EventStatus.PUBLISHED=Publicado
EventStatus.CANCELLED=Cancelado
EventStatus.FINISHED=Finalizado
```

## JSON Final Esperado

Após a implementação, o endpoint `/api/metadata?entity=event` deve retornar:

```json
{
  "name": "event",
  "label": "Eventos",
  "endpoint": "/api/events",
  "fields": [
    {
      "name": "eventType",
      "label": "Esporte",
      "type": "enum",
      "required": true,
      "placeholder": "Selecione o esporte",
      "options": [
        { "value": "RUNNING", "label": "Corrida" },
        { "value": "CYCLING", "label": "Ciclismo" },
        { "value": "TRIATHLON", "label": "Triathlon" },
        { "value": "SWIMMING", "label": "Natação" }
      ]
    },
    {
      "name": "status",
      "label": "Status",
      "type": "enum",
      "required": true,
      "options": [
        { "value": "DRAFT", "label": "Rascunho" },
        { "value": "PUBLISHED", "label": "Publicado" },
        { "value": "CANCELLED", "label": "Cancelado" },
        { "value": "FINISHED", "label": "Finalizado" }
      ]
    }
  ]
}
```

## Nota Importante

O mesmo vale para campos enum dentro de **relationships**!

No exemplo que você mostrou, o campo `gender` dentro de `categories.relationship.fields` também é um enum e precisa de `options`:

```json
{
  "name": "gender",
  "label": "Gênero",
  "type": "select", // ou "enum"
  "required": false,
  "placeholder": "Selecione o gênero",
  "options": [
    { "value": "MALE", "label": "Masculino" },
    { "value": "FEMALE", "label": "Feminino" },
    { "value": "MIXED", "label": "Misto" }
  ]
}
```

## Checklist

- [ ] Classe `FilterOption` criada
- [ ] Campo `options` adicionado em `FieldMetadata`
- [ ] Método `createEnumField()` implementado
- [ ] Opções de `eventType` adicionadas
- [ ] Opções de `status` adicionadas
- [ ] Opções de `gender` (em eventCategory) adicionadas
- [ ] Testar endpoint `/api/metadata?entity=event`
- [ ] Verificar se JSON retorna array `options` para campos enum
