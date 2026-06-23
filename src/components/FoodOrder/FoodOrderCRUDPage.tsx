import React from "react";
import { FiPrinter } from "react-icons/fi";
import { useSearchParams, useNavigate } from "react-router-dom";
import EntityCRUD from "../Generic/EntityCRUD";
import FoodOrderEditPanel from "./FoodOrderEditPanel";
import printKitchenOrder from "./printKitchenOrder";
import { api } from "../../services/api";
import { getUserRole } from "../../utils/auth";
import { useNewOrderAlert } from "../../hooks/useNewOrderAlert";

const FINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

// Estabelecimento (CLIENT) só vê os próprios pedidos no balcão/entrega — colunas que viram ruído
// pra ele ficam escondidas por padrão na 1ª visita (depois ele ajusta no seletor de Colunas).
const ESTABLISHMENT_DEFAULT_HIDDEN = ["storeName", "tableNumberField", "notes", "deliveryAddress"];
const isEstablishment = () => {
  const r = getUserRole();
  return r === "ROLE_CLIENT" || r === "CLIENT";
};

const handlePrint = async (orderId: number) => {
  try {
    const [orderRes, cmdsRes] = await Promise.all([
      api.get<any>(`/api/orders/${orderId}`),
      api.get<any[]>(`/api/orders/${orderId}/commands`).catch(() => ({ data: [] })),
    ]);
    printKitchenOrder({ ...orderRes.data, commands: cmdsRes.data || [] });
  } catch (e) {
    console.error("Erro ao carregar pedido para impressão:", e);
  }
};

/**
 * Página de CRUD para Pedidos (Zapi-Food)
 *
 * - Listar: Filtros + tabela genérica (EntityCRUD)
 * - View: Desabilitado (acesso direto pelo edit)
 * - Create: Não existe (pedido vem do mobile)
 * - Edit: Componente customizado com botões de status
 */
const FoodOrderCRUDPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderIdParam = searchParams.get("orderId");
  const entityId = orderIdParam ? Number(orderIdParam) : undefined;
  const { refreshTick } = useNewOrderAlert();

  return (
    <EntityCRUD
      // Remonta quando o orderId da URL muda (ex.: usuário clica no link "Pedidos" do sidebar sem param)
      key={entityId ?? "list"}
      entityName="foodOrder"
      entityId={entityId}
      externalRefreshKey={refreshTick}
      initialMode={entityId ? "edit" : undefined}
      hideCreateButton={true}
      disableView={true}
      defaultHiddenColumns={isEstablishment() ? ESTABLISHMENT_DEFAULT_HIDDEN : undefined}
      hiddenFields={["deliveryLatitude", "deliveryLongitude", "items"]}
      hideFields={["subtotal", "deliveryFee", "total", "estimatedPreparationMinutes"]}
      customActions={(row: any) => (
        <button
          className="btn-action btn-print"
          onClick={() => handlePrint(row.id)}
          title="Imprimir recibo"
        >
          <FiPrinter />
        </button>
      )}
      customRenderers={{
        tableNumber: (value, row: any) => {
          if (value == null) return <span style={{ display: "inline-block", width: 90 }}>—</span>;
          const canOpenTable = !FINAL_STATUSES.has(row.status);
          if (!canOpenTable) {
            return <span style={{ display: "inline-block", width: 90 }}>{String(value)}</span>;
          }
          return (
            <button
              className="btn-action btn-open-table"
              onClick={() => navigate(`/mesas?openTable=${value}`)}
              title={`Abrir Mesa #${value}`}
              style={{ width: 90 }}
            >
              Mesa #{String(value)}
            </button>
          );
        },
      }}
      customEditComponent={(entityId, viewMode, onBack) => (
        <FoodOrderEditPanel
          orderId={entityId as number}
          viewMode={viewMode}
          onBack={onBack}
        />
      )}
    />
  );
};

export default FoodOrderCRUDPage;
