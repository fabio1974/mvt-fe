import { useCallback, useEffect, useState } from "react";
import { api } from "../../../services/api";
import { getUserId } from "../../../utils/auth";
import type {
  OrderCommand,
  OrderInfo,
  ProductSummary,
  RestaurantTable,
  TableFlowData,
} from "./types";

/**
 * Hook compartilhado: carrega cardápio + pedido ativo + comandas + status da mesa.
 * Expõe `refresh()` pra ressincronizar após mutações (fechar conta, mover item, etc).
 */
export function useTableFlowData(table: RestaurantTable): TableFlowData {
  const [products, setProducts] = useState<ProductSummary[]>([]);
  const [existingOrder, setExistingOrder] = useState<OrderInfo | null>(null);
  const [commands, setCommands] = useState<OrderCommand[]>([]);
  const [tableStatus, setTableStatus] = useState(table.status);
  const [loading, setLoading] = useState(true);

  const clientId = getUserId();

  const fetchData = useCallback(async () => {
    if (!clientId) { setLoading(false); return; }
    try {
      const [productRes, ordersRes, tablesRes] = await Promise.all([
        api.get(`/api/products/client/${clientId}`, { params: { channel: "TABLE" } }),
        api.get(`/api/orders/by-table/${table.id}`, { params: { activeOnly: true } }),
        api.get("/api/tables", { params: { activeOnly: false } }),
      ]);

      const prods = (productRes.data as ProductSummary[]).filter((p) => p.available);
      setProducts(prods);

      const ordersData = ordersRes.data as OrderInfo[];
      const order = ordersData.length > 0 ? ordersData[0] : null;
      setExistingOrder(order);

      const currentTable = (tablesRes.data as RestaurantTable[]).find((t) => t.id === table.id);
      if (currentTable) setTableStatus(currentTable.status);

      if (order) {
        try {
          const cmdRes = await api.get(`/api/orders/${order.id}/commands`);
          setCommands(cmdRes.data as OrderCommand[]);
        } catch {
          setCommands([]);
        }
      } else {
        setCommands([]);
      }
    } catch (e) {
      console.error("Erro ao carregar dados da mesa:", e);
    } finally {
      setLoading(false);
    }
  }, [clientId, table.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  return {
    products,
    existingOrder,
    setExistingOrder,
    commands,
    setCommands,
    tableStatus,
    loading,
    refresh: fetchData,
  };
}
