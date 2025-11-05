# Backend - Formato de Resposta para Entidades Relacionadas

## 📋 **Contexto**

Atualmente, o backend retorna dados de entidades relacionadas em formato "achatado" (flat), o que dificulta a exibição no frontend.

### **Problema Atual:**

```json
{
  "content": [
    {
      "id": "6008534c-fe16-4d69-8bb7-d54745a3c980",
      "name": "Motoboy A",
      "cityId": 1068,
      "cityName": "Ubajara",
      "cityState": "Ceará",
      "organizationId": 6,
      "organizationName": "Moveltrack Sistemas"
    }
  ]
}
```

**Problemas:**
- ❌ Frontend precisa processar dados para exibir
- ❌ Lógica duplicada em múltiplas telas
- ❌ Inconsistência entre diferentes endpoints
- ❌ Campos `city` e `organization` não aparecem na tabela

---

## ✅ **Solução Recomendada**

### **Opção 1: Objetos Aninhados (Preferida)**

Retornar as entidades relacionadas como **objetos completos**:

```json
{
  "content": [
    {
      "id": "6008534c-fe16-4d69-8bb7-d54745a3c980",
      "username": "motoboyA@gmail.com",
      "name": "Motoboy A",
      "phone": "85997572919",
      "address": "Rua Joaquim Nabuco Pereira, 116",
      "city": {
        "id": 1068,
        "name": "Ubajara",
        "state": "Ceará",
        "stateCode": "CE"
      },
      "dateOfBirth": "2025-10-22",
      "gender": "MALE",
      "cpf": "111.222.333-96",
      "role": "COURIER",
      "organization": {
        "id": 6,
        "name": "Moveltrack Sistemas"
      }
    }
  ]
}
```

**Vantagens:**
- ✅ Formato padrão REST/JSON
- ✅ Frontend já suporta via `EntityForm` (converte objetos automaticamente)
- ✅ Fácil adicionar mais campos no futuro
- ✅ Semântica clara

**Implementação Spring Boot:**

```java
@Entity
public class User {
    @Id
    private UUID id;
    
    private String name;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "city_id")
    private City city;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id")
    private Organization organization;
    
    // ... outros campos
}

// DTO para resposta
public class UserListDTO {
    private UUID id;
    private String name;
    private CityDTO city;
    private OrganizationDTO organization;
    // ... outros campos
}

public class CityDTO {
    private Long id;
    private String name;
    private String state;
    private String stateCode;
}

public class OrganizationDTO {
    private Long id;
    private String name;
}
```

---

### **Opção 2: Campos Calculados (Mais Leve)**

Retornar strings formatadas no lugar das entidades:

```json
{
  "content": [
    {
      "id": "6008534c-fe16-4d69-8bb7-d54745a3c980",
      "name": "Motoboy A",
      "city": "Ubajara - Ceará",
      "organization": "Moveltrack Sistemas",
      "role": "COURIER",
      
      // IDs mantidos para edição
      "cityId": 1068,
      "organizationId": 6
    }
  ]
}
```

**Vantagens:**
- ✅ Payload mais leve (menos bytes)
- ✅ Backend controla formatação
- ✅ Frontend não precisa processar

**Desvantagens:**
- ⚠️ Menos flexível (se precisar de mais campos, precisa mudar o backend)
- ⚠️ Não segue padrão REST

**Implementação:**

```java
@Query("SELECT new com.example.UserListDTO(" +
       "u.id, u.name, " +
       "CONCAT(c.name, ' - ', c.state), " +
       "o.name, " +
       "u.cityId, u.organizationId) " +
       "FROM User u " +
       "LEFT JOIN u.city c " +
       "LEFT JOIN u.organization o")
Page<UserListDTO> findAllWithFormatted(Pageable pageable);
```

---

## 🎯 **Recomendação Final**

**Use a Opção 1 (Objetos Aninhados)** porque:

1. ✅ É o **padrão REST**
2. ✅ Frontend **já está preparado** (EntityForm converte automaticamente)
3. ✅ **Mais flexível** para mudanças futuras
4. ✅ **Type-safe** (frontend recebe tipos corretos)
5. ✅ **Fácil manutenção**

---

## 🔧 **Implementação Detalhada**

### **1. Criar DTOs:**

```java
// CityDTO.java
@Data
public class CityDTO {
    private Long id;
    private String name;
    private String state;
    private String stateCode;
    
    public static CityDTO fromEntity(City city) {
        if (city == null) return null;
        CityDTO dto = new CityDTO();
        dto.setId(city.getId());
        dto.setName(city.getName());
        dto.setState(city.getState());
        dto.setStateCode(city.getStateCode());
        return dto;
    }
}

// OrganizationDTO.java
@Data
public class OrganizationDTO {
    private Long id;
    private String name;
    
    public static OrganizationDTO fromEntity(Organization org) {
        if (org == null) return null;
        OrganizationDTO dto = new OrganizationDTO();
        dto.setId(org.getId());
        dto.setName(org.getName());
        return dto;
    }
}

// UserListDTO.java
@Data
public class UserListDTO {
    private UUID id;
    private String username;
    private String name;
    private String phone;
    private String address;
    private CityDTO city;
    private LocalDate dateOfBirth;
    private Gender gender;
    private String cpf;
    private String emergencyContact;
    private Role role;
    private OrganizationDTO organization;
    
    public static UserListDTO fromEntity(User user) {
        UserListDTO dto = new UserListDTO();
        dto.setId(user.getId());
        dto.setUsername(user.getUsername());
        dto.setName(user.getName());
        dto.setPhone(user.getPhone());
        dto.setAddress(user.getAddress());
        dto.setCity(CityDTO.fromEntity(user.getCity()));
        dto.setDateOfBirth(user.getDateOfBirth());
        dto.setGender(user.getGender());
        dto.setCpf(user.getCpf());
        dto.setEmergencyContact(user.getEmergencyContact());
        dto.setRole(user.getRole());
        dto.setOrganization(OrganizationDTO.fromEntity(user.getOrganization()));
        return dto;
    }
}
```

### **2. Atualizar Controller:**

```java
@RestController
@RequestMapping("/api/users")
public class UserController {
    
    @GetMapping
    public ResponseEntity<Page<UserListDTO>> findAll(
            @RequestParam(required = false) Role role,
            Pageable pageable) {
        
        Page<User> users = userService.findAll(role, pageable);
        Page<UserListDTO> dtos = users.map(UserListDTO::fromEntity);
        
        return ResponseEntity.ok(dtos);
    }
}
```

### **3. Garantir EAGER Loading:**

```java
@Entity
public class User {
    // ...
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "city_id")
    private City city;
    
    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "organization_id")
    private Organization organization;
    
    // ...
}
```

**Ou usar JOIN FETCH na query:**

```java
@Query("SELECT u FROM User u " +
       "LEFT JOIN FETCH u.city " +
       "LEFT JOIN FETCH u.organization " +
       "WHERE (:role IS NULL OR u.role = :role)")
Page<User> findAllWithRelations(@Param("role") Role role, Pageable pageable);
```

---

## 🧪 **Teste**

### **Request:**
```bash
GET /api/users?role=COURIER&page=0&size=10
```

### **Response Esperada:**
```json
{
  "content": [
    {
      "id": "6008534c-fe16-4d69-8bb7-d54745a3c980",
      "username": "motoboyA@gmail.com",
      "name": "Motoboy A",
      "phone": "85997572919",
      "address": "Rua Joaquim Nabuco Pereira, 116",
      "city": {
        "id": 1068,
        "name": "Ubajara",
        "state": "Ceará",
        "stateCode": "CE"
      },
      "dateOfBirth": "2025-10-22",
      "gender": "MALE",
      "cpf": "111.222.333-96",
      "emergencyContact": null,
      "role": "COURIER",
      "organization": {
        "id": 6,
        "name": "Moveltrack Sistemas"
      }
    }
  ],
  "pageable": { ... },
  "totalElements": 1,
  "totalPages": 1,
  ...
}
```

---

## ✅ **Checklist de Implementação**

- [ ] Criar DTOs para City, Organization
- [ ] Criar UserListDTO com objetos aninhados
- [ ] Atualizar UserController para usar DTOs
- [ ] Garantir EAGER loading ou JOIN FETCH
- [ ] Testar endpoint `/api/users?role=COURIER`
- [ ] Verificar que frontend exibe corretamente
- [ ] Aplicar mesmo padrão para outras entidades

---

## 📚 **Referências**

- [Spring Data JPA - DTO Projections](https://www.baeldung.com/spring-data-jpa-projections)
- [Jackson - Nested Objects](https://www.baeldung.com/jackson-nested-values)
- [REST API Best Practices](https://restfulapi.net/resource-naming/)
