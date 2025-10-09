package com.mvt.dto.metadata;

/**
 * Tipos de filtros suportados pelo sistema de metadata
 */
public enum FilterType {
    /**
     * Input de texto livre
     * Renderiza: <input type="text">
     */
    TEXT,
    
    /**
     * Select com opções fixas definidas em FilterMetadata.options
     * Renderiza: <select><option>...</option></select>
     */
    SELECT,
    
    /**
     * Input numérico
     * Renderiza: <input type="number">
     */
    NUMBER,
    
    /**
     * Date picker
     * Renderiza: <input type="date">
     */
    DATE,
    
    /**
     * Select booleano (Sim/Não, Ativo/Inativo)
     * Renderiza: <select><option>Sim/Não</option></select>
     */
    BOOLEAN,
    
    /**
     * Select com opções carregadas de outra entidade
     * Requer FilterMetadata.entityConfig
     * Renderiza: <EntitySelect> com carregamento dinâmico
     * 
     * Exemplo: Filtro "eventId" carrega lista de eventos e exibe seus nomes
     */
    ENTITY
}
