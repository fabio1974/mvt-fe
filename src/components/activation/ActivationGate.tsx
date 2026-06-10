import React, { useCallback, useEffect, useState } from "react";
import { fetchActivationStatus } from "../../services/activationService";
import type { ActivationStatus } from "../../services/activationService";
import ActivationPendingModal from "./ActivationPendingModal";

/**
 * Monta o modal bloqueante de cadastro incompleto. Busca o status de ativação ao
 * montar e sempre que a aba volta ao foco (espelha o "reabre ao voltar pro
 * dashboard" do mobile). Renderizado no Dashboard só pra CLIENT.
 */
const ActivationGate: React.FC = () => {
  const [status, setStatus] = useState<ActivationStatus | null>(null);

  const refresh = useCallback(async () => {
    const s = await fetchActivationStatus();
    if (s) setStatus(s);
  }, []);

  useEffect(() => {
    refresh();
    const onFocus = () => refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  if (!status || status.enabled) return null;
  return <ActivationPendingModal status={status} onSaved={refresh} />;
};

export default ActivationGate;
