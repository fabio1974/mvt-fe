import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import FoodOrderEditPanel from "./FoodOrderEditPanel";
/**
 * Página de CRUD para Pedidos (Zapi-Food)
 *
 * - Listar: Filtros + tabela genérica (EntityCRUD)
 * - View: Modo view genérico
 * - Create: Não existe (pedido vem do mobile)
 * - Edit: Componente customizado com botões de status
 */
const FoodOrderCRUDPage: React.FC = () => {

  return (
    <EntityCRUD
      entityName="foodOrder"
      hideCreateButton={true}
      hiddenFields={["deliveryLatitude", "deliveryLongitude", "items"]}
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
