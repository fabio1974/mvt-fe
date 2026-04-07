import React, { useEffect, useState } from "react";
import EntityCRUD from "../Generic/EntityCRUD";
import { getUserId } from "../../utils/auth";
import { api } from "../../services/api";

/**
 * Página de Dados Bancários do Usuário
 *
 * Busca a conta bancária pelo userId (UUID) via /api/bank-accounts/user/{userId}
 * e depois carrega no EntityCRUD pelo ID numérico da conta.
 */
const BankAccountPage: React.FC = () => {
  const userId = getUserId();
  const [bankAccountId, setBankAccountId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!userId) return;

    const loadBankAccount = async () => {
      try {
        const resp = await api.get(`/api/bank-accounts/user/${userId}`);
        const data = resp.data as any;
        if (data?.id) {
          setBankAccountId(data.id);
        } else {
          setNotFound(true);
        }
      } catch (err: any) {
        if (err?.response?.status === 404) {
          setNotFound(true);
        } else {
          console.error("Erro ao buscar conta bancária:", err);
          setNotFound(true);
        }
      } finally {
        setLoading(false);
      }
    };

    loadBankAccount();
  }, [userId]);

  if (!userId) {
    return (
      <div style={{ padding: "20px", textAlign: "center" }}>
        <p>Erro: Usuário não autenticado</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center", color: "#6b7280" }}>
        Carregando dados bancários...
      </div>
    );
  }

  return (
    <EntityCRUD
      entityName="bankAccount"
      entityId={notFound ? undefined : bankAccountId ?? undefined}
      initialMode={notFound ? "create" : "view"}
      hideTable={true}
      showEditButton={!notFound}
      pageTitle="Meus Dados Bancários"
      pageDescription={notFound ? "Cadastre suas informações bancárias" : "Visualize e edite suas informações bancárias"}
      hiddenFields={["user"]}
      defaultValues={{ user: userId }}
    />
  );
};

export default BankAccountPage;
