// Exemplo de controller para buscar cidades no backend
// Este arquivo deve ser implementado no seu backend

/*
 * @RestController
 * 
 * @RequestMapping("/api/cities")
 * public class CityController {
 * 
 * @Autowired
 * private CityService cityService;
 * 
 * @GetMapping("/search")
 * public ResponseEntity<List<CityDto>> searchCities(@RequestParam String q) {
 * // Buscar cidades que contenham o termo de pesquisa (case insensitive)
 * // Limitar a 10-20 resultados para performance
 * List<CityDto> cities = cityService.searchByName(q, 15);
 * return ResponseEntity.ok(cities);
 * }
 * }
 * 
 * // SQL para busca (exemplo):
 * SELECT id, name, state, state_code, ibge_code
 * FROM cities
 * WHERE LOWER(name) LIKE LOWER(CONCAT('%', :searchTerm, '%'))
 * ORDER BY
 * CASE WHEN LOWER(name) LIKE LOWER(CONCAT(:searchTerm, '%')) THEN 1 ELSE 2 END,
 * name ASC
 * LIMIT 15;
 * 
 * // DTO:
 * public class CityDto {
 * private Long id;
 * private String name;
 * private String state;
 * private String stateCode;
 * private String ibgeCode;
 * 
 * // getters and setters
 * }
 */