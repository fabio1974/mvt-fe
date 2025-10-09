package com.mvt.dto.metadata;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Configuração para filtros de entidades relacionadas
 * 
 * Usado quando um filtro referencia outra entidade (ex: eventId, userId)
 * para que o frontend possa carregar e exibir as opções de forma legível.
 * 
 * Exemplo de uso:
 * <pre>
 * {@code
 * EntityFilterConfig config = EntityFilterConfig.builder()
 *     .entityName("event")
 *     .endpoint("/api/events")
 *     .labelField("name")
 *     .valueField("id")
 *     .searchable(true)
 *     .searchPlaceholder("Buscar evento...")
 *     .build();
 * }
 * </pre>
 * 
 * Isso fará o frontend renderizar:
 * - Um select com opções carregadas de GET /api/events
 * - Exibindo event.name como texto
 * - Enviando event.id como value
 */
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EntityFilterConfig {
    
    /**
     * Nome da entidade relacionada (ex: "event", "user")
     */
    private String entityName;
    
    /**
     * Endpoint para buscar as opções (ex: "/api/events")
     */
    private String endpoint;
    
    /**
     * Campo que contém o texto a ser exibido (ex: "name", "username")
     * Este campo deve estar anotado com @DisplayLabel na entidade
     */
    private String labelField;
    
    /**
     * Campo que contém o valor (geralmente "id")
     */
    private String valueField;
    
    /**
     * Se true, o frontend renderiza um campo de busca no select
     */
    private Boolean searchable;
    
    /**
     * Placeholder para o campo de busca
     */
    private String searchPlaceholder;
}
