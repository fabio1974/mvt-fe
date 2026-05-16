import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD completo para Gerentes (ORGANIZER)
 *
 * Filtra usuários com role = ORGANIZER.
 * Nota (2026-05-07): botão "Gerenciar Conta Bancária" removido — repasses
 * agora saem 100% via PIX-out. Chave PIX é editada nos campos pixKey/pixKeyType
 * do formulário do próprio gerente.
 */
const ManagerCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="user"
      hideArrayFields={false}
      hideFields={["clientContracts", "employmentContracts", "vehicles", "storeProfile", "foodNegotiatedPercentage"]}
      hiddenFields={["clientContracts", "employmentContracts", "vehicles", "storeProfile", "foodNegotiatedPercentage"]}
      pageTitle="Gerentes"
      pageDescription="Gerencie os gerentes (organizadores) cadastrados na plataforma"
      initialFilters={{ role: "ORGANIZER" }}
      showFields={["deliveryNegotiatedPercentage"]}
      customRenderers={{
        deliveryNegotiatedPercentage: (value: unknown) => {
          if (value == null || value === "") {
            return (
              <span style={{ color: "#94a3b8", fontStyle: "italic" }}>
                padrão site
              </span>
            );
          }
          const pct = typeof value === "number" ? value : Number(value);
          return (
            <span style={{ color: "#1d4ed8", fontWeight: 600 }}>
              {pct.toFixed(2).replace(".", ",")}%
            </span>
          );
        },
      }}
    />
  );
};

export default ManagerCRUDPage;
