import React, { useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import BankAccountModal from "../BankAccount/BankAccountModal";
import { FiCreditCard } from "react-icons/fi";

/**
 * Página de CRUD completo para Motoboys
 *
 * Usa o componente genérico EntityCRUD que integra:
 * - EntityFilters (com botão "Criar Novo")
 * - EntityTable (com ações de visualizar, editar, excluir)
 * - EntityForm (para criar, visualizar e editar)
 *
 * Toda a configuração vem do metadata do backend carregado
 * no início da aplicação pelo MetadataContext.
 */
const CourierCRUDPage: React.FC = () => {
  const [bankAccountModalOpen, setBankAccountModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  // Custom actions para adicionar ícone de conta bancária
  const customActions = (row: any) => {
    return (
      <button
        onClick={() => {
          setSelectedUserId(row.id);
          setSelectedUserName(row.name || row.username || "Usuário");
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
        hideFields={["clientContracts", "clientContract"]} // Esconde na tabela
        hiddenFields={["clientContracts", "clientContract"]} // Esconde no formulário
        pageTitle="Motoboys"
        pageDescription="Gerencie os motoboys da plataforma"
        initialFilters={{ role: "COURIER" }}
        customActions={customActions}
      />

      <BankAccountModal
        isOpen={bankAccountModalOpen}
        userId={selectedUserId}
        userName={selectedUserName}
        onClose={() => {
          setBankAccountModalOpen(false);
          setSelectedUserId(null);
          setSelectedUserName("");
        }}
      />
    </>
  );
};

export default CourierCRUDPage;
