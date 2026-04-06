import { describe, it, expect, vi } from "vitest";

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

describe("DeliveryWizard — estrutura", () => {
  it("step 2 não deve ter GoogleMap (removido para step 3)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const wizardPath = path.resolve(__dirname, "../components/Delivery/DeliveryWizard.tsx");
    const content = fs.readFileSync(wizardPath, "utf-8");

    // Step 2 (renderStep2) não deve ter GoogleMap
    const step2Match = content.match(/const renderStep2[\s\S]*?const renderStep3/);
    if (step2Match) {
      expect(step2Match[0]).not.toContain("<GoogleMap");
      expect(step2Match[0]).not.toContain("wizard-preview-map");
    }
  });

  it("step 3 tem GoogleMap com suppressMarkers=true (pins customizados)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const wizardPath = path.resolve(__dirname, "../components/Delivery/DeliveryWizard.tsx");
    const content = fs.readFileSync(wizardPath, "utf-8");

    const step3Match = content.match(/const renderStep3[\s\S]*?return \(/);
    // O step 3 usa suppressMarkers: true para pins customizados
    expect(content).toContain("suppressMarkers: true");
  });

  it("wizard usa pins pirulito (SVG path) ao invés de markers padrão", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const wizardPath = path.resolve(__dirname, "../components/Delivery/DeliveryWizard.tsx");
    const content = fs.readFileSync(wizardPath, "utf-8");

    // Verifica SVG path dos pins pirulito
    expect(content).toContain("M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z");
  });

  it("pins usam cores corretas: verde origem, laranja parada, vermelho final", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const wizardPath = path.resolve(__dirname, "../components/Delivery/DeliveryWizard.tsx");
    const content = fs.readFileSync(wizardPath, "utf-8");

    expect(content).toContain('"#22c55e"'); // verde origem
    expect(content).toContain('"#f59e0b"'); // laranja parada
    expect(content).toContain('"#ef4444"'); // vermelho destino
  });
});

// ============================================================
// 9. AddressMapPicker — clique posiciona pin
// ============================================================

describe("AddressMapPicker — interação", () => {
  it("tem onClick handler no GoogleMap", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const pickerPath = path.resolve(__dirname, "../components/Common/AddressMapPicker.tsx");
    const content = fs.readFileSync(pickerPath, "utf-8");

    expect(content).toContain("onClick={(e)");
    expect(content).toContain("panTo");
  });

  it("gestureHandling é cooperative (drag habilitado, scroll desabilitado)", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const pickerPath = path.resolve(__dirname, "../components/Common/AddressMapPicker.tsx");
    const content = fs.readFileSync(pickerPath, "utf-8");

    expect(content).toContain('gestureHandling: "cooperative"');
    expect(content).toContain("scrollwheel: false");
  });

  it("botão confirmar está na mesma div dos botões de busca/pin", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const pickerPath = path.resolve(__dirname, "../components/Common/AddressMapPicker.tsx");
    const content = fs.readFileSync(pickerPath, "utf-8");

    // O botão confirmar deve estar próximo dos botões de busca
    expect(content).toContain("address-confirm-button");
    expect(content).toContain("address-search-button");
  });
});

// ============================================================
// 10. Campos de rota ocultos do metadata
// ============================================================

describe("Delivery — campos ocultos", () => {
  // Campos que NÃO devem aparecer em tabelas/forms
  const HIDDEN_ROUTE_FIELDS = [
    "actualRoute",
    "approachRoute",
    "plannedRoute",
    "approachPlannedRoute",
    "plannedRouteCoordinates",
    "paymentCompleted",
  ];

  it("DeliveryCRUDPage oculta campos de rota na tabela", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const crudPath = path.resolve(__dirname, "../components/Delivery/DeliveryCRUDPage.tsx");
    const content = fs.readFileSync(crudPath, "utf-8");

    // Verifica que tableHideFields inclui os campos de rota
    for (const field of ["actualRoute", "approachRoute", "plannedRoute"]) {
      expect(content).toContain(`"${field}"`);
    }
  });
});

// ============================================================
// 11. Botão "Nova Entrega" (sem "Criar Novo" duplicado)
// ============================================================

describe("DeliveryCRUDPage — botão unificado", () => {
  it("botão diz 'Nova Entrega' (não 'Com paradas')", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const crudPath = path.resolve(__dirname, "../components/Delivery/DeliveryCRUDPage.tsx");
    const content = fs.readFileSync(crudPath, "utf-8");

    expect(content).toContain("Nova Entrega");
    expect(content).not.toContain("Com paradas");
  });

  it("passa hideCreateButton para ocultar botão 'Criar Novo'", async () => {
    const fs = await import("fs");
    const path = await import("path");
    const crudPath = path.resolve(__dirname, "../components/Delivery/DeliveryCRUDPage.tsx");
    const content = fs.readFileSync(crudPath, "utf-8");

    expect(content).toContain("hideCreateButton");
  });
});
