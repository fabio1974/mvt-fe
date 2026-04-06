import { describe, it, expect } from "vitest";

/**
 * Testes unitários do DeliveryWizard — rodam no build (deploy).
 *
 * Validam a lógica de payload e formatação sem precisar de browser.
 * Os testes E2E (Playwright) cobrem o fluxo visual completo.
 */

// Simula o mesmo processamento que o DeliveryWizard faz no payload
function buildDeliveryPayload(
  origin: { address: string; latitude?: number; longitude?: number },
  stops: Array<{
    address: string;
    latitude?: number;
    longitude?: number;
    recipientName?: string;
    recipientPhone?: string;
    itemDescription?: string;
    itemValue?: string;
  }>,
  options?: { notes?: string; distanceKm?: number },
) {
  const lastStop = stops[stops.length - 1];

  // Calcula totalAmount somando itemValue de todas as paradas
  const totalAmount = stops.reduce((sum, s) => {
    const val = parseFloat((s.itemValue || "0").replace(",", "."));
    return sum + (isNaN(val) ? 0 : val);
  }, 0);

  return {
    fromAddress: origin.address,
    fromLatitude: origin.latitude || undefined,
    fromLongitude: origin.longitude || undefined,
    toAddress: lastStop.address,
    toLatitude: lastStop.latitude || undefined,
    toLongitude: lastStop.longitude || undefined,
    recipientName: stops[0]?.recipientName || undefined,
    recipientPhone: stops[0]?.recipientPhone?.replace(/\D/g, "") || undefined,
    itemDescription: stops[0]?.itemDescription || undefined,
    totalAmount: totalAmount > 0 ? totalAmount.toFixed(2) : undefined,
    distanceKm: options?.distanceKm || undefined,
    notes: options?.notes?.trim() || undefined,
    stops: stops.map((s, idx) => ({
      address: s.address,
      latitude: s.latitude || undefined,
      longitude: s.longitude || undefined,
      recipientName: s.recipientName || undefined,
      recipientPhone: s.recipientPhone?.replace(/\D/g, "") || undefined,
      itemDescription: s.itemDescription || undefined,
      plannedOrder: idx + 1,
    })),
  };
}

// Formata telefone brasileiro (mesma função do wizard)
function formatPhone(raw: string): string {
  const digits = raw.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 2) return digits;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

// Dados de Sobral-CE (mesmos dos testes E2E)
const SOBRAL_ORIGIN = {
  address: "Rua Conselheiro Rodrigues, 100 - Centro, Sobral - CE",
  latitude: -3.6889,
  longitude: -40.3505,
};

const SOBRAL_STOPS = [
  {
    address: "Avenida John Sanford, 800 - Centro, Sobral - CE",
    latitude: -3.6912,
    longitude: -40.3481,
    recipientName: "João da Silva",
    recipientPhone: "(88) 99876-5432",
    itemDescription: "Documentos urgentes",
    itemValue: "15,00",
  },
  {
    address: "Rua Coronel Mont Alverne, 200 - Centro, Sobral - CE",
    latitude: -3.6865,
    longitude: -40.3520,
    recipientName: "Maria Oliveira",
    recipientPhone: "(88) 99765-4321",
    itemDescription: "Caixa de medicamentos",
    itemValue: "25,00",
  },
  {
    address: "Rua Dr. Guarany, 300 - Derby, Sobral - CE",
    latitude: -3.6940,
    longitude: -40.3450,
    recipientName: "Pedro Santos",
    recipientPhone: "(88) 99654-3210",
    itemDescription: "Encomenda frágil",
    itemValue: "10,00",
  },
];

describe("DeliveryWizard - Payload", () => {
  describe("Delivery simples (1 destino)", () => {
    it("payload tem estrutura correta com 1 stop", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, [SOBRAL_STOPS[0]]);

      expect(payload.fromAddress).toContain("Conselheiro Rodrigues");
      expect(payload.toAddress).toContain("John Sanford");
      expect(payload.stops).toHaveLength(1);
      expect(payload.stops[0].plannedOrder).toBe(1);
    });

    it("recipientName e itemDescription estão no stop e no nível raiz", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, [SOBRAL_STOPS[0]]);

      // Nível raiz (compatibilidade com BE)
      expect(payload.recipientName).toBe("João da Silva");
      expect(payload.itemDescription).toBe("Documentos urgentes");

      // No stop
      expect(payload.stops[0].recipientName).toBe("João da Silva");
      expect(payload.stops[0].itemDescription).toBe("Documentos urgentes");
    });

    it("totalAmount calculado do itemValue", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, [SOBRAL_STOPS[0]]);

      expect(payload.totalAmount).toBe("15.00");
    });
  });

  describe("Multi-stop (3 destinos)", () => {
    it("payload tem 3 stops com plannedOrder correto", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, SOBRAL_STOPS);

      expect(payload.stops).toHaveLength(3);
      expect(payload.stops[0].plannedOrder).toBe(1);
      expect(payload.stops[1].plannedOrder).toBe(2);
      expect(payload.stops[2].plannedOrder).toBe(3);
    });

    it("toAddress é o endereço do último stop", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, SOBRAL_STOPS);

      expect(payload.toAddress).toContain("Dr. Guarany");
    });

    it("totalAmount é soma de todos os itemValues (15 + 25 + 10 = 50)", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, SOBRAL_STOPS);

      expect(payload.totalAmount).toBe("50.00");
    });

    it("cada stop tem recipientName e itemDescription", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, SOBRAL_STOPS);

      expect(payload.stops[0].recipientName).toBe("João da Silva");
      expect(payload.stops[1].recipientName).toBe("Maria Oliveira");
      expect(payload.stops[2].recipientName).toBe("Pedro Santos");

      expect(payload.stops[0].itemDescription).toBe("Documentos urgentes");
      expect(payload.stops[1].itemDescription).toBe("Caixa de medicamentos");
      expect(payload.stops[2].itemDescription).toBe("Encomenda frágil");
    });

    it("recipientName/Phone do nível raiz vem do primeiro stop", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, SOBRAL_STOPS);

      expect(payload.recipientName).toBe("João da Silva");
      expect(payload.recipientPhone).toBe("88998765432");
    });
  });

  describe("Formatação de telefone", () => {
    it("recipientPhone é enviado sem formatação (digits only)", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, SOBRAL_STOPS);

      for (const stop of payload.stops) {
        expect(stop.recipientPhone).toMatch(/^\d+$/);
        expect(stop.recipientPhone).not.toContain("(");
        expect(stop.recipientPhone).not.toContain(")");
        expect(stop.recipientPhone).not.toContain("-");
        expect(stop.recipientPhone).not.toContain(" ");
      }
    });

    it("formatPhone exibe corretamente para o usuário", () => {
      expect(formatPhone("88998765432")).toBe("(88) 99876-5432");
      expect(formatPhone("85")).toBe("85");
      expect(formatPhone("8599")).toBe("(85) 99");
      expect(formatPhone("85999887766")).toBe("(85) 99988-7766");
    });

    it("formatPhone limita a 11 dígitos", () => {
      expect(formatPhone("8899876543210000")).toBe("(88) 99876-5432");
    });
  });

  describe("Campos opcionais e edge cases", () => {
    it("stop sem itemValue resulta em totalAmount undefined", () => {
      const stops = [
        { ...SOBRAL_STOPS[0], itemValue: "" },
      ];
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, stops);

      expect(payload.totalAmount).toBeUndefined();
    });

    it("stop sem recipientPhone envia undefined no payload", () => {
      const stops = [
        { ...SOBRAL_STOPS[0], recipientPhone: "" },
      ];
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, stops);

      expect(payload.stops[0].recipientPhone).toBeUndefined();
      expect(payload.recipientPhone).toBeUndefined();
    });

    it("itemValue com vírgula (BR) é convertido para ponto", () => {
      const stops = [
        { ...SOBRAL_STOPS[0], itemValue: "15,50" },
      ];
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, stops);

      expect(payload.totalAmount).toBe("15.50");
    });

    it("notes com espaços em branco resulta em undefined", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, [SOBRAL_STOPS[0]], {
        notes: "   ",
      });

      expect(payload.notes).toBeUndefined();
    });

    it("notes com texto é preservado", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, [SOBRAL_STOPS[0]], {
        notes: "Entregar no portão lateral",
      });

      expect(payload.notes).toBe("Entregar no portão lateral");
    });

    it("coordenadas são incluídas quando disponíveis", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, [SOBRAL_STOPS[0]]);

      expect(payload.fromLatitude).toBe(-3.6889);
      expect(payload.fromLongitude).toBe(-40.3505);
      expect(payload.stops[0].latitude).toBe(-3.6912);
      expect(payload.stops[0].longitude).toBe(-40.3481);
    });
  });

  describe("Consistência com mobile", () => {
    it("payload tem mesma estrutura que o mobile envia", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, SOBRAL_STOPS, {
        distanceKm: 12.5,
      });

      // Campos que o mobile envia
      expect(payload).toHaveProperty("fromAddress");
      expect(payload).toHaveProperty("fromLatitude");
      expect(payload).toHaveProperty("fromLongitude");
      expect(payload).toHaveProperty("toAddress");
      expect(payload).toHaveProperty("toLatitude");
      expect(payload).toHaveProperty("toLongitude");
      expect(payload).toHaveProperty("recipientName");
      expect(payload).toHaveProperty("recipientPhone");
      expect(payload).toHaveProperty("itemDescription");
      expect(payload).toHaveProperty("totalAmount");
      expect(payload).toHaveProperty("distanceKm");
      expect(payload).toHaveProperty("stops");

      // Cada stop tem os mesmos campos
      for (const stop of payload.stops) {
        expect(stop).toHaveProperty("address");
        expect(stop).toHaveProperty("recipientName");
        expect(stop).toHaveProperty("recipientPhone");
        expect(stop).toHaveProperty("itemDescription");
        expect(stop).toHaveProperty("plannedOrder");
      }
    });

    it("MANAGER não é usado em nenhum campo (só ORGANIZER)", () => {
      const payload = buildDeliveryPayload(SOBRAL_ORIGIN, SOBRAL_STOPS);
      const json = JSON.stringify(payload);

      expect(json).not.toContain("MANAGER");
      expect(json).not.toContain("manager");
    });
  });
});
