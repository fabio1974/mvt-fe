# Estrutura de Pagination Esperada do Backend

## Interface TypeScript

```typescript
export interface PaginationConfig {
  defaultPageSize: number; // Tamanho padrão da página
  pageSizeOptions: number[]; // Opções de tamanhos de página
  showSizeSelector: boolean; // Se deve mostrar o seletor de tamanho
}
```

## Exemplo JSON - Backend Response

### ✅ Formato Correto

```json
{
  "name": "event",
  "label": "Eventos",
  "endpoint": "/api/events",
  "tableFields": [...],
  "formFields": [...],
  "filters": null,
  "pagination": {
    "defaultPageSize": 10,
    "pageSizeOptions": [5, 10, 20, 50, 100],
    "showSizeSelector": true
  }
}
```

### ❌ Formato Atual (Incorreto)

```json
{
  "name": "event",
  "label": "Eventos",
  "endpoint": "/api/events",
  "tableFields": [...],
  "formFields": [...],
  "filters": null,
  "pagination": null  // ← PROBLEMA: deveria ser um objeto
}
```

## Exemplo de Implementação - Backend Java

### EventMetadataController.java

```java
import com.example.metadata.dto.EntityMetadata;
import com.example.metadata.dto.PaginationConfig;

@RestController
@RequestMapping("/api/metadata")
public class EventMetadataController {

    @GetMapping("/event")
    public EntityMetadata getEventMetadata() {
        EntityMetadata metadata = new EntityMetadata();
        metadata.setName("event");
        metadata.setLabel("Eventos");
        metadata.setEndpoint("/api/events");

        // Configuração de paginação
        PaginationConfig pagination = new PaginationConfig();
        pagination.setDefaultPageSize(10);
        pagination.setPageSizeOptions(Arrays.asList(5, 10, 20, 50, 100));
        pagination.setShowSizeSelector(true);

        metadata.setPagination(pagination);

        // ... resto da configuração (tableFields, formFields, etc)

        return metadata;
    }
}
```

### PaginationConfig.java (DTO)

```java
package com.example.metadata.dto;

import java.util.List;

public class PaginationConfig {

    private Integer defaultPageSize;
    private List<Integer> pageSizeOptions;
    private Boolean showSizeSelector;

    // Construtor padrão
    public PaginationConfig() {
        this.defaultPageSize = 10;
        this.pageSizeOptions = Arrays.asList(5, 10, 20, 50, 100);
        this.showSizeSelector = true;
    }

    // Construtor com parâmetros
    public PaginationConfig(Integer defaultPageSize, List<Integer> pageSizeOptions, Boolean showSizeSelector) {
        this.defaultPageSize = defaultPageSize;
        this.pageSizeOptions = pageSizeOptions;
        this.showSizeSelector = showSizeSelector;
    }

    // Getters e Setters
    public Integer getDefaultPageSize() {
        return defaultPageSize;
    }

    public void setDefaultPageSize(Integer defaultPageSize) {
        this.defaultPageSize = defaultPageSize;
    }

    public List<Integer> getPageSizeOptions() {
        return pageSizeOptions;
    }

    public void setPageSizeOptions(List<Integer> pageSizeOptions) {
        this.pageSizeOptions = pageSizeOptions;
    }

    public Boolean getShowSizeSelector() {
        return showSizeSelector;
    }

    public void setShowSizeSelector(Boolean showSizeSelector) {
        this.showSizeSelector = showSizeSelector;
    }
}
```

## Descrição dos Campos

### `defaultPageSize` (número, obrigatório)

- **Descrição**: Quantidade padrão de itens por página
- **Valores comuns**: 10, 20, 25, 50
- **Exemplo**: `10` (mostra 10 registros por página inicialmente)

### `pageSizeOptions` (array de números, obrigatório)

- **Descrição**: Opções que o usuário pode escolher no dropdown "Itens por página"
- **Valores comuns**: `[5, 10, 20, 50, 100]`
- **Nota**: O `defaultPageSize` deve estar incluído neste array
- **Exemplo**: `[5, 10, 20, 50, 100]`

### `showSizeSelector` (booleano, obrigatório)

- **Descrição**: Se deve mostrar o seletor de tamanho de página na UI
- **Valores**: `true` | `false`
- **Exemplo**: `true` (mostra o dropdown "Itens por página")

## Casos de Uso

### Caso 1: Paginação Padrão (Recomendado)

```json
{
  "pagination": {
    "defaultPageSize": 10,
    "pageSizeOptions": [5, 10, 20, 50, 100],
    "showSizeSelector": true
  }
}
```

### Caso 2: Muitos Registros (Performance)

```json
{
  "pagination": {
    "defaultPageSize": 50,
    "pageSizeOptions": [25, 50, 100, 200],
    "showSizeSelector": true
  }
}
```

### Caso 3: Poucos Registros (Simplicidade)

```json
{
  "pagination": {
    "defaultPageSize": 20,
    "pageSizeOptions": [10, 20, 50],
    "showSizeSelector": false
  }
}
```

### Caso 4: Tabela Resumida

```json
{
  "pagination": {
    "defaultPageSize": 5,
    "pageSizeOptions": [5, 10, 15, 20],
    "showSizeSelector": true
  }
}
```

## Comportamento no Frontend

### Quando `pagination` é fornecido:

- Usa `defaultPageSize` como tamanho inicial da página
- Renderiza dropdown com opções de `pageSizeOptions`
- Mostra/oculta seletor baseado em `showSizeSelector`

### Quando `pagination` é `null` (Fallback):

```typescript
// Frontend usa valores padrão
defaultPageSize: 10;
pageSizeOptions: [5, 10, 20, 50, 100];
showSizeSelector: true(implícito);
```

## Validações Recomendadas (Backend)

```java
public void validate() {
    if (defaultPageSize == null || defaultPageSize <= 0) {
        throw new IllegalArgumentException("defaultPageSize deve ser maior que zero");
    }

    if (pageSizeOptions == null || pageSizeOptions.isEmpty()) {
        throw new IllegalArgumentException("pageSizeOptions não pode estar vazio");
    }

    if (!pageSizeOptions.contains(defaultPageSize)) {
        throw new IllegalArgumentException(
            "defaultPageSize (" + defaultPageSize + ") deve estar em pageSizeOptions"
        );
    }

    // Verifica se todos os valores são positivos
    for (Integer size : pageSizeOptions) {
        if (size == null || size <= 0) {
            throw new IllegalArgumentException("Todos os valores em pageSizeOptions devem ser maiores que zero");
        }
    }
}
```

## Exemplo Completo - EntityMetadata com Pagination

```json
{
  "name": "event",
  "label": "Eventos",
  "endpoint": "/api/events",
  "fields": null,
  "tableFields": [
    {
      "name": "name",
      "label": "Nome",
      "type": "string",
      "width": 200,
      "sortable": true,
      "visible": true
    }
  ],
  "formFields": [
    {
      "name": "name",
      "label": "Nome",
      "type": "string",
      "required": true
    }
  ],
  "filters": null,
  "pagination": {
    "defaultPageSize": 10,
    "pageSizeOptions": [5, 10, 20, 50, 100],
    "showSizeSelector": true
  }
}
```

## Migração: De `null` para Objeto `pagination`

### Passo 1: Criar DTO (se não existir)

```java
// Ver exemplo de PaginationConfig.java acima
```

### Passo 2: Atualizar EntityMetadata

```java
// ANTES
metadata.setPagination(null);

// DEPOIS
PaginationConfig pagination = new PaginationConfig();
pagination.setDefaultPageSize(10);
pagination.setPageSizeOptions(Arrays.asList(5, 10, 20, 50, 100));
pagination.setShowSizeSelector(true);
metadata.setPagination(pagination);
```

### Passo 3: Testar no Frontend

- Recarregue a página
- Verifique se o dropdown "Itens por página" aparece
- Teste mudança de tamanho de página

## Troubleshooting

### Erro: "Cannot read properties of null (reading 'pageSizeOptions')"

**Causa**: `pagination` está `null` no metadata

**Solução**: Backend deve enviar objeto `pagination` conforme documentado acima

### Dropdown não aparece

**Verificar**:

1. `pagination` não é `null`
2. `pageSizeOptions` tem valores
3. `showSizeSelector` é `true`

### Tamanho de página incorreto

**Verificar**:

1. `defaultPageSize` está setado corretamente
2. `defaultPageSize` está presente em `pageSizeOptions`

## Referências

- Tipo TypeScript: `src/types/metadata.ts` (linha 82-86)
- Uso no EntityTable: `src/components/Generic/EntityTable.tsx` (linha 102, 460)
- Documentação de Metadata: `docs/backend/METADATA_FORMAT_V2.md`
