import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import EntityCRUD from "../Generic/EntityCRUD";
import BankAccountModal from "../BankAccount/BankAccountModal";
import { FiCreditCard, FiHome } from "react-icons/fi";

/**
 * Página de CRUD para Clientes
 * Filtra usuários com role = CLIENT
 */
const ClientCRUDPage: React.FC = () => {
  const navigate = useNavigate();
  const [bankAccountModalOpen, setBankAccountModalOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [selectedUserName, setSelectedUserName] = useState<string>("");

  const customActions = (row: any) => {
    const baseBtn: React.CSSProperties = {
      backgroundColor: "transparent",
      borderRadius: "6px",
      padding: "6px 8px",
      cursor: "pointer",
      transition: "all 0.2s",
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 4,
    };

    return (
      <>
        <button
          onClick={() => {
            setSelectedUserId(row.id);
            setSelectedUserName(row.name || row.username || "Usuário");
            setBankAccountModalOpen(true);
          }}
          className="btn-action"
          style={{ ...baseBtn, border: "1px solid #10b981", color: "#10b981" }}
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

        <button
          onClick={() => navigate(`/admin/dados-estabelecimento/${row.userId || row.id}`)}
          className="btn-action"
          style={{ ...baseBtn, border: "1px solid #3b82f6", color: "#3b82f6" }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#3b82f6";
            e.currentTarget.style.color = "white";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "transparent";
            e.currentTarget.style.color = "#3b82f6";
          }}
          title="Editar Dados do Estabelecimento"
        >
          <FiHome size={16} />
        </button>
      </>
    );
  };

  return (
    <>
      <EntityCRUD
        entityName="user"
        hideArrayFields={false}
        hideFields={["employmentContracts", "employmentContract", "vehicles"]} // Esconde na tabela
        hiddenFields={["employmentContracts", "employmentContract", "vehicles", "clientContracts", "bankAccount", "storeProfile"]} // Esconde no formulário
        pageTitle="Clientes"
        pageDescription="Gerencie os clientes cadastrados na plataforma"
        initialFilters={{ role: "CLIENT" }}
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

export default ClientCRUDPage;
