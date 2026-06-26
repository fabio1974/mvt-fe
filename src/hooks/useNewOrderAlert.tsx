import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { api } from "../services/api";
import { getUserRole } from "../utils/auth";
import { playNewOrderAlert } from "../utils/newOrderSound";

const POLL_INTERVAL_MS = 20000;         // alarme de pedido novo + refresh suave da lista (sincronizados em 20s)
const TITLE_FLASH_INTERVAL_MS = 1000;
const SIREN_REPEAT_INTERVAL_MS = 10000;
const ACK_STORAGE_KEY = "zapi10.newOrderAck";

export interface PlacedOrderItem {
  productName: string | null;
  quantity: number;
  unitPrice: number;
  observation: string | null;
}

export interface PlacedOrderInfo {
  id: number;
  total: number;
  customerName: string | null;
  customerPhone: string | null;
  deliveryAddress: string | null;
  orderType: string;
  tableNumber: number | null;
  createdAt: string;
  notes: string | null;
  items: PlacedOrderItem[];
}

interface NewOrderAlertContextValue {
  /** PLACED orders vindo do BE (fonte de verdade pro badge no sidebar). */
  placedOrders: PlacedOrderInfo[];
  /** Próximo pedido a exibir no modal — null quando não há nada pendente ou todos já foram acked. */
  pendingModal: PlacedOrderInfo | null;
  /** Marca o pedido como "ver depois" — não reabre modal nesta sessão. Badge continua até BE aceitar/recusar. */
  acknowledge: (orderId: number) => void;
  /** Aceita o pedido no BE (PATCH /orders/{id}/accept) e remove da fila local. */
  accept: (orderId: number) => Promise<void>;
  /** Incrementa a cada poll (20s) — use como externalRefreshKey pra re-fetchar listas dependentes em background. */
  refreshTick: number;
}

const Ctx = createContext<NewOrderAlertContextValue>({
  placedOrders: [],
  pendingModal: null,
  acknowledge: () => {},
  accept: async () => {},
  refreshTick: 0,
});

const loadAck = (): Set<number> => {
  try {
    const raw = sessionStorage.getItem(ACK_STORAGE_KEY);
    if (!raw) return new Set();
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? new Set(arr as number[]) : new Set();
  } catch {
    return new Set();
  }
};

const persistAck = (set: Set<number>) => {
  try {
    sessionStorage.setItem(ACK_STORAGE_KEY, JSON.stringify([...set]));
  } catch {
    /* swallow — sessionStorage pode falhar em modo private */
  }
};

export const NewOrderAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const role = getUserRole();
  const isClient = role === "ROLE_CLIENT" || role === "CLIENT";

  const [placedOrders, setPlacedOrders] = useState<PlacedOrderInfo[]>([]);
  const [acknowledged, setAcknowledged] = useState<Set<number>>(() => loadAck());
  const [refreshTick, setRefreshTick] = useState(0);

  // IDs vistos no último poll — usados pra detectar "novo" sem depender do estado do React.
  const seenIdsRef = useRef<Set<number>>(new Set());
  const hasFirstPollRef = useRef(false);

  useEffect(() => {
    if (!isClient) return;
    let cancelled = false;

    const poll = async () => {
      if (document.hidden && hasFirstPollRef.current) {
        // Pausa polling quando aba está em background — economiza requisições e BE não acorda à toa.
        // Volta no próximo intervalo quando aba ficar visível (visibilitychange listener abaixo).
        return;
      }
      try {
        const { data } = await api.get<any[]>("/api/orders/restaurant/active");
        if (cancelled) return;
        const placed: PlacedOrderInfo[] = (data || [])
          .filter((o) => o.status === "PLACED")
          .map((o) => ({
            id: o.id,
            total: o.total,
            customerName: o.customerName ?? null,
            customerPhone: o.customerPhone ?? null,
            deliveryAddress: o.deliveryAddress ?? null,
            orderType: o.orderType,
            tableNumber: o.tableNumber ?? null,
            createdAt: o.createdAt,
            notes: o.notes ?? null,
            items: Array.isArray(o.items)
              ? o.items.map((it: any) => ({
                  productName: it.productName ?? null,
                  quantity: Number(it.quantity ?? 1),
                  unitPrice: Number(it.unitPrice ?? 0),
                  observation: it.observation ?? null,
                }))
              : [],
          }));

        // Detecta IDs realmente novos. No 1º poll só popula o snapshot — não alarma
        // pedidos antigos que já estavam aguardando há horas.
        if (hasFirstPollRef.current) {
          const newOnes = placed.filter((o) => !seenIdsRef.current.has(o.id));
          if (newOnes.length > 0) {
            playNewOrderAlert();
          }
        }
        seenIdsRef.current = new Set(placed.map((o) => o.id));
        hasFirstPollRef.current = true;

        setPlacedOrders(placed);
        setRefreshTick((t) => t + 1);
      } catch {
        /* polling — falhas de rede transitórias não devem quebrar a UX */
      }
    };

    poll();
    const intervalId = window.setInterval(poll, POLL_INTERVAL_MS);

    // Quando aba volta ao foco, fazer poll imediato pra recuperar latência acumulada.
    const onVisibilityChange = () => {
      if (!document.hidden) poll();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      cancelled = true;
      window.clearInterval(intervalId);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [isClient]);

  // Title flash: alterna entre título original e "🔔 (N) Novo pedido — Zapi10"
  // enquanto há PLACED orders. Funciona com aba em foco ou background.
  useEffect(() => {
    const count = placedOrders.length;
    if (count === 0) return;

    const originalTitle = document.title;
    let flashed = false;
    const tick = () => {
      flashed = !flashed;
      document.title = flashed ? `🔔 (${count}) Novo pedido — Zapi10` : originalTitle;
    };
    const intervalId = window.setInterval(tick, TITLE_FLASH_INTERVAL_MS);
    return () => {
      window.clearInterval(intervalId);
      document.title = originalTitle;
    };
  }, [placedOrders.length]);

  // Sirene em loop: enquanto houver pedido PLACED **ainda não reconhecido** localmente.
  // "Ver depois" ou "Aceitar" tira da fila de ack e silencia o sino — o badge no sidebar
  // continua mostrando a contagem real do BE, mas o user já confirmou que viu.
  const hasUnackedPlaced = useMemo(
    () => placedOrders.some((o) => !acknowledged.has(o.id)),
    [placedOrders, acknowledged]
  );
  useEffect(() => {
    if (!hasUnackedPlaced) return;
    const intervalId = window.setInterval(() => {
      playNewOrderAlert();
    }, SIREN_REPEAT_INTERVAL_MS);
    return () => window.clearInterval(intervalId);
  }, [hasUnackedPlaced]);

  // Limpa do `acknowledged` qualquer ID que não está mais em PLACED (foi aceito/cancelado fora dessa sessão).
  useEffect(() => {
    setAcknowledged((prev) => {
      if (prev.size === 0) return prev;
      const placedIds = new Set(placedOrders.map((o) => o.id));
      const next = new Set<number>();
      let changed = false;
      prev.forEach((id) => {
        if (placedIds.has(id)) next.add(id);
        else changed = true;
      });
      if (!changed) return prev;
      persistAck(next);
      return next;
    });
  }, [placedOrders]);

  const acknowledge = useCallback((orderId: number) => {
    setAcknowledged((prev) => {
      if (prev.has(orderId)) return prev;
      const next = new Set(prev);
      next.add(orderId);
      persistAck(next);
      return next;
    });
  }, []);

  const accept = useCallback(
    async (orderId: number) => {
      await api.patch(`/api/orders/${orderId}/accept`);
      // Otimista: tira da lista local — próximo poll vai confirmar (não está mais PLACED).
      setPlacedOrders((prev) => prev.filter((o) => o.id !== orderId));
      acknowledge(orderId);
    },
    [acknowledge]
  );

  const pendingModal = useMemo(() => {
    return placedOrders.find((o) => !acknowledged.has(o.id)) ?? null;
  }, [placedOrders, acknowledged]);

  const value = useMemo<NewOrderAlertContextValue>(
    () => ({ placedOrders, pendingModal, acknowledge, accept, refreshTick }),
    [placedOrders, pendingModal, acknowledge, accept, refreshTick]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useNewOrderAlert = (): NewOrderAlertContextValue => useContext(Ctx);
