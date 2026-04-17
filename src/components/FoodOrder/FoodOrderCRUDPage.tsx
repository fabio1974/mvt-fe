import React from "react";
import { FiPrinter } from "react-icons/fi";
import EntityCRUD from "../Generic/EntityCRUD";
import FoodOrderEditPanel from "./FoodOrderEditPanel";
import printKitchenOrder from "./printKitchenOrder";
import { api } from "../../services/api";

const handlePrint = async (orderId: number) => {
  try {
    const res = await api.get<any>(`/api/orders/${orderId}`);
    printKitchenOrder(res.data);
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

  return (
    <EntityCRUD
      entityName="foodOrder"
      hideCreateButton={true}
      disableView={true}
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
