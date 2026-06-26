import React from "react";
import { FiPrinter, FiSearch } from "react-icons/fi";
import { useSearchParams, useNavigate } from "react-router-dom";
import EntityCRUD from "../Generic/EntityCRUD";
import FoodOrderEditPanel from "./FoodOrderEditPanel";
import printKitchenOrder from "./printKitchenOrder";
import { api } from "../../services/api";
import { getUserRole } from "../../utils/auth";
import { useNewOrderAlert } from "../../hooks/useNewOrderAlert";

const FINAL_STATUSES = new Set(["COMPLETED", "CANCELLED"]);

// ── Coluna "Pagamento": badge da situação consolidada (vem do BE em row.paymentSituation,
// que já considera estorno do Payment). Cobre PAID/PENDING/FAILED/CANCELLED/REFUNDED/PARTIALLY_REFUNDED.
const PAYMENT_STATUS_UI: Record<string, { label: string; bg: string; color: string }> = {
  PAID: { label: "Pago", bg: "#dcfce7", color: "#15803d" },
  PENDING: { label: "Pendente", bg: "#fef3c7", color: "#b45309" },
  FAILED: { label: "Falhou", bg: "#fee2e2", color: "#b91c1c" },
  CANCELLED: { label: "Cancelado", bg: "#f1f5f9", color: "#475569" },
  REFUNDED: { label: "Estornado", bg: "#f3e8ff", color: "#7e22ce" },
  PARTIALLY_REFUNDED: { label: "Estorno parcial", bg: "#f3e8ff", color: "#7e22ce" },
};

const renderPaymentBadge = (value: any): React.ReactNode => {
  const status = value ? String(value) : null;
  if (!status) return <span style={{ color: "#94a3b8" }}>—</span>;
  const ui =
    PAYMENT_STATUS_UI[status] ?? { label: status, bg: "#f1f5f9", color: "#475569" };
  return (
    <span
      style={{
        display: "inline-block",
        padding: "2px 10px",
        borderRadius: 999,
        background: ui.bg,
        color: ui.color,
        fontSize: 12,
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      {ui.label}
    </span>
  );
};

// ── Coluna "Forma": método + momento do pagamento (lidos direto da linha; serializados
// no JSON mesmo com @Visible(table=false)). Ex.: "PIX no checkout", "Na entrega", "Mesa".
const PAYMENT_METHOD_LABEL: Record<string, string> = {
  PIX: "PIX",
  CASH: "Dinheiro",
  CREDIT_CARD: "Cartão",
  DEBIT_CARD: "Cartão",
  BANK_SLIP: "Boleto",
  WALLET: "Carteira",
};

const renderForma = (_value: any, row: any): React.ReactNode => {
  const method = row?.customerPaymentMethod;
  const methodLabel = method ? PAYMENT_METHOD_LABEL[method] ?? method : null;
  const timing = row?.paymentTiming;
  if (timing === "AT_CHECKOUT") return methodLabel ? `${methodLabel} no checkout` : "No checkout";
  if (timing === "ON_DELIVERY") return methodLabel ? `${methodLabel} na entrega` : "Na entrega";
  if (row?.orderType === "TABLE") return "Mesa";
  return methodLabel ?? <span style={{ color: "#94a3b8" }}>—</span>;
};

// Estabelecimento (CLIENT) só vê os próprios pedidos no balcão/entrega — colunas que viram ruído
// pra ele ficam escondidas por padrão na 1ª visita (depois ele ajusta no seletor de Colunas).
// "storeName" (Estabelecimento) é sempre o próprio dele, então é removida de vez da tabela (tableHideFields).
const ESTABLISHMENT_DEFAULT_HIDDEN = ["tableNumberField", "notes", "deliveryAddress"];
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
  const establishment = isEstablishment();

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
      // Estabelecimento: só visualiza/atende o pedido (edit vira "lupa"), sem excluir nem imprimir;
      // a coluna Estabelecimento é redundante (é sempre ele mesmo).
      disableDelete={establishment}
      editIcon={establishment ? <FiSearch /> : undefined}
      editTitle={establishment ? "Visualizar" : undefined}
      defaultHiddenColumns={establishment ? ESTABLISHMENT_DEFAULT_HIDDEN : undefined}
      tableHideFields={establishment ? ["storeName"] : []}
      hiddenFields={["deliveryLatitude", "deliveryLongitude", "items"]}
      hideFields={["subtotal", "deliveryFee", "total", "estimatedPreparationMinutes"]}
      // Colunas de pagamento (não vêm no metadata): situação consolidada + forma de pagamento
      showFields={["paymentSituation", "paymentForma"]}
      customActions={establishment ? undefined : (row: any) => (
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
        paymentSituation: (value) => renderPaymentBadge(value),
        paymentForma: (value, row: any) => renderForma(value, row),
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
