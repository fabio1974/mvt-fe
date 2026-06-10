import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAlertTriangle, FiChevronRight } from "react-icons/fi";
import { api } from "../../services/api";
import { getUserId } from "../../utils/auth";
import { maskPhone, maskCPF, maskCNPJ, unmaskValue, isValidPhone, isValidCPF, isValidCNPJ } from "../../utils/masks";
import type { ActivationStatus } from "../../services/activationService";
import { MISSING_ITEM_ROUTES } from "../../services/activationService";

/**
 * Modal BLOQUEANTE de cadastro incompleto, em formato wizard: preenche inline
 * as pendências do CLIENT (telefone, chave PIX, pagamento PIX) sem sair do
 * popup. Pendências que exigem fluxo próprio (frota/motoboy) caem num botão que
 * leva pra página. Salva via PUT /api/users/{id} (telefone+pix, parcial) e
 * PUT /api/customers/me/payment-preference/pix, depois re-checa o status.
 */

const PIX_KEY_TYPES: Array<{ value: string; label: string; placeholder: string }> = [
  { value: "CPF", label: "CPF", placeholder: "000.000.000-00" },
  { value: "CNPJ", label: "CNPJ", placeholder: "00.000.000/0000-00" },
  { value: "EMAIL", label: "E-mail", placeholder: "voce@exemplo.com" },
  { value: "PHONE", label: "Telefone", placeholder: "+5585999999999" },
  { value: "EVP", label: "Chave aleatória (EVP)", placeholder: "xxxxxxxx-xxxx-..." },
];

// Itens que sabemos preencher dentro do próprio wizard.
const INLINE_KEYS = new Set(["phone", "pixKey", "paymentMethod"]);

// Aplica máscara no campo da chave conforme o tipo (CPF/CNPJ formatam; demais ficam crus).
const maskPixKey = (type: string, raw: string): string =>
  type === "CPF" ? maskCPF(raw) : type === "CNPJ" ? maskCNPJ(raw) : raw;

// Valida a chave PIX conforme o tipo. Retorna mensagem de erro ou null se válida.
// String vazia também retorna null (o "vazio" é tratado pelo gate do botão, sem erro vermelho).
const pixKeyError = (type: string, key: string): string | null => {
  const v = key.trim();
  if (!v) return null;
  switch (type) {
    case "CPF":
      return isValidCPF(v) ? null : "CPF inválido.";
    case "CNPJ":
      return isValidCNPJ(v) ? null : "CNPJ inválido.";
    case "EMAIL":
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) ? null : "E-mail inválido.";
    case "PHONE": {
      const digits = unmaskValue(v); // aceita com/sem +55 (10 a 13 dígitos)
      return digits.length >= 10 && digits.length <= 13 ? null : "Telefone inválido.";
    }
    default:
      return null; // EVP/aleatória: sem validação estrita
  }
};

// Valor a enviar pro BE: CPF/CNPJ vão só dígitos; demais vão como digitado.
const pixKeyForPayload = (type: string, key: string): string =>
  type === "CPF" || type === "CNPJ" ? unmaskValue(key) : key.trim();

interface ActivationPendingModalProps {
  status: ActivationStatus;
  /** Re-busca o status no BE após salvar; se ficar enabled, o modal some. */
  onSaved: () => void;
}

const ActivationPendingModal: React.FC<ActivationPendingModalProps> = ({ status, onSaved }) => {
  const navigate = useNavigate();
  const userId = getUserId();

  const [phone, setPhone] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState(""); // vazio = placeholder "Tipo"
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!status || status.enabled) return null;

  const needsPhone = status.missing.includes("phone");
  const needsPix = status.missing.includes("pixKey");
  const needsPayment = status.missing.includes("paymentMethod");
  // Pendências sem preenchimento inline (ex: frota) → botão pra página.
  const externalItems = status.missing.filter((k) => !INLINE_KEYS.has(k));
  const hasInline = needsPhone || needsPix || needsPayment;

  const pixPlaceholder = PIX_KEY_TYPES.find((t) => t.value === pixKeyType)?.placeholder ?? "";

  // Habilita "Salvar" só quando os campos obrigatórios estão completos:
  // telefone válido (quando pendente) e tipo+chave PIX preenchidos (quando pendente).
  const phoneOk = !needsPhone || isValidPhone(unmaskValue(phone));
  const pixOk = !needsPix || (pixKeyType !== "" && pixKey.trim() !== "" && pixKeyError(pixKeyType, pixKey) === null);
  const canSubmit = phoneOk && pixOk;

  const handleSave = async () => {
    setError(null);
    if (!userId) {
      setError("Usuário não autenticado.");
      return;
    }
    // Validações
    if (needsPhone) {
      const digits = unmaskValue(phone);
      if (!isValidPhone(digits)) {
        setError("Telefone inválido. Use DDD + número.");
        return;
      }
    }
    if (needsPix) {
      if (!pixKeyType) {
        setError("Selecione o tipo da chave PIX.");
        return;
      }
      if (!pixKey.trim()) {
        setError("Informe sua chave PIX.");
        return;
      }
      const pixErr = pixKeyError(pixKeyType, pixKey);
      if (pixErr) {
        setError(pixErr);
        return;
      }
    }

    setSaving(true);
    try {
      // Telefone + chave PIX num único PUT parcial em /users/{id}.
      const userPayload: Record<string, unknown> = {};
      if (needsPhone) {
        const digits = unmaskValue(phone);
        userPayload.phoneDdd = digits.slice(0, 2);
        userPayload.phoneNumber = digits.slice(2);
      }
      if (needsPix) {
        userPayload.pixKey = pixKeyForPayload(pixKeyType, pixKey);
        userPayload.pixKeyType = pixKeyType;
      }
      if (Object.keys(userPayload).length > 0) {
        await api.put(`/api/users/${userId}`, userPayload);
      }
      if (needsPayment) {
        await api.put("/api/customers/me/payment-preference/pix", {});
      }
      onSaved();
    } catch (e: unknown) {
      const resp = (e as { response?: { data?: { message?: string; error?: string } } })?.response;
      setError(resp?.data?.message || resp?.data?.error || "Falha ao salvar. Tente novamente.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={overlay}>
      <div style={card}>
        <div style={{ textAlign: "center", marginBottom: 16 }}>
          <div style={iconCircle}>
            <FiAlertTriangle size={32} color="#f59e0b" />
          </div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#111827", margin: 0 }}>
            Complete seu cadastro
          </h2>
          <p style={{ fontSize: 14, color: "#6b7280", marginTop: 8 }}>
            Preencha os dados abaixo para liberar sua loja:
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {needsPhone && (
            <div>
              <label style={label}>Telefone de atendimento (com DDD)</label>
              <div style={{ fontSize: 12, color: "#6b7280", margin: "-2px 0 6px" }}>
                Número do seu estabelecimento — o cliente liga aqui pra tirar dúvidas do pedido.
              </div>
              <input
                style={input}
                inputMode="tel"
                placeholder="(85) 99999-9999"
                value={phone}
                onChange={(e) => { setPhone(maskPhone(e.target.value)); setError(null); }}
              />
            </div>
          )}

          {needsPix && (
            <div>
              <label style={label}>Chave PIX (onde você recebe seus repasses)</label>
              <div style={{ display: "flex", gap: 8 }}>
                <select style={{ ...input, flex: "0 0 130px" }} value={pixKeyType} onChange={(e) => { setPixKeyType(e.target.value); setPixKey(""); setError(null); }}>
                  <option value="">Tipo</option>
                  {PIX_KEY_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
                <input style={{ ...input, flex: 1 }} placeholder={pixPlaceholder} value={pixKey} onChange={(e) => { setPixKey(maskPixKey(pixKeyType, e.target.value)); setError(null); }} />
              </div>
              {pixKeyError(pixKeyType, pixKey) && (
                <div style={{ fontSize: 12, color: "#dc2626", marginTop: 4 }}>{pixKeyError(pixKeyType, pixKey)}</div>
              )}
            </div>
          )}

          {needsPayment && (
            <div style={infoBox}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#111827" }}>Pagamento via PIX</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 2 }}>
                Será ativado automaticamente como sua forma de pagamento preferida para a plataforma (quando necessário).
              </div>
            </div>
          )}

          {/* Pendências que exigem fluxo próprio (ex: frota de motoboys). */}
          {externalItems.map((key) => {
            const message = status.messages[key] || key;
            const target = MISSING_ITEM_ROUTES[key];
            return (
              <button key={key} onClick={() => target && navigate(target.route)} disabled={!target} style={externalBtn(!!target)}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{message}</div>
                  {target && <div style={{ fontSize: 12, color: "#1d4ed8", marginTop: 2 }}>{target.label}</div>}
                </div>
                {target && <FiChevronRight size={20} color="#9ca3af" style={{ flexShrink: 0 }} />}
              </button>
            );
          })}
        </div>

        {error && (
          <div style={{ background: "#fee2e2", color: "#991b1b", borderRadius: 8, padding: "10px 12px", fontSize: 13, marginTop: 14 }}>
            {error}
          </div>
        )}

        {hasInline && (
          <button
            onClick={handleSave}
            disabled={saving || !canSubmit}
            style={{ ...saveBtn, opacity: saving || !canSubmit ? 0.5 : 1, cursor: saving || !canSubmit ? "not-allowed" : "pointer" }}
          >
            {saving ? "Salvando..." : "Salvar e continuar"}
          </button>
        )}

        <p style={{ fontSize: 12, color: "#9ca3af", textAlign: "center", marginTop: 14 }}>
          Assim que tudo estiver preenchido, sua loja é liberada automaticamente.
        </p>
      </div>
    </div>
  );
};

const overlay: React.CSSProperties = {
  position: "fixed",
  inset: 0,
  zIndex: 2000, // acima da sidebar (1100) e do header — trava a tela inteira
  background: "rgba(15, 23, 42, 0.55)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: 16,
};
const card: React.CSSProperties = {
  background: "#fff",
  borderRadius: 16,
  width: "100%",
  maxWidth: 460,
  maxHeight: "88vh",
  overflowY: "auto",
  padding: 24,
  boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
};
const iconCircle: React.CSSProperties = {
  width: 64,
  height: 64,
  borderRadius: "50%",
  background: "#fef3c7",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 12px",
};
const label: React.CSSProperties = { display: "block", fontSize: 13, fontWeight: 600, color: "#374151", marginBottom: 6 };
const input: React.CSSProperties = {
  width: "100%",
  border: "1px solid #cbd5e1",
  borderRadius: 10,
  padding: "10px 12px",
  fontSize: 14,
  boxSizing: "border-box",
};
const infoBox: React.CSSProperties = { border: "1px solid #e5e7eb", borderRadius: 10, padding: "10px 12px", background: "#f9fafb" };
const saveBtn: React.CSSProperties = {
  width: "100%",
  marginTop: 18,
  border: "none",
  borderRadius: 10,
  padding: 14,
  cursor: "pointer",
  fontSize: 15,
  fontWeight: 700,
  background: "#dbeafe",
  color: "#1d4ed8",
};
const externalBtn = (enabled: boolean): React.CSSProperties => ({
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  textAlign: "left",
  border: "1px solid #e5e7eb",
  borderRadius: 10,
  padding: "12px 14px",
  background: enabled ? "#fff" : "#f9fafb",
  cursor: enabled ? "pointer" : "default",
});

export default ActivationPendingModal;
