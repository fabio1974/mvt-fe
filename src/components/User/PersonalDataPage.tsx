import React, { useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserId, getUserRole } from "../../utils/auth";

/**
 * Página de Dados Pessoais do Usuário
 *
 * Usa o componente genérico EntityCRUD em modo view/edit:
 * - Carrega dados do usuário logado automaticamente
 * - Inicia em modo VIEW (campos desabilitados)
 * - Botão "Editar" habilita os campos (modo EDIT)
 * - Após salvar, volta para VIEW
 * - Breadcrumb no topo
 * 
 * Para clientes e motoboys:
 * - Subforms de contratos (clientContracts, employmentContracts) são escondidos no modo edit
 * - Apenas visíveis no modo view
 */
const PersonalDataPage: React.FC = () => {
  const userId = getUserId();
  const userRole = getUserRole();
  const [currentMode, setCurrentMode] = useState<"view" | "edit">("view");
  
  // Verifica se é cliente ou motoboy
  const isClient = userRole === "ROLE_CLIENT" || userRole === "CLIENT";
  const isCourier = userRole === "ROLE_COURIER" || userRole === "COURIER";
  
  // Campos a esconder para clientes e motoboys no modo edit
  const hiddenFieldsForContractUsers = (isClient || isCourier) && currentMode === "edit" 
    ? ["clientContracts", "employmentContracts"] 
    : [];

  if (!userId) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Erro: Usuário não autenticado</p>
      </div>
    );
  }

  return (
    <EntityCRUD
      entityName="user"
      entityId={userId}
      initialMode="view"
      hideTable={true}
      showEditButton={true}
      pageTitle="Meus Dados Pessoais"
      pageDescription="Visualize e edite suas informações pessoais"
      hiddenFields={hiddenFieldsForContractUsers}
      onModeChange={(mode) => {
        // Só atualiza se for view ou edit (ignora table e create)
        if (mode === "view" || mode === "edit") {
          setCurrentMode(mode);
        }
      }}
    />
  );
};

export default PersonalDataPage;
