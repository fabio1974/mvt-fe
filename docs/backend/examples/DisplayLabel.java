package com.mvt.metadata;

import java.lang.annotation.*;

/**
 * Annotation para marcar o campo principal (label) de uma entidade
 * 
 * Este campo será usado para exibir a entidade em selects e dropdowns
 * quando ela aparece como relacionamento em outras entidades.
 * 
 * Exemplo:
 * <pre>
 * {@code
 * @Entity
 * public class Event {
 *     @Id
 *     private Long id;
 *     
 *     @DisplayLabel  // <- Este campo será usado como label
 *     private String name;
 *     
 *     private LocalDate eventDate;
 * }
 * }
 * </pre>
 * 
 * Com isso, quando Registration tiver um filtro "eventId", o sistema
 * automaticamente criará um select mostrando "name" ao invés de ID.
 * 
 * @author MVT Events Team
 * @since 1.0
 */
@Target(ElementType.FIELD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface DisplayLabel {
    /**
     * Indica se este campo é o label principal da entidade
     * @return true por padrão
     */
    boolean value() default true;
}
