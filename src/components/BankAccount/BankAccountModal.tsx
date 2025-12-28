import React, { useState, useEffect } from "react";
import EntityForm from "../Generic/EntityForm";
import { useFormMetadata } from "../../hooks/useFormMetadata";
import { FiCreditCard, FiX } from "react-icons/fi";
import { api } from "../../services/api";
import "./BankAccountModal.css";

interface BankAccountModalProps {
  isOpen: boolean;
  userId: string | number | null;
  userName?: string;
  onClose: () => void;
}

/**
 * Modal reutilizável para gerenciar conta bancária de um usuário
 * Busca automaticamente a conta existente ou permite criar nova
 */
const BankAccountModal: React.FC<BankAccountModalProps> = ({
  isOpen,
  userId,
  userName,
  onClose,
}) => {
  const [existingBankAccount, setExistingBankAccount] = useState<any>(null);
  const [loadingBankAccount, setLoadingBankAccount] = useState(false);
  const { formMetadata: bankAccountMetadata, isLoading } = useFormMetadata("bankAccount");

  // Busca a conta bancária existente quando o modal abre
  useEffect(() => {
    if (isOpen && userId) {
      setLoadingBankAccount(true);
      setExistingBankAccount(null);

      // Busca conta bancária do usuário selecionado
      api
        .get(`/api/bank-accounts/user/${userId}`)
        .then((response) => {
          if (response.data) {
            // Encontrou conta bancária existente
            setExistingBankAccount(response.data);
          }
          setLoadingBankAccount(false);
        })
        .catch((error) => {
          console.error("Erro ao buscar conta bancária:", error);
          // Não faz nada, deixa como criação de nova conta
          setLoadingBankAccount(false);
        });
    }
  }, [isOpen, userId]);

  if (!isOpen || !userId) return null;

  return (
    <div className="bank-account-modal-overlay" onClick={onClose}>
      <div className="bank-account-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bank-account-modal-header">
          <h2>
            <FiCreditCard size={24} style={{ marginRight: "10px" }} />
            {userName || "Conta Bancária"}
          </h2>
          <button className="bank-account-modal-close" onClick={onClose}>
            <FiX size={24} />
          </button>
        </div>
        <div className="bank-account-modal-body">
          {isLoading || loadingBankAccount ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p>Carregando...</p>
            </div>
          ) : bankAccountMetadata ? (
            <EntityForm
              metadata={{
                ...bankAccountMetadata,
                // Remove o título interno do formulário
                title: "",
                // Endpoint correto baseado no modo:
                // - POST (create): /api/bank-accounts
                // - PUT (edit): /api/bank-accounts/{id} (EntityForm adiciona o ID automaticamente se entityId estiver presente)
                endpoint: `/api/bank-accounts`
              }}
              entityId={existingBankAccount?.id}
              mode={existingBankAccount ? "edit" : "create"}
              onSuccess={() => {
                onClose();
                setExistingBankAccount(null);
              }}
              onCancel={() => {
                onClose();
                setExistingBankAccount(null);
              }}
              initialValues={
                existingBankAccount
                  ? { ...existingBankAccount, user: { id: userId } }
                  : { user: { id: userId } }
              }
              hiddenFields={["user"]}
            />
          ) : (
            <div style={{ textAlign: "center", padding: "20px", color: "red" }}>
              <p>Erro ao carregar formulário de conta bancária</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankAccountModal;
