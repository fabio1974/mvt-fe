import React, { useState, useEffect } from "react";
import EntityForm from "../Generic/EntityForm";
import { useFormMetadata } from "../../hooks/useFormMetadata";
import { FiCreditCard, FiCalendar } from "react-icons/fi";
import { api } from "../../services/api";
import "./BankAccountModal.css";

interface BankAccountModalProps {
  isOpen: boolean;
  userId: string | number | null;
  userName?: string;
  onClose: () => void;
}

// Opções para o intervalo de transferência
const TRANSFER_INTERVAL_OPTIONS = [
  { value: "Daily", label: "Diário (todo dia útil)" },
  { value: "Weekly", label: "Semanal" },
  { value: "Monthly", label: "Mensal" },
];

// Opções para dias da semana (apenas dias úteis)
const WEEKLY_DAY_OPTIONS = [
  { value: 1, label: "Segunda-feira" },
  { value: 2, label: "Terça-feira" },
  { value: 3, label: "Quarta-feira" },
  { value: 4, label: "Quinta-feira" },
  { value: 5, label: "Sexta-feira" },
];

// Opções para dias do mês
const MONTHLY_DAY_OPTIONS = Array.from({ length: 31 }, (_, i) => ({
  value: i + 1,
  label: `Dia ${i + 1}`,
}));

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
  
  // Estados para os campos de saque automático
  const [transferInterval, setTransferInterval] = useState<string>("Daily");
  const [transferDay, setTransferDay] = useState<number>(0);

  // Busca a conta bancária existente quando o modal abre
  useEffect(() => {
    if (isOpen && userId) {
      setLoadingBankAccount(true);
      setExistingBankAccount(null);

      // Busca conta bancária do usuário selecionado
      api
        .get(`/api/bank-accounts/user/${userId}`)
        .then((response) => {
          const data = response.data as Record<string, unknown> | null;
          if (data) {
            // Encontrou conta bancária existente
            setExistingBankAccount(data);
            // Carrega os valores de saque automático
            setTransferInterval((data.transferInterval as string) || "Daily");
            setTransferDay((data.transferDay as number) ?? 0);
          } else {
            // Reseta para valores padrão
            setTransferInterval("Daily");
            setTransferDay(0);
          }
          setLoadingBankAccount(false);
        })
        .catch((error) => {
          console.error("Erro ao buscar conta bancária:", error);
          // Não faz nada, deixa como criação de nova conta
          setTransferInterval("Daily");
          setTransferDay(0);
          setLoadingBankAccount(false);
        });
    }
  }, [isOpen, userId]);
  
  // Quando o intervalo muda, ajusta o dia padrão
  useEffect(() => {
    if (transferInterval === "Daily") {
      setTransferDay(0);
    } else if (transferInterval === "Weekly" && (transferDay < 1 || transferDay > 5)) {
      setTransferDay(1); // Segunda-feira como padrão
    } else if (transferInterval === "Monthly" && (transferDay < 1 || transferDay > 31)) {
      setTransferDay(1); // Dia 1 como padrão
    }
  }, [transferInterval]);

  if (!isOpen || !userId) return null;
  
  // Renderiza o seletor de dia baseado no intervalo
  const renderDaySelector = () => {
    if (transferInterval === "Daily") {
      return null; // Não mostra seletor para diário
    }
    
    const options = transferInterval === "Weekly" ? WEEKLY_DAY_OPTIONS : MONTHLY_DAY_OPTIONS;
    const label = transferInterval === "Weekly" ? "Dia da Semana" : "Dia do Mês";
    
    return (
      <div className="transfer-field">
        <label>{label}</label>
        <select
          value={transferDay}
          onChange={(e) => setTransferDay(Number(e.target.value))}
          className="transfer-select"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="bank-account-modal-overlay" onClick={onClose}>
      <div className="bank-account-modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="bank-account-modal-header">
          <h2>
            <FiCreditCard size={24} style={{ marginRight: "10px" }} />
            {userName || "Conta Bancária"}
          </h2>
          <button className="bank-account-modal-close" onClick={onClose} title="Fechar">
            ×
          </button>
        </div>
        <div className="bank-account-modal-body">
          {isLoading || loadingBankAccount ? (
            <div style={{ textAlign: "center", padding: "20px" }}>
              <p>Carregando...</p>
            </div>
          ) : bankAccountMetadata ? (
            <>
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
                    ? { 
                        ...existingBankAccount, 
                        user: { id: userId }
                      }
                    : { 
                        user: { id: userId }
                      }
                }
                hiddenFields={["user", "transferInterval", "transferDay"]}
                additionalData={{
                  transferInterval,
                  transferDay: transferInterval === "Daily" ? 0 : transferDay
                }}
                renderBeforeButtons={() => (
                  <div className="transfer-config-section">
                    <h3>
                      <FiCalendar size={18} style={{ marginRight: "8px" }} />
                      Configuração de Saque Automático
                    </h3>
                    <p className="transfer-config-description">
                      Configure quando o saldo disponível será transferido automaticamente para sua conta bancária.
                    </p>
                    
                    <div className="transfer-fields-container">
                      <div className="transfer-field">
                        <label>Frequência do Saque</label>
                        <select
                          value={transferInterval}
                          onChange={(e) => setTransferInterval(e.target.value)}
                          className="transfer-select"
                        >
                          {TRANSFER_INTERVAL_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      
                      {renderDaySelector()}
                    </div>
                    
                    <div className="transfer-info">
                      {transferInterval === "Daily" && (
                        <p>💰 Seu saldo será transferido todo dia útil.</p>
                      )}
                      {transferInterval === "Weekly" && (
                        <p>💰 Seu saldo será transferido toda <strong>{WEEKLY_DAY_OPTIONS.find(d => d.value === transferDay)?.label}</strong>.</p>
                      )}
                      {transferInterval === "Monthly" && (
                        <p>💰 Seu saldo será transferido todo <strong>dia {transferDay}</strong> de cada mês.</p>
                      )}
                      <p style={{ marginTop: "8px", fontSize: "0.85em", color: "#666" }}>
                        ⚠️ Cada transferência tem um custo de <strong>R$ 3,67</strong> (TED).
                      </p>
                    </div>
                  </div>
                )}
              />
            </>
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
