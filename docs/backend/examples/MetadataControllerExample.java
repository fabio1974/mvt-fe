package com.mvt.controller;

import com.mvt.metadata.DisplayLabel;
import com.mvt.dto.metadata.*;
import org.springframework.web.bind.annotation.*;
import java.lang.reflect.Field;
import java.util.*;

/**
 * Trecho de código mostrando como detectar relacionamentos
 * e gerar EntityFilterConfig automaticamente
 */
@RestController
@RequestMapping("/api/metadata")
public class MetadataControllerExample {
    
    /**
     * Detecta se um filtro é de relacionamento e cria EntityFilterConfig
     * 
     * @param filterName Nome do filtro (ex: "eventId", "userId")
     * @param filterType Tipo do campo (Long, UUID, etc)
     * @return EntityFilterConfig se for relacionamento, null caso contrário
     */
    private EntityFilterConfig createEntityFilterConfig(String filterName, Class<?> filterType) {
        // Verifica se termina com "Id" (convenção para relacionamentos)
        if (!filterName.endsWith("Id")) {
            return null;
        }
        
        // Verifica se o tipo é numérico ou UUID (tipos de ID)
        if (!isIdType(filterType)) {
            return null;
        }
        
        // Remove "Id" do final para descobrir nome da entidade
        String entityName = filterName.substring(0, filterName.length() - 2);
        
        // Tenta encontrar a classe da entidade
        Class<?> entityClass = findEntityClass(entityName);
        if (entityClass == null) {
            System.out.println("⚠️  Entidade não encontrada para filtro: " + filterName);
            return null;
        }
        
        // Encontra o campo anotado com @DisplayLabel
        String labelField = findDisplayLabelField(entityClass);
        if (labelField == null) {
            labelField = "name"; // Fallback para "name"
            System.out.println("⚠️  @DisplayLabel não encontrado em " + entityClass.getSimpleName() + ", usando 'name'");
        }
        
        // Pluraliza o nome da entidade para endpoint
        String endpoint = "/api/" + pluralize(entityName);
        
        System.out.println("✅ Criando EntityFilterConfig para " + filterName + ":");
        System.out.println("   - Entity: " + entityName);
        System.out.println("   - Endpoint: " + endpoint);
        System.out.println("   - Label Field: " + labelField);
        
        return EntityFilterConfig.builder()
            .entityName(entityName)
            .endpoint(endpoint)
            .labelField(labelField)
            .valueField("id")
            .searchable(true)
            .searchPlaceholder("Buscar " + humanize(entityName) + "...")
            .build();
    }
    
    /**
     * Verifica se o tipo é um tipo de ID (Long, UUID, Integer)
     */
    private boolean isIdType(Class<?> type) {
        return type == Long.class || 
               type == Integer.class || 
               type.getName().equals("java.util.UUID");
    }
    
    /**
     * Encontra a classe da entidade baseado no nome
     * Ex: "event" -> Event.class
     */
    private Class<?> findEntityClass(String entityName) {
        try {
            // Capitaliza primeira letra
            String className = entityName.substring(0, 1).toUpperCase() + 
                             entityName.substring(1);
            
            // Tenta em alguns pacotes comuns
            String[] packages = {
                "com.mvt.model",
                "com.mvt.entity",
                "com.mvt.domain"
            };
            
            for (String pkg : packages) {
                try {
                    return Class.forName(pkg + "." + className);
                } catch (ClassNotFoundException e) {
                    // Tenta próximo pacote
                }
            }
            
            return null;
        } catch (Exception e) {
            return null;
        }
    }
    
    /**
     * Encontra o campo anotado com @DisplayLabel na entidade
     * 
     * @param entityClass Classe da entidade
     * @return Nome do campo ou null se não encontrado
     */
    private String findDisplayLabelField(Class<?> entityClass) {
        // Busca em campos declarados
        for (Field field : entityClass.getDeclaredFields()) {
            if (field.isAnnotationPresent(DisplayLabel.class)) {
                return field.getName();
            }
        }
        
        // Busca em campos herdados
        for (Field field : entityClass.getFields()) {
            if (field.isAnnotationPresent(DisplayLabel.class)) {
                return field.getName();
            }
        }
        
        return null;
    }
    
    /**
     * Pluraliza nome da entidade para endpoint
     * Simples: adiciona "s" no final
     */
    private String pluralize(String word) {
        // Regras simples de pluralização
        if (word.endsWith("y")) {
            return word.substring(0, word.length() - 1) + "ies";
        } else if (word.endsWith("s") || word.endsWith("x") || word.endsWith("z")) {
            return word + "es";
        } else {
            return word + "s";
        }
    }
    
    /**
     * Converte camelCase para "Human Readable"
     * Ex: "eventId" -> "Evento"
     */
    private String humanize(String camelCase) {
        String result = camelCase.replaceAll("([A-Z])", " $1");
        return result.substring(0, 1).toUpperCase() + result.substring(1).toLowerCase();
    }
    
    /**
     * Exemplo de criação de FilterMetadata com detecção automática
     */
    public FilterMetadata createFilterMetadata(String fieldName, Class<?> fieldType) {
        FilterMetadata filter = new FilterMetadata();
        filter.setName(fieldName);
        filter.setField(fieldName);
        filter.setLabel(humanize(fieldName));
        
        // DETECÇÃO AUTOMÁTICA DE TIPO
        if (fieldName.endsWith("Id")) {
            // É um relacionamento!
            filter.setType(FilterType.ENTITY);
            filter.setEntityConfig(createEntityFilterConfig(fieldName, fieldType));
        } else if (fieldType == String.class) {
            filter.setType(FilterType.TEXT);
            filter.setPlaceholder("Buscar por " + humanize(fieldName) + "...");
        } else if (Number.class.isAssignableFrom(fieldType)) {
            filter.setType(FilterType.NUMBER);
        } else if (fieldType == Boolean.class) {
            filter.setType(FilterType.BOOLEAN);
        }
        // ... outros tipos
        
        return filter;
    }
    
    /**
     * Exemplo completo: Cria metadata para Registration
     */
    public EntityMetadata createRegistrationMetadata() {
        EntityMetadata metadata = new EntityMetadata();
        metadata.setName("registration");
        metadata.setLabel("Inscrições");
        metadata.setEndpoint("/api/registrations");
        
        // Cria filtros
        List<FilterMetadata> filters = new ArrayList<>();
        
        // Filtro de status (enum)
        FilterMetadata statusFilter = new FilterMetadata();
        statusFilter.setName("status");
        statusFilter.setType(FilterType.SELECT);
        statusFilter.setOptions(Arrays.asList(
            new FilterOption("PENDING", "Pendente"),
            new FilterOption("ACTIVE", "Ativa"),
            new FilterOption("CANCELLED", "Cancelada")
        ));
        filters.add(statusFilter);
        
        // Filtro de evento (relacionamento - AUTOMÁTICO!)
        filters.add(createFilterMetadata("eventId", Long.class));
        // Resultado:
        // {
        //   name: "eventId",
        //   type: "ENTITY",
        //   entityConfig: {
        //     entityName: "event",
        //     endpoint: "/api/events",
        //     labelField: "name",
        //     valueField: "id"
        //   }
        // }
        
        // Filtro de usuário (relacionamento - AUTOMÁTICO!)
        filters.add(createFilterMetadata("userId", UUID.class));
        
        metadata.setFilters(filters);
        
        return metadata;
    }
}
