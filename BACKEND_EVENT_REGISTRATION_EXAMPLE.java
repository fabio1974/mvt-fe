// Exemplo de implementação do backend para inscrições de eventos

/*
 * // Entity EventRegistration
 * 
 * @Entity
 * 
 * @Table(name = "event_registrations")
 * public class EventRegistration {
 * 
 * @Id
 * 
 * @GeneratedValue(strategy = GenerationType.IDENTITY)
 * private Long id;
 * 
 * @ManyToOne
 * 
 * @JoinColumn(name = "event_id", nullable = false)
 * private Event event;
 * 
 * @ManyToOne
 * 
 * @JoinColumn(name = "user_id", nullable = false)
 * private User user;
 * 
 * @Column(name = "birth_date")
 * private LocalDate birthDate;
 * 
 * @Column(name = "gender", length = 1)
 * private String gender;
 * 
 * @Column(name = "city")
 * private String city;
 * 
 * @Column(name = "state")
 * private String state;
 * 
 * @Column(name = "cpf")
 * private String cpf;
 * 
 * @Column(name = "phone")
 * private String phone;
 * 
 * @Column(name = "registration_date")
 * private LocalDateTime registrationDate;
 * 
 * @Column(name = "status")
 * 
 * @Enumerated(EnumType.STRING)
 * private RegistrationStatus status;
 * 
 * // getters and setters
 * }
 * 
 * // Controller
 * 
 * @RestController
 * 
 * @RequestMapping("/api/event-registrations")
 * public class EventRegistrationController {
 * 
 * @Autowired
 * private EventRegistrationService registrationService;
 * 
 * @PostMapping
 * public ResponseEntity<?> createRegistration(@RequestBody EventRegistrationDto
 * registrationDto) {
 * try {
 * // Verificar se usuário já está inscrito
 * if (registrationService.isUserRegistered(registrationDto.getEventId(),
 * registrationDto.getUserId())) {
 * return ResponseEntity.status(409).body("Usuário já inscrito neste evento");
 * }
 * 
 * // Verificar se evento ainda aceita inscrições
 * Event event = eventService.findById(registrationDto.getEventId());
 * if (event.getRegistrationEnd().isBefore(LocalDateTime.now())) {
 * return ResponseEntity.badRequest().body("Período de inscrições encerrado");
 * }
 * 
 * // Verificar se há vagas disponíveis
 * if (event.getMaxParticipants() != null) {
 * int currentRegistrations =
 * registrationService.countByEventId(registrationDto.getEventId());
 * if (currentRegistrations >= event.getMaxParticipants()) {
 * return ResponseEntity.badRequest().body("Evento lotado");
 * }
 * }
 * 
 * EventRegistration registration =
 * registrationService.createRegistration(registrationDto);
 * return ResponseEntity.ok(registration);
 * 
 * } catch (Exception e) {
 * return ResponseEntity.badRequest().body("Erro ao processar inscrição");
 * }
 * }
 * }
 * 
 * // DTO
 * public class EventRegistrationDto {
 * private Long eventId;
 * private Long userId;
 * private LocalDate birthDate;
 * private String gender;
 * private String city;
 * private String state;
 * private String cpf;
 * private String phone;
 * 
 * // getters and setters
 * }
 * 
 * // SQL para criar tabela
 * CREATE TABLE event_registrations (
 * id BIGSERIAL PRIMARY KEY,
 * event_id BIGINT NOT NULL REFERENCES events(id),
 * user_id BIGINT NOT NULL REFERENCES users(id),
 * birth_date DATE,
 * gender VARCHAR(1),
 * city VARCHAR(100),
 * state VARCHAR(50),
 * cpf VARCHAR(14),
 * phone VARCHAR(20),
 * registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
 * status VARCHAR(20) DEFAULT 'ACTIVE',
 * UNIQUE(event_id, user_id)
 * );
 */