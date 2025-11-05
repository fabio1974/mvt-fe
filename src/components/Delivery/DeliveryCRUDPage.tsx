import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD para Deliveries (Entregas)
 */
const DeliveryCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="delivery"
      hideArrayFields={false}
      pageTitle="Entregas"
      pageDescription="Gerencie as entregas cadastradas na plataforma"
    />
  );
};

export default DeliveryCRUDPage;
