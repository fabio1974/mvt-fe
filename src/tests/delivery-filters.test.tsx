import { describe, it, expect } from "vitest";

/**
 * Testes de integração dos filtros de Delivery.
 *
 * Valida:
 * - Quais filtros cada role vê (CLIENT, CUSTOMER, ORGANIZER, ADMIN, COURIER)
 * - Opções de status por role (WAITING_PAYMENT oculto para CLIENT/CUSTOMER)
 * - Parâmetros de query enviados ao BE
 * - hideFields funciona por field E por name
 */

// ============================================================
// DADOS: metadata de filtros do delivery (espelho do BE)
// ============================================================

interface FilterOption {
  label: string;
  value: string;
}

interface FilterMeta {
  name: string;
  field: string;
  label: string;
  type: string;
  options?: FilterOption[];
  entityConfig?: { entityName: string };
}

const DELIVERY_FILTERS: FilterMeta[] = [
  { name: "client", field: "client.id", label: "Cliente", type: "entity", entityConfig: { entityName: "user" } },
  { name: "organizer", field: "organizer.id", label: "Gerente", type: "entity", entityConfig: { entityName: "user" } },
  { name: "status", field: "status", label: "Status", type: "select", options: [
    { label: "Pendente", value: "PENDING" },
    { label: "Waiting_payment", value: "WAITING_PAYMENT" },
    { label: "Aceita", value: "ACCEPTED" },
    { label: "Em Trânsito", value: "IN_TRANSIT" },
    { label: "Concluída", value: "COMPLETED" },
    { label: "Cancelado", value: "CANCELLED" },
  ]},
  { name: "deliveryType", field: "deliveryType", label: "Tipo", type: "select", options: [
    { label: "Entrega", value: "DELIVERY" },
    { label: "Corrida", value: "RIDE" },
  ]},
  { name: "preferredVehicleType", field: "preferredVehicleType", label: "Preferência de Veículo", type: "select", options: [
    { label: "Moto", value: "MOTORCYCLE" },
    { label: "Carro", value: "CAR" },
    { label: "Qualquer", value: "ANY" },
  ]},
  { name: "paymentCaptured", field: "paymentCaptured", label: "Pagamento Capturado", type: "boolean" },
  { name: "courier", field: "courier.id", label: "Motorista", type: "entity", entityConfig: { entityName: "user" } },
  { name: "vehicle", field: "vehicle.id", label: "Veículo", type: "entity", entityConfig: { entityName: "vehicle" } },
  { name: "estimatedDistanceKm", field: "estimatedDistanceKm", label: "Distância Est.", type: "number" },
  { name: "estimatedShippingFee", field: "estimatedShippingFee", label: "Frete Est.", type: "number" },
];

// ============================================================
// LÓGICA: replica as regras do DeliveryCRUDPage + EntityTable
// ============================================================

type Role = "ROLE_CLIENT" | "CLIENT" | "ROLE_CUSTOMER" | "CUSTOMER" | "ROLE_ORGANIZER" | "ROLE_ADMIN" | "ROLE_COURIER";

function isClient(role: Role): boolean {
  return role === "ROLE_CLIENT" || role === "CLIENT" || role === "ROLE_CUSTOMER" || role === "CUSTOMER";
}

function isOrganizer(role: Role): boolean {
  return role === "ROLE_ORGANIZER";
}

function isCourier(role: Role): boolean {
  return role === "ROLE_COURIER";
}

/** Campos ocultos na tabela (incluindo filtros) por role — mesma lógica do DeliveryCRUDPage */
function getHideFields(role: Role): string[] {
  return isClient(role) ? ["client", "deliveryType"] : isOrganizer(role) ? ["organizer"] : [];
}

/** Campos ocultos fixos (tableHideFields) — sempre ocultos */
const TABLE_HIDE_FIELDS = [
  "actualRoute", "approachRoute", "plannedRoute",
  "estimatedDistanceKm", "estimatedShippingFee",
  "fromLatitude", "fromLongitude", "toLatitude", "toLongitude",
  "paymentCaptured", "inTransitAt",
];

/** Combina hideFields + tableHideFields — mesma lógica do EntityCRUD */
function getAllHideFields(role: Role): string[] {
  return [...getHideFields(role), ...TABLE_HIDE_FIELDS];
}

/** Opções de status excluídas por role */
function getExcludeFilterOptions(role: Role): Record<string, string[]> {
  return isClient(role) ? { status: ["WAITING_PAYMENT"] } : {};
}

/** Filtra os filters do metadata — mesma lógica do EntityTable (f.field OU f.name) */
function getVisibleFilters(role: Role): FilterMeta[] {
  const hideFields = getAllHideFields(role);
  return DELIVERY_FILTERS.filter(
    (f) => !hideFields.includes(f.field) && !hideFields.includes(f.name)
  );
}

/** Retorna as opções visíveis de um filtro select, aplicando excludeOptions */
function getVisibleOptions(role: Role, filterName: string): FilterOption[] {
  const filter = DELIVERY_FILTERS.find((f) => f.name === filterName);
  if (!filter?.options) return [];
  const excluded = getExcludeFilterOptions(role)[filterName] || [];
  return filter.options.filter((o) => !excluded.includes(o.value));
}

/** initialFilters por role — mesma lógica do DeliveryCRUDPage */
function getInitialFilters(role: Role, userId: string): Record<string, string> {
  if (role === "ROLE_CLIENT" || role === "CLIENT") {
    return { client: userId, deliveryType: "DELIVERY" };
  }
  if (role === "ROLE_CUSTOMER" || role === "CUSTOMER") {
    return { client: userId };
  }
  if (role === "ROLE_ORGANIZER") {
    return { organizer: userId };
  }
  return {};
}

/** Simula a construção de query params (mesma lógica do EntityTable.fetchData) */
function buildQueryParams(
  filters: Record<string, string>,
  page = 0,
  size = 10
): URLSearchParams {
  const params = new URLSearchParams({
    page: String(page),
    size: String(size),
    ...Object.entries(filters).reduce((acc, [key, value]) => {
      if (value) acc[key] = value;
      return acc;
    }, {} as Record<string, string>),
  });
  return params;
}

// ============================================================
// TESTES: CLIENT
// ============================================================

describe("Filtros Delivery — CLIENT", () => {
  const role: Role = "ROLE_CLIENT";
  const userId = "uuid-client-123";

  it("NÃO vê filtro de Cliente (tenant resolve no BE)", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).not.toContain("client");
  });

  it("NÃO vê filtro de Tipo de Entrega (deliveryType)", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).not.toContain("deliveryType");
  });

  it("NÃO vê filtros de estimativa (distância e frete)", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).not.toContain("estimatedDistanceKm");
    expect(names).not.toContain("estimatedShippingFee");
  });

  it("NÃO vê filtro de pagamento capturado", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).not.toContain("paymentCaptured");
  });

  it("VÊ filtros: Gerente, Status, Pref. Veículo, Motorista, Veículo", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).toContain("organizer");
    expect(names).toContain("status");
    expect(names).toContain("preferredVehicleType");
    expect(names).toContain("courier");
    expect(names).toContain("vehicle");
  });

  it("filtro de Status NÃO mostra WAITING_PAYMENT", () => {
    const options = getVisibleOptions(role, "status");
    const values = options.map((o) => o.value);
    expect(values).not.toContain("WAITING_PAYMENT");
  });

  it("filtro de Status mostra: PENDING, ACCEPTED, IN_TRANSIT, COMPLETED, CANCELLED", () => {
    const options = getVisibleOptions(role, "status");
    const values = options.map((o) => o.value);
    expect(values).toContain("PENDING");
    expect(values).toContain("ACCEPTED");
    expect(values).toContain("IN_TRANSIT");
    expect(values).toContain("COMPLETED");
    expect(values).toContain("CANCELLED");
    expect(values).toHaveLength(5);
  });

  it("filtro de Pref. Veículo mostra: MOTORCYCLE, CAR, ANY", () => {
    const options = getVisibleOptions(role, "preferredVehicleType");
    const values = options.map((o) => o.value);
    expect(values).toEqual(expect.arrayContaining(["MOTORCYCLE", "CAR", "ANY"]));
    expect(values).toHaveLength(3);
  });

  it("initialFilters envia client=userId e deliveryType=DELIVERY", () => {
    const filters = getInitialFilters(role, userId);
    expect(filters.client).toBe(userId);
    expect(filters.deliveryType).toBe("DELIVERY");
  });

  it("query params incluem client e deliveryType mesmo ocultos do filtro visual", () => {
    const filters = getInitialFilters(role, userId);
    const params = buildQueryParams(filters);
    expect(params.get("client")).toBe(userId);
    expect(params.get("deliveryType")).toBe("DELIVERY");
    expect(params.get("page")).toBe("0");
    expect(params.get("size")).toBe("10");
  });

  it("total de filtros visíveis para CLIENT é 5", () => {
    const visible = getVisibleFilters(role);
    expect(visible).toHaveLength(5);
  });
});

// ============================================================
// TESTES: CUSTOMER
// ============================================================

describe("Filtros Delivery — CUSTOMER", () => {
  const role: Role = "ROLE_CUSTOMER";
  const userId = "uuid-customer-456";

  it("NÃO vê filtro de Cliente (mesmo comportamento que CLIENT)", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).not.toContain("client");
  });

  it("NÃO vê filtro de Tipo de Entrega", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).not.toContain("deliveryType");
  });

  it("filtro de Status NÃO mostra WAITING_PAYMENT", () => {
    const options = getVisibleOptions(role, "status");
    const values = options.map((o) => o.value);
    expect(values).not.toContain("WAITING_PAYMENT");
    expect(values).toHaveLength(5);
  });

  it("initialFilters envia apenas client=userId (sem deliveryType)", () => {
    const filters = getInitialFilters(role, userId);
    expect(filters.client).toBe(userId);
    expect(filters.deliveryType).toBeUndefined();
  });

  it("filtros visíveis iguais ao CLIENT", () => {
    const clientFilters = getVisibleFilters("ROLE_CLIENT").map((f) => f.name).sort();
    const customerFilters = getVisibleFilters(role).map((f) => f.name).sort();
    expect(customerFilters).toEqual(clientFilters);
  });
});

// ============================================================
// TESTES: ORGANIZER
// ============================================================

describe("Filtros Delivery — ORGANIZER", () => {
  const role: Role = "ROLE_ORGANIZER";
  const userId = "uuid-organizer-789";

  it("NÃO vê filtro de Gerente (é o próprio)", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).not.toContain("organizer");
  });

  it("VÊ filtro de Cliente", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).toContain("client");
  });

  it("VÊ filtro de Status COM WAITING_PAYMENT", () => {
    const options = getVisibleOptions(role, "status");
    const values = options.map((o) => o.value);
    expect(values).toContain("WAITING_PAYMENT");
    expect(values).toHaveLength(6);
  });

  it("initialFilters envia organizer=userId", () => {
    const filters = getInitialFilters(role, userId);
    expect(filters.organizer).toBe(userId);
    expect(filters.client).toBeUndefined();
  });
});

// ============================================================
// TESTES: ADMIN
// ============================================================

describe("Filtros Delivery — ADMIN", () => {
  const role: Role = "ROLE_ADMIN";

  it("VÊ todos os filtros não ocultos por tableHideFields", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).toContain("client");
    expect(names).toContain("organizer");
    expect(names).toContain("status");
    expect(names).toContain("deliveryType");
    expect(names).toContain("preferredVehicleType");
    expect(names).toContain("courier");
    expect(names).toContain("vehicle");
  });

  it("NÃO vê filtros de estimativa (ocultos por tableHideFields)", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).not.toContain("estimatedDistanceKm");
    expect(names).not.toContain("estimatedShippingFee");
  });

  it("VÊ filtro de Status COM WAITING_PAYMENT (todos os 6 status)", () => {
    const options = getVisibleOptions(role, "status");
    const values = options.map((o) => o.value);
    expect(values).toContain("WAITING_PAYMENT");
    expect(values).toHaveLength(6);
  });

  it("initialFilters é vazio (vê tudo)", () => {
    const filters = getInitialFilters(role, "uuid-admin");
    expect(Object.keys(filters)).toHaveLength(0);
  });

  it("total de filtros visíveis para ADMIN é 7", () => {
    const visible = getVisibleFilters(role);
    // client, organizer, status, deliveryType, preferredVehicleType, courier, vehicle
    expect(visible).toHaveLength(7);
  });
});

// ============================================================
// TESTES: COURIER
// ============================================================

describe("Filtros Delivery — COURIER", () => {
  const role: Role = "ROLE_COURIER";

  it("VÊ filtros básicos (não tem hideFields específico)", () => {
    const visible = getVisibleFilters(role);
    const names = visible.map((f) => f.name);
    expect(names).toContain("status");
    expect(names).toContain("client");
  });

  it("VÊ WAITING_PAYMENT no filtro de status", () => {
    const options = getVisibleOptions(role, "status");
    const values = options.map((o) => o.value);
    expect(values).toContain("WAITING_PAYMENT");
  });

  it("initialFilters é vazio (BE filtra pelo token)", () => {
    const filters = getInitialFilters(role, "uuid-courier");
    expect(Object.keys(filters)).toHaveLength(0);
  });
});

// ============================================================
// TESTES: hideFields funciona por name E field
// ============================================================

describe("hideFields — match por name E field", () => {
  it("hideFields=['client'] oculta filtro com field='client.id'", () => {
    const hideFields = ["client"];
    const visible = DELIVERY_FILTERS.filter(
      (f) => !hideFields.includes(f.field) && !hideFields.includes(f.name)
    );
    expect(visible.find((f) => f.name === "client")).toBeUndefined();
  });

  it("hideFields=['client.id'] também oculta filtro client", () => {
    const hideFields = ["client.id"];
    const visible = DELIVERY_FILTERS.filter(
      (f) => !hideFields.includes(f.field) && !hideFields.includes(f.name)
    );
    expect(visible.find((f) => f.name === "client")).toBeUndefined();
  });

  it("hideFields=['organizer'] oculta filtro com field='organizer.id'", () => {
    const hideFields = ["organizer"];
    const visible = DELIVERY_FILTERS.filter(
      (f) => !hideFields.includes(f.field) && !hideFields.includes(f.name)
    );
    expect(visible.find((f) => f.name === "organizer")).toBeUndefined();
  });

  it("hideFields=['status'] oculta filtro com field='status' (match direto)", () => {
    const hideFields = ["status"];
    const visible = DELIVERY_FILTERS.filter(
      (f) => !hideFields.includes(f.field) && !hideFields.includes(f.name)
    );
    expect(visible.find((f) => f.name === "status")).toBeUndefined();
  });

  it("filtro não listado em hideFields permanece visível", () => {
    const hideFields = ["client"];
    const visible = DELIVERY_FILTERS.filter(
      (f) => !hideFields.includes(f.field) && !hideFields.includes(f.name)
    );
    expect(visible.find((f) => f.name === "status")).toBeDefined();
    expect(visible.find((f) => f.name === "courier")).toBeDefined();
  });
});

// ============================================================
// TESTES: excludeFilterOptions
// ============================================================

describe("excludeFilterOptions — filtragem de opções select", () => {
  it("excluir WAITING_PAYMENT remove apenas essa opção", () => {
    const exclude: Record<string, string[]> = { status: ["WAITING_PAYMENT"] };
    const statusFilter = DELIVERY_FILTERS.find((f) => f.name === "status")!;
    const filtered = statusFilter.options!.filter(
      (o) => !(exclude["status"]?.includes(o.value))
    );
    expect(filtered).toHaveLength(5);
    expect(filtered.map((o) => o.value)).not.toContain("WAITING_PAYMENT");
  });

  it("excluir múltiplas opções funciona", () => {
    const exclude: Record<string, string[]> = { status: ["WAITING_PAYMENT", "CANCELLED"] };
    const statusFilter = DELIVERY_FILTERS.find((f) => f.name === "status")!;
    const filtered = statusFilter.options!.filter(
      (o) => !(exclude["status"]?.includes(o.value))
    );
    expect(filtered).toHaveLength(4);
    expect(filtered.map((o) => o.value)).not.toContain("WAITING_PAYMENT");
    expect(filtered.map((o) => o.value)).not.toContain("CANCELLED");
  });

  it("excludeOptions vazio não remove nada", () => {
    const exclude: Record<string, string[]> = {};
    const statusFilter = DELIVERY_FILTERS.find((f) => f.name === "status")!;
    const filtered = statusFilter.options!.filter(
      (o) => !(exclude["status"]?.includes(o.value))
    );
    expect(filtered).toHaveLength(6);
  });

  it("excludeOptions em campo inexistente não afeta nada", () => {
    const exclude: Record<string, string[]> = { foobar: ["X"] };
    const statusFilter = DELIVERY_FILTERS.find((f) => f.name === "status")!;
    const filtered = statusFilter.options!.filter(
      (o) => !(exclude["status"]?.includes(o.value))
    );
    expect(filtered).toHaveLength(6);
  });
});

// ============================================================
// TESTES: query params construídos corretamente
// ============================================================

describe("Query params — construção correta", () => {
  it("CLIENT envia client + deliveryType como params fixos", () => {
    const params = buildQueryParams(
      getInitialFilters("ROLE_CLIENT", "uuid-123"),
    );
    expect(params.get("client")).toBe("uuid-123");
    expect(params.get("deliveryType")).toBe("DELIVERY");
  });

  it("filtros adicionais são adicionados aos params", () => {
    const initial = getInitialFilters("ROLE_CLIENT", "uuid-123");
    const withExtra = { ...initial, status: "PENDING", preferredVehicleType: "MOTORCYCLE" };
    const params = buildQueryParams(withExtra);
    expect(params.get("client")).toBe("uuid-123");
    expect(params.get("status")).toBe("PENDING");
    expect(params.get("preferredVehicleType")).toBe("MOTORCYCLE");
  });

  it("filtros vazios são omitidos dos params", () => {
    const filters = { client: "uuid-123", status: "", courier: "" };
    const params = buildQueryParams(filters);
    expect(params.get("client")).toBe("uuid-123");
    expect(params.has("status")).toBe(false);
    expect(params.has("courier")).toBe(false);
  });

  it("paginação é incluída nos params", () => {
    const params = buildQueryParams({}, 2, 25);
    expect(params.get("page")).toBe("2");
    expect(params.get("size")).toBe("25");
  });

  it("ORGANIZER envia organizer como param fixo", () => {
    const params = buildQueryParams(
      getInitialFilters("ROLE_ORGANIZER", "uuid-org"),
    );
    expect(params.get("organizer")).toBe("uuid-org");
    expect(params.has("client")).toBe(false);
  });

  it("ADMIN não envia params fixos de filtro", () => {
    const params = buildQueryParams(
      getInitialFilters("ROLE_ADMIN", "uuid-admin"),
    );
    expect(params.has("client")).toBe(false);
    expect(params.has("organizer")).toBe(false);
    expect(params.get("page")).toBe("0");
  });
});
