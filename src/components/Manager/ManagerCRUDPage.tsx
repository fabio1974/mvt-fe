import React, { useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import BankAccountModal from "../BankAccount/BankAccountModal";
import { FiCreditCard } from "react-icons/fi";

/**
 * Página de CRUD completo para Gerentes (ORGANIZER)
 *
 * Filtra usuários com role = ORGANIZER
 * Adiciona ação customizada para gerenciar conta bancária do gerente
 */
const ManagerCRUDPage: React.FC = () => {
  const [bankAccountModalOpen, setBankAccountModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Custom actions para adicionar ícone de conta bancária
  const customActions = (row: any) => {
    return (
      <button
        onClick={() => {
          setSelectedUserId(row.id);
          setBankAccountModalOpen(true);
        }}
        className="btn-action"
        style={{
          backgroundColor: "transparent",
          border: "1px solid #10b981",
          color: "#10b981",
          borderRadius: "6px",
          padding: "6px 8px",
          cursor: "pointer",
          transition: "all 0.2s",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = "#10b981";
          e.currentTarget.style.color = "white";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = "transparent";
          e.currentTarget.style.color = "#10b981";
        }}
        title="Gerenciar Conta Bancária"
      >
        <FiCreditCard size={16} />
      </button>
    );
  };

  return (
    <>
      <EntityCRUD
        entityName="user"
        hideArrayFields={false}
        hideFields={["clientContracts", "employmentContracts"]}
        hiddenFields={["clientContracts", "employmentContracts"]}
        pageTitle="Gerentes"
        pageDescription="Gerencie os gerentes (organizadores) cadastrados na plataforma"
        initialFilters={{ role: "ORGANIZER" }}
        customActions={customActions}
      />

      <BankAccountModal
        isOpen={bankAccountModalOpen}
        userId={selectedUserId}
        onClose={() => {
          setBankAccountModalOpen(false);
          setSelectedUserId(null);
        }}
      />
    </>
  );
};

export default ManagerCRUDPage;
