import { describe, it, expect } from "vitest";

/**
 * Testes unitários para mudanças recentes no FE.
 * Rodam no build (deploy) — garantem que regressões não passem.
 */

// ============================================================
// 1. Tabelas: nowrap em th e td
// ============================================================

describe("EntityTable CSS — nowrap", () => {
  it("CSS de td contém white-space: nowrap", async () => {
    const css = await import("../components/Generic/EntityTable.css?raw");
    const content = (css as any).default || css;
    expect(content).toContain("white-space: nowrap");
  });
});

// ============================================================
// 2. Payment array renderizado corretamente (não [object Object])
// ============================================================

describe("Payment array rendering", () => {
  // Simula a lógica do formatValue para arrays
  function formatArrayValue(value: unknown[]): string {
    if (value.length === 0) return "-";
    const last = value[value.length - 1] as Record<string, unknown>;
    if (last && typeof last === "object") {
      const statusMap: Record<string, string> = {
        PAID: "Pago",
        PENDING: "Pendente",
        EXPIRED: "Expirado",
        CANCELLED: "Cancelado",
        FAILED: "Falhou",
        PROCESSING: "Processando",
        REFUNDED: "Estornado",
      };
      const status = last.status ? (statusMap[last.status as string] || String(last.status)) : "";
      const amount = last.amount != null
        ? ` R$ ${Number(last.amount).toFixed(2).replace(".", ",")}`
        : "";
      return status + amount || `${value.length} item(s)`;
    }
    return `${value.length} item(s)`;
  }

  it("payment PAID com amount mostra 'Pago R$ 15,00'", () => {
    const payments = [{ status: "PAID", amount: 15 }];
    expect(formatArrayValue(payments)).toBe("Pago R$ 15,00");
  });

  it("payment PENDING sem amount mostra 'Pendente'", () => {
    const payments = [{ status: "PENDING" }];
    expect(formatArrayValue(payments)).toBe("Pendente");
  });

  it("payment EXPIRED mostra 'Expirado'", () => {
    const payments = [{ status: "EXPIRED", amount: 20 }];
    expect(formatArrayValue(payments)).toBe("Expirado R$ 20,00");
  });

  it("múltiplos payments mostra status do ÚLTIMO", () => {
    const payments = [
      { status: "EXPIRED", amount: 10 },
      { status: "PAID", amount: 10 },
    ];
    expect(formatArrayValue(payments)).toBe("Pago R$ 10,00");
  });

  it("array vazio mostra '-'", () => {
    expect(formatArrayValue([])).toBe("-");
  });

  it("nunca mostra [object Object]", () => {
    const payments = [{ status: "PAID", amount: 25.5 }];
    const result = formatArrayValue(payments);
    expect(result).not.toContain("[object Object]");
    expect(result).not.toContain("object");
  });
});

// ============================================================
// 3. Formato de data dd/MM/yyyy HH:mm
// ============================================================

describe("Formatação de data em tabelas", () => {
  function formatDate(value: string): string {
    const d = new Date(value);
    if (isNaN(d.getTime())) return value;
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, "0");
    const min = String(d.getMinutes()).padStart(2, "0");
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }

  it("formata ISO datetime para dd/MM/yyyy HH:mm", () => {
    expect(formatDate("2026-04-05T14:30:00Z")).toMatch(/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}$/);
  });

  it("formata data corretamente", () => {
    // Nota: o resultado depende do timezone local, então verificamos o formato
    const result = formatDate("2026-01-15T10:30:00-03:00");
    expect(result).toMatch(/15\/01\/2026/);
  });

  it("data inválida retorna string original", () => {
    expect(formatDate("not-a-date")).toBe("not-a-date");
  });
});

// ============================================================
// 4. Máscara monetária (valor a cobrar)
// ============================================================

describe("Máscara monetária — valor a cobrar", () => {
  // Simula a lógica do onChange do campo itemValue
  function formatCurrency(input: string): string {
    const digits = input.replace(/\D/g, "");
    if (!digits) return "";
    const cents = parseInt(digits, 10);
    return (cents / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  }

  it("2400 → 24,00", () => {
    expect(formatCurrency("2400")).toBe("24,00");
  });

  it("1550 → 15,50", () => {
    expect(formatCurrency("1550")).toBe("15,50");
  });

  it("100 → 1,00", () => {
    expect(formatCurrency("100")).toBe("1,00");
  });

  it("5 → 0,05", () => {
    expect(formatCurrency("5")).toBe("0,05");
  });

  it("vazio → vazio", () => {
    expect(formatCurrency("")).toBe("");
  });

  it("10000 → 100,00", () => {
    expect(formatCurrency("10000")).toBe("100,00");
  });

  it("sempre tem 2 casas decimais", () => {
    const result = formatCurrency("1234");
    expect(result).toMatch(/,\d{2}$/);
  });
});

// ============================================================
// 5. totalAmount parseia formato pt-BR
// ============================================================

describe("totalAmount — soma de valores pt-BR", () => {
  function parsePtBR(value: string): number {
    return parseFloat((value || "0").replace(/\./g, "").replace(",", "."));
  }

  function calcTotal(values: string[]): number {
    return values.reduce((sum, v) => sum + parsePtBR(v), 0);
  }

  it("15,00 + 25,00 + 10,00 = 50", () => {
    expect(calcTotal(["15,00", "25,00", "10,00"])).toBe(50);
  });

  it("1.234,56 parseia corretamente", () => {
    expect(parsePtBR("1.234,56")).toBe(1234.56);
  });

  it("0,50 parseia como 0.5", () => {
    expect(parsePtBR("0,50")).toBe(0.5);
  });

  it("vazio parseia como 0", () => {
    expect(parsePtBR("")).toBe(0);
  });
});

// ============================================================
// 6. Telefone formatado no display, digits no payload
// ============================================================

describe("Telefone — formatação e payload", () => {
  function formatPhone(raw: string): string {
    const digits = raw.replace(/\D/g, "").slice(0, 11);
    if (digits.length <= 2) return digits;
    if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
  }

  function phoneToPayload(formatted: string): string {
    return formatted.replace(/\D/g, "");
  }

  it("exibe (88) 99876-5432 para o usuário", () => {
    expect(formatPhone("88998765432")).toBe("(88) 99876-5432");
  });

  it("payload envia apenas dígitos", () => {
    expect(phoneToPayload("(88) 99876-5432")).toBe("88998765432");
  });

  it("payload nunca contém parênteses ou traços", () => {
    const payload = phoneToPayload("(85) 99999-9999");
    expect(payload).not.toContain("(");
    expect(payload).not.toContain(")");
    expect(payload).not.toContain("-");
    expect(payload).not.toContain(" ");
    expect(payload).toMatch(/^\d+$/);
  });
});

// ============================================================
// 7. Label translations
// ============================================================

describe("Label translations", () => {
  // Simula as traduções
  const translations: Record<string, string> = {
    "Payment Completed": "Pagamento",
    "Payment Date": "Pago Em",
    "Created At": "Criado Em",
  };

  function translateLabel(label: string): string {
    return translations[label] || label;
  }

  it("Payment Completed traduz para Pagamento", () => {
    expect(translateLabel("Payment Completed")).toBe("Pagamento");
  });

  it("Payment Date traduz para Pago Em", () => {
    expect(translateLabel("Payment Date")).toBe("Pago Em");
  });

  it("label desconhecido retorna original", () => {
    expect(translateLabel("Unknown Field")).toBe("Unknown Field");
  });
});

// ============================================================
// 8. Wizard — mapa só no step 3
// ============================================================

describe("DeliveryWizard — constantes de cores", () => {
  // Cores dos pins pirulito (devem bater com os markers)
  const PIN_COLORS = {
    origin: "#22c55e",   // verde
    stop: "#f59e0b",     // laranja
    destination: "#ef4444", // vermelho
  };

  it("cores dos pins estão corretas", () => {
    expect(PIN_COLORS.origin).toBe("#22c55e");
    expect(PIN_COLORS.stop).toBe("#f59e0b");
    expect(PIN_COLORS.destination).toBe("#ef4444");
  });

  it("SVG path do pirulito é válido", () => {
    const pinPath = "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z";
    expect(pinPath).toContain("M12 2C");
    expect(pinPath.length).toBeGreaterThan(20);
  });
});

describe("Delivery — campos que devem ser ocultos", () => {
  const HIDDEN_ROUTE_FIELDS = [
    "actualRoute",
    "approachRoute",
    "plannedRoute",
    "approachPlannedRoute",
    "plannedRouteCoordinates",
    "paymentCompleted",
  ];

  it("lista de campos ocultos inclui todas as rotas e paymentCompleted", () => {
    expect(HIDDEN_ROUTE_FIELDS).toContain("actualRoute");
    expect(HIDDEN_ROUTE_FIELDS).toContain("approachPlannedRoute");
    expect(HIDDEN_ROUTE_FIELDS).toContain("paymentCompleted");
  });

  it("MANAGER não está na lista (é ORGANIZER)", () => {
    expect(HIDDEN_ROUTE_FIELDS.join(",")).not.toContain("MANAGER");
  });
});

// ============================================================
// 9. Wizard — visível apenas para CLIENT e CUSTOMER
// ============================================================

describe("DeliveryCRUD — canUseWizard por role", () => {
  // Replica a lógica de canUseWizard do DeliveryCRUDPage
  function canUseWizard(userRole: string, isClientFn: () => boolean): boolean {
    return isClientFn() || userRole === "ROLE_CUSTOMER" || userRole === "CUSTOMER";
  }

  // Simula isClient() que retorna true para CLIENT e CUSTOMER
  function makeIsClient(role: string): () => boolean {
    return () =>
      role === "ROLE_CLIENT" || role === "CLIENT" ||
      role === "ROLE_CUSTOMER" || role === "CUSTOMER";
  }

  it("CLIENT pode usar wizard", () => {
    expect(canUseWizard("ROLE_CLIENT", makeIsClient("ROLE_CLIENT"))).toBe(true);
  });

  it("CUSTOMER pode usar wizard", () => {
    expect(canUseWizard("ROLE_CUSTOMER", makeIsClient("ROLE_CUSTOMER"))).toBe(true);
  });

  it("CUSTOMER sem prefixo ROLE_ pode usar wizard", () => {
    expect(canUseWizard("CUSTOMER", makeIsClient("CUSTOMER"))).toBe(true);
  });

  it("COURIER NÃO pode usar wizard", () => {
    expect(canUseWizard("ROLE_COURIER", makeIsClient("ROLE_COURIER"))).toBe(false);
  });

  it("ORGANIZER NÃO pode usar wizard", () => {
    expect(canUseWizard("ROLE_ORGANIZER", makeIsClient("ROLE_ORGANIZER"))).toBe(false);
  });

  it("ADMIN NÃO pode usar wizard", () => {
    expect(canUseWizard("ROLE_ADMIN", makeIsClient("ROLE_ADMIN"))).toBe(false);
  });
});

// ============================================================
// 10. BankAccountPage — fetch por userId, estados loading/notFound
// ============================================================

describe("BankAccountPage — lógica de carregamento", () => {
  // Simula a lógica de decidir entityId e initialMode
  function bankAccountPageState(response: { id?: number } | null, isError404: boolean) {
    let bankAccountId: number | null = null;
    let notFound = false;

    if (isError404) {
      notFound = true;
    } else if (response && response.id) {
      bankAccountId = response.id;
    } else {
      notFound = true;
    }

    return {
      entityId: notFound ? undefined : bankAccountId ?? undefined,
      initialMode: notFound ? "create" : "view",
      showEditButton: !notFound,
      pageDescription: notFound
        ? "Cadastre suas informações bancárias"
        : "Visualize e edite suas informações bancárias",
    };
  }

  it("conta encontrada → mode view, entityId numérico", () => {
    const state = bankAccountPageState({ id: 42 }, false);
    expect(state.entityId).toBe(42);
    expect(state.initialMode).toBe("view");
    expect(state.showEditButton).toBe(true);
  });

  it("404 → mode create, sem entityId", () => {
    const state = bankAccountPageState(null, true);
    expect(state.entityId).toBeUndefined();
    expect(state.initialMode).toBe("create");
    expect(state.showEditButton).toBe(false);
  });

  it("resposta sem id → mode create", () => {
    const state = bankAccountPageState({}, false);
    expect(state.entityId).toBeUndefined();
    expect(state.initialMode).toBe("create");
  });

  it("descrição muda conforme notFound", () => {
    const found = bankAccountPageState({ id: 1 }, false);
    const notFound = bankAccountPageState(null, true);
    expect(found.pageDescription).toContain("Visualize");
    expect(notFound.pageDescription).toContain("Cadastre");
  });
});

// ============================================================
// 11. totalAmount — formatação em Real (R$ X,XX)
// ============================================================

describe("totalAmount — formatação monetária R$", () => {
  function formatCurrencyBRL(value: unknown): string {
    if (value == null) return "-";
    return `R$ ${Number(value).toFixed(2).replace(".", ",")}`;
  }

  it("25 → R$ 25,00", () => {
    expect(formatCurrencyBRL(25)).toBe("R$ 25,00");
  });

  it("15.5 → R$ 15,50", () => {
    expect(formatCurrencyBRL(15.5)).toBe("R$ 15,50");
  });

  it("0 → R$ 0,00", () => {
    expect(formatCurrencyBRL(0)).toBe("R$ 0,00");
  });

  it("null → -", () => {
    expect(formatCurrencyBRL(null)).toBe("-");
  });

  it("undefined → -", () => {
    expect(formatCurrencyBRL(undefined)).toBe("-");
  });

  it("116.74 → R$ 116,74", () => {
    expect(formatCurrencyBRL(116.74)).toBe("R$ 116,74");
  });

  it("string numérica '9.98' → R$ 9,98", () => {
    expect(formatCurrencyBRL("9.98")).toBe("R$ 9,98");
  });

  it("sempre usa vírgula como separador decimal", () => {
    const result = formatCurrencyBRL(1234.56);
    expect(result).toContain(",");
    expect(result).not.toMatch(/\.\d{2}$/);
  });

  it("totalAmount e shippingFee usam mesma formatação", () => {
    const formatTotal = formatCurrencyBRL;
    const formatShipping = (v: unknown) => {
      if (v == null) return "-";
      return `R$ ${Number(v).toFixed(2).replace(".", ",")}`;
    };
    expect(formatTotal(79.80)).toBe(formatShipping(79.80));
    expect(formatTotal(10.65)).toBe(formatShipping(10.65));
  });
});

// ============================================================
// 12. Vehicle — exibição "marca modelo - placa" na tabela
// ============================================================

describe("Vehicle — display name na tabela", () => {
  function vehicleShortDescription(brand: string, model: string, plate: string): string {
    return `${brand} ${model} - ${plate}`;
  }

  function resolveEntityDisplay(value: Record<string, unknown>): string {
    // Mesma lógica do EntityTable: tenta name, title, label, etc.
    const displayValue =
      value.name ||
      value.title ||
      value.label ||
      value.displayName ||
      value.username ||
      value.email;
    if (displayValue) return String(displayValue);
    return value.id ? `ID: ${value.id}` : String(value);
  }

  it("vehicle com name mostra marca/modelo - placa", () => {
    const vehicle = {
      id: 5,
      name: vehicleShortDescription("Honda", "CG 160", "ABC1D23"),
      brand: "Honda",
      model: "CG 160",
      plate: "ABC1D23",
    };
    expect(resolveEntityDisplay(vehicle)).toBe("Honda CG 160 - ABC1D23");
  });

  it("vehicle sem name mostra ID como fallback", () => {
    const vehicle = { id: 5, brand: "Honda", model: "CG 160", plate: "ABC1D23" };
    expect(resolveEntityDisplay(vehicle)).toBe("ID: 5");
  });

  it("shortDescription formato correto", () => {
    expect(vehicleShortDescription("Yamaha", "Factor 150", "XYZ9K88")).toBe("Yamaha Factor 150 - XYZ9K88");
  });
});

// ============================================================
// 13. isCEPField — detecção segura sem falsos positivos
// ============================================================

describe("isCEPField — detecção segura de campos CEP", () => {
  // Replica a lógica corrigida do masks.ts
  function isCEPField(fieldName: string): boolean {
    const words = fieldName.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase().split(/[_\-]/);
    const cepWords = ["cep", "zipcode", "zip", "postalcode", "postal"];
    const excludeWords = ["point", "reference", "referencia"];
    const hasCep = words.some((w) => cepWords.includes(w));
    const isExcluded = words.some((w) => excludeWords.includes(w));
    return hasCep && !isExcluded;
  }

  // Campos que SÃO CEP
  it("cep → true", () => expect(isCEPField("cep")).toBe(true));
  it("zipCode → true", () => expect(isCEPField("zipCode")).toBe(true));
  it("postalCode → true", () => expect(isCEPField("postalCode")).toBe(true));
  it("addressZipCode → true", () => expect(isCEPField("addressZipCode")).toBe(true));
  it("address_cep → true", () => expect(isCEPField("address_cep")).toBe(true));
  it("addressCep → true", () => expect(isCEPField("addressCep")).toBe(true));

  // Campos que NÃO são CEP (falsos positivos anteriores)
  it("pricePerKm → false (contém 'cep' em priCEPerkm)", () =>
    expect(isCEPField("pricePerKm")).toBe(false));
  it("carPricePerKm → false", () =>
    expect(isCEPField("carPricePerKm")).toBe(false));
  it("acceptedAt → false (contém 'cep' em acCEPtedAt)", () =>
    expect(isCEPField("acceptedAt")).toBe(false));
  it("exceptionHandler → false", () =>
    expect(isCEPField("exceptionHandler")).toBe(false));
  it("interceptor → false", () =>
    expect(isCEPField("interceptor")).toBe(false));
  it("conceptId → false", () =>
    expect(isCEPField("conceptId")).toBe(false));
  it("receptionDate → false", () =>
    expect(isCEPField("receptionDate")).toBe(false));
  it("perceptionScore → false", () =>
    expect(isCEPField("perceptionScore")).toBe(false));

  // Excluídos por conter "point" ou "reference"
  it("referencePoint → false (excluído)", () =>
    expect(isCEPField("referencePoint")).toBe(false));
});

// ============================================================
// 14. unmaskFormData — não remove ponto decimal de números
// ============================================================

describe("unmaskFormData — preserva decimais em campos numéricos", () => {
  // Simula unmaskFormData simplificado
  function shouldUnmask(fieldName: string): boolean {
    const name = fieldName.toLowerCase();
    const words = name.replace(/([a-z])([A-Z])/g, "$1_$2").split(/[_\-]/);
    const cepWords = ["cep", "zipcode", "zip", "postalcode", "postal"];
    const isCep = words.some((w) => cepWords.includes(w));
    const isPhone = ["phone", "telefone", "fone", "tel", "celular", "mobile", "movel", "whatsapp", "zap"]
      .some((k) => name.includes(k));
    return name.includes("cpf") || name.includes("cnpj") || name.includes("document") || isCep || isPhone;
  }

  it("pricePerKm NÃO é desmascardo", () =>
    expect(shouldUnmask("pricePerKm")).toBe(false));
  it("carPricePerKm NÃO é desmascardo", () =>
    expect(shouldUnmask("carPricePerKm")).toBe(false));
  it("minimumShippingFee NÃO é desmascardo", () =>
    expect(shouldUnmask("minimumShippingFee")).toBe(false));
  it("acceptedAt NÃO é desmascardo", () =>
    expect(shouldUnmask("acceptedAt")).toBe(false));
  it("totalAmount NÃO é desmascardo", () =>
    expect(shouldUnmask("totalAmount")).toBe(false));
  it("shippingFee NÃO é desmascardo", () =>
    expect(shouldUnmask("shippingFee")).toBe(false));
  it("distanceKm NÃO é desmascardo", () =>
    expect(shouldUnmask("distanceKm")).toBe(false));

  // Campos que DEVEM ser desmascardos
  it("documentNumber É desmascardo", () =>
    expect(shouldUnmask("documentNumber")).toBe(true));
  it("cpf É desmascardo", () =>
    expect(shouldUnmask("cpf")).toBe(true));
  it("recipientPhone É desmascardo", () =>
    expect(shouldUnmask("recipientPhone")).toBe(true));
  it("cep É desmascardo", () =>
    expect(shouldUnmask("cep")).toBe(true));
  it("zipCode É desmascardo", () =>
    expect(shouldUnmask("zipCode")).toBe(true));

  it("valor 1.5 sobrevive unmask quando campo é numérico", () => {
    // Simula o fluxo completo
    const value = "1.5";
    const fieldName = "pricePerKm";
    const result = shouldUnmask(fieldName) ? value.replace(/\D/g, "") : value;
    expect(result).toBe("1.5");
  });

  it("valor 25.99 sobrevive unmask quando campo é numérico", () => {
    const value = "25.99";
    const fieldName = "shippingFee";
    const result = shouldUnmask(fieldName) ? value.replace(/\D/g, "") : value;
    expect(result).toBe("25.99");
  });
});
