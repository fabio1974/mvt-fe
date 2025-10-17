# 🔧 Correção do Erro LazyInitializationException no Backend

## 🐛 Erro Atual

```
org.hibernate.LazyInitializationException: cannot simultaneously fetch multiple bags
```

**Endpoint:** `GET /api/registrations/my-registrations`  
**Status:** 500 Internal Server Error

## 📋 Causa do Problema

O Hibernate não consegue fazer fetch de múltiplas coleções `@OneToMany` simultaneamente quando ambas usam `fetch = FetchType.EAGER` ou `@Fetch(FetchMode.JOIN)`.

Provavelmente sua entidade `Registration` tem algo assim:

```java
@Entity
public class Registration {
    @Id
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)  // ← PROBLEMA
    private Event event;

    @ManyToOne(fetch = FetchType.EAGER)  // ← PROBLEMA
    private User user;

    // Dentro de Event:
    @OneToMany(mappedBy = "event", fetch = FetchType.EAGER)  // ← PROBLEMA
    private List<Registration> registrations;

    @OneToMany(mappedBy = "event", fetch = FetchType.EAGER)  // ← PROBLEMA
    private List<Category> categories;
}
```

## ✅ Solução 1: Usar LAZY Fetch (Recomendado)

### No Controller/Service

```java
@GetMapping("/my-registrations")
public ResponseEntity<List<RegistrationDTO>> getMyRegistrations() {
    String userEmail = SecurityContextHolder.getContext()
        .getAuthentication().getName();

    User user = userRepository.findByEmail(userEmail)
        .orElseThrow(() -> new RuntimeException("User not found"));

    // Buscar registrations com JOIN FETCH explícito
    List<Registration> registrations = registrationRepository
        .findByUserIdWithEvent(user.getId());

    // Converter para DTO para evitar lazy loading
    List<RegistrationDTO> dtos = registrations.stream()
        .map(this::convertToDTO)
        .collect(Collectors.toList());

    return ResponseEntity.ok(dtos);
}

private RegistrationDTO convertToDTO(Registration registration) {
    RegistrationDTO dto = new RegistrationDTO();
    dto.setId(registration.getId());
    dto.setStatus(registration.getStatus());
    dto.setRegistrationDate(registration.getRegistrationDate());

    // Criar EventDTO manualmente (não retorna coleções aninhadas)
    EventDTO eventDto = new EventDTO();
    eventDto.setId(registration.getEvent().getId());
    eventDto.setName(registration.getEvent().getName());
    eventDto.setDescription(registration.getEvent().getDescription());
    eventDto.setEventDate(registration.getEvent().getEventDate());
    eventDto.setLocation(registration.getEvent().getLocation());
    eventDto.setCity(registration.getEvent().getCity());
    eventDto.setState(registration.getEvent().getState());
    eventDto.setEventType(registration.getEvent().getEventType());
    eventDto.setStatus(registration.getEvent().getStatus());
    eventDto.setSlug(registration.getEvent().getSlug());
    // NÃO incluir: categories, registrations (evita loops e lazy loading)

    dto.setEvent(eventDto);
    return dto;
}
```

### No Repository

```java
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    @Query("SELECT r FROM Registration r " +
           "JOIN FETCH r.event e " +
           "WHERE r.user.id = :userId")
    List<Registration> findByUserIdWithEvent(@Param("userId") Long userId);
}
```

## ✅ Solução 2: Usar @EntityGraph (Alternativa)

```java
@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    @EntityGraph(attributePaths = {"event"})
    List<Registration> findByUserId(Long userId);
}
```

## ✅ Solução 3: Configurar FetchMode Corretamente

Se quiser manter EAGER fetch, use `FetchMode.SUBSELECT` ao invés de `JOIN`:

```java
@Entity
public class Event {
    @Id
    private Long id;

    @OneToMany(mappedBy = "event", fetch = FetchType.LAZY)  // ← LAZY é melhor
    @Fetch(FetchMode.SUBSELECT)  // Usa subquery ao invés de JOIN
    private List<Registration> registrations;

    @OneToMany(mappedBy = "event", fetch = FetchType.LAZY)
    @Fetch(FetchMode.SUBSELECT)
    private List<Category> categories;
}
```

## 🎯 Formato de Resposta Esperado pelo Frontend

```json
[
  {
    "id": 1,
    "status": "CONFIRMED",
    "registrationDate": "2025-10-15T10:30:00",
    "event": {
      "id": 5,
      "name": "Maratona de São Paulo 2025",
      "description": "Corrida de 42km pelas ruas de SP",
      "eventDate": "2025-11-20T07:00:00",
      "location": "Parque Ibirapuera",
      "city": "São Paulo",
      "state": "SP",
      "eventType": "MARATHON",
      "status": "ACTIVE",
      "slug": "maratona-sp-2025"
    }
  }
]
```

**⚠️ IMPORTANTE:**

- NÃO incluir `event.registrations` (evita loop infinito)
- NÃO incluir `event.categories` (não é necessário aqui)
- NÃO incluir `event.organization` (não é necessário aqui)

## 🔍 Checklist de Correção

- [ ] Mudar fetch de EAGER para LAZY nas entidades
- [ ] Criar query customizada com JOIN FETCH
- [ ] Criar DTO para evitar lazy loading
- [ ] Converter manualmente para DTO no service/controller
- [ ] Testar endpoint: `GET /api/registrations/my-registrations`
- [ ] Verificar que retorna array de registrations
- [ ] Verificar que cada registration tem event completo
- [ ] Verificar que NÃO retorna loops infinitos

## 🧪 Teste no Postman/Insomnia

```bash
GET http://localhost:8080/api/registrations/my-registrations
Authorization: Bearer {seu-token-jwt}
```

**Resposta esperada:** Status 200 com array de registrations

## 📝 Código Completo Exemplo

```java
// RegistrationController.java
@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {

    @Autowired
    private RegistrationService registrationService;

    @GetMapping("/my-registrations")
    public ResponseEntity<List<RegistrationDTO>> getMyRegistrations(
            @AuthenticationPrincipal UserDetails userDetails) {
        List<RegistrationDTO> registrations =
            registrationService.getRegistrationsByUserEmail(userDetails.getUsername());
        return ResponseEntity.ok(registrations);
    }
}

// RegistrationService.java
@Service
public class RegistrationService {

    @Autowired
    private RegistrationRepository registrationRepository;

    @Autowired
    private UserRepository userRepository;

    public List<RegistrationDTO> getRegistrationsByUserEmail(String email) {
        User user = userRepository.findByEmail(email)
            .orElseThrow(() -> new RuntimeException("User not found"));

        List<Registration> registrations =
            registrationRepository.findByUserIdWithEvent(user.getId());

        return registrations.stream()
            .map(this::toDTO)
            .collect(Collectors.toList());
    }

    private RegistrationDTO toDTO(Registration registration) {
        RegistrationDTO dto = new RegistrationDTO();
        dto.setId(registration.getId());
        dto.setStatus(registration.getStatus());
        dto.setRegistrationDate(registration.getRegistrationDate());

        // Event básico sem relacionamentos aninhados
        Event event = registration.getEvent();
        EventDTO eventDto = new EventDTO();
        eventDto.setId(event.getId());
        eventDto.setName(event.getName());
        eventDto.setDescription(event.getDescription());
        eventDto.setEventDate(event.getEventDate());
        eventDto.setLocation(event.getLocation());
        eventDto.setCity(event.getCity());
        eventDto.setState(event.getState());
        eventDto.setEventType(event.getEventType());
        eventDto.setStatus(event.getStatus());
        eventDto.setSlug(event.getSlug());

        dto.setEvent(eventDto);
        return dto;
    }
}

// RegistrationRepository.java
@Repository
public interface RegistrationRepository extends JpaRepository<Registration, Long> {

    @Query("SELECT r FROM Registration r " +
           "JOIN FETCH r.event " +
           "WHERE r.user.id = :userId")
    List<Registration> findByUserIdWithEvent(@Param("userId") Long userId);
}
```

## 🚀 Após Corrigir

1. Reinicie o backend
2. Teste o endpoint manualmente
3. Recarregue a página "Meus Eventos" no frontend
4. Clique na aba "Minhas Inscrições"
5. Deve aparecer suas inscrições ou mensagem "Nenhuma inscrição encontrada"

---

**Status do Frontend:** ✅ Já está preparado para receber os dados corretamente  
**Próximo passo:** Corrigir o backend conforme este guia
