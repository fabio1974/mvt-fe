import React from "react";
import EntityCRUD from "../Generic/EntityCRUD";

/**
 * Página de CRUD para Clientes (estabelecimentos).
 * Filtra usuários com role = CLIENT.
 *
 * Nota (2026-05-07): botão "Gerenciar Conta Bancária" removido — repasses
 * agora saem 100% via PIX-out. Chave PIX é editada nos campos pixKey/pixKeyType
 * do próprio formulário do estabelecimento.
 *
 * Coluna "Taxa Comida": vem do JsonGetter `foodNegotiatedPercentage` do User
 * (espelha `storeProfile.foodNegotiatedPercentage`). Vazio = sem negociação,
 * fallback pro site_configurations (hoje 10% = 4% gerente + 6% plataforma).
 */
const ClientCRUDPage: React.FC = () => {
  return (
    <EntityCRUD
      entityName="user"
      hideArrayFields={false}
      hideFields={["employmentContracts", "employmentContract", "vehicles", "storeProfile"]}
      hiddenFields={["employmentContracts", "employmentContract", "vehicles", "clientContracts", "bankAccount"]}
      pageTitle="Clientes"
      pageDescription="Gerencie os clientes cadastrados na plataforma"
      initialFilters={{ role: "CLIENT" }}
      showFields={["foodNegotiatedPercentage"]}
      customRenderers={{
        foodNegotiatedPercentage: (value: unknown) => {
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

export default ClientCRUDPage;
