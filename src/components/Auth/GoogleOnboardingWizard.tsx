import { useEffect, useMemo, useState } from "react";
import { api } from "../../services/api";
import BrandName from "../Brand/BrandName";
import { persistAuthSession, type AuthUser } from "../../utils/auth";
import { USER_TYPE_OPTIONS } from "../../config/userTypes";
import { maskCPF, maskPhone, validateCPF } from "../../utils/masks";

/**
 * Wizard de onboarding pós "Continuar com Google" para usuário NOVO.
 *
 * Fluxo: escolhe o papel → CPF (aqui a conta é CRIADA via /auth/google + grava CPF)
 * → requisitos mínimos do papel escolhido (espelha UserActivationService do BE):
 *   CUSTOMER/WAITER → nenhum (já ativa)
 *   ORGANIZER/CLIENT → chave PIX
 *   COURIER → chave PIX + veículo + tipo de serviço
 * → confirma a ativação (GET /users/me/activation-status) e entra no app.
 *
 * Reusa os MESMOS endpoints autenticados do app/mobile (PUT /users/{id}, POST /vehicles),
 * por isso a conta é criada já no step de CPF: a partir daí o JWT autentica o resto.
 */

// Requisitos mínimos por papel (após o CPF). Fonte: UserActivationService.meetsPrerequisites.
const REQUIREMENTS: Record<string, StepId[]> = {
  CUSTOMER: [],
  WAITER: [],
  ORGANIZER: ["pixKey"],
  CLIENT: ["pixKey"],
  COURIER: ["pixKey", "vehicle", "serviceType"],
};

type StepId = "role" | "cpf" | "pixKey" | "vehicle" | "serviceType" | "done";

const PIX_KEY_TYPES = [
  { value: "CPF", label: "CPF" },
  { value: "EMAIL", label: "E-mail" },
  { value: "PHONE", label: "Telefone" },
  { value: "EVP", label: "Chave aleatória" },
  { value: "CNPJ", label: "CNPJ" },
];

const VEHICLE_TYPES = [
  { value: "MOTORCYCLE", label: "Moto" },
  { value: "CAR", label: "Automóvel" },
];

const VEHICLE_COLORS = [
  "BRANCO", "PRETO", "PRATA", "CINZA", "VERMELHO", "AZUL", "VERDE", "AMARELO",
  "LARANJA", "MARROM", "BEGE", "DOURADO", "ROSA", "ROXO", "VINHO", "FANTASIA", "OUTROS",
];
const VEHICLE_COLOR_LABELS: Record<string, string> = {
  BRANCO: "Branco", PRETO: "Preto", PRATA: "Prata", CINZA: "Cinza", VERMELHO: "Vermelho",
  AZUL: "Azul", VERDE: "Verde", AMARELO: "Amarelo", LARANJA: "Laranja", MARROM: "Marrom",
  BEGE: "Bege", DOURADO: "Dourado", ROSA: "Rosa", ROXO: "Roxo", VINHO: "Vinho",
  FANTASIA: "Fantasia", OUTROS: "Outros",
};

const SERVICE_TYPES = [
  { value: "DELIVERY", label: "Entrega" },
  { value: "PASSENGER_TRANSPORT", label: "Transporte de Passageiro" },
  { value: "BOTH", label: "Ambos" },
];

function extractMsg(e: unknown, fallback: string): string {
  if (e && typeof e === "object" && "response" in e) {
    const data = (e as { response?: { data?: { message?: string; error?: string } } }).response?.data;
    if (data?.message) return data.message;
    if (data?.error) return data.error;
  }
  return fallback;
}

interface Props {
  idToken: string;
  email: string;
  name?: string;
  initialRole?: string; // veio da aba de cadastro (wizard já escolheu o papel)
  onComplete: () => void;
  onClose: () => void;
}

export default function GoogleOnboardingWizard({ idToken, name, initialRole, onComplete, onClose }: Props) {
  const [role, setRole] = useState<string>(initialRole || "");
  const [stepIndex, setStepIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [userId, setUserId] = useState<string>("");
  const [created, setCreated] = useState(false);

  // Campos coletados
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [pixKey, setPixKey] = useState("");
  const [pixKeyType, setPixKeyType] = useState("CPF");
  const [vehicle, setVehicle] = useState({ type: "MOTORCYCLE", plate: "", brand: "", model: "", color: "BRANCO", year: "" });
  const [serviceType, setServiceType] = useState("DELIVERY");

  // Sequência de steps. Cresce quando o papel é escolhido.
  const sequence: StepId[] = useMemo(() => {
    const base: StepId[] = initialRole ? [] : ["role"];
    if (!role) return base.length ? base : ["role"];
    return [...base, "cpf", ...(REQUIREMENTS[role] || []), "done"];
  }, [role, initialRole]);

  const current = sequence[stepIndex];

  const advance = () => setStepIndex((i) => Math.min(i + 1, sequence.length - 1));

  // Cria a conta JÁ com CPF + telefone (atômico) ao sair do step. Se algo for inválido
  // ou o CPF duplicado, o BE não cria nada e ninguém loga — sem conta órfã.
  const createAccountAndSetCpf = async () => {
    const cleanCpf = cpf.replace(/\D/g, "");
    if (!validateCPF(cleanCpf)) {
      throw new Error("CPF inválido. Confira os dígitos e tente novamente.");
    }
    const cleanPhone = phone.replace(/\D/g, "");
    if (cleanPhone.length < 10 || cleanPhone.length > 11) {
      throw new Error("Digite um telefone válido com DDD.");
    }
    if (created) return; // já criada (ex.: usuário voltou e avançou de novo)
    const { data } = await api.post<{ token: string; user?: AuthUser }>("/auth/google", {
      idToken,
      role,
      document: cleanCpf,
      phone: cleanPhone,
    });
    persistAuthSession(data.token, data.user);
    setUserId(data.user?.userId || "");
    setCreated(true);
  };

  const savePixKey = async () => {
    if (!pixKey.trim()) throw new Error("Informe sua chave PIX.");
    await api.put(`/users/${userId}`, { pixKey: pixKey.trim(), pixKeyType });
  };

  const saveVehicle = async () => {
    if (!vehicle.plate.trim() || !vehicle.brand.trim() || !vehicle.model.trim()) {
      throw new Error("Preencha placa, marca e modelo.");
    }
    await api.post("/vehicles", {
      type: vehicle.type,
      plate: vehicle.plate.trim().toUpperCase(),
      brand: vehicle.brand.trim(),
      model: vehicle.model.trim(),
      color: vehicle.color,
      year: vehicle.year.trim() || undefined,
    });
  };

  const saveServiceType = async () => {
    await api.put(`/users/${userId}`, { serviceType });
  };

  // Executa a ação do step atual e avança.
  const handleNext = async () => {
    setError("");
    if (current === "role") {
      if (!role) return setError("Selecione um perfil.");
      advance();
      return;
    }
    setLoading(true);
    try {
      if (current === "cpf") await createAccountAndSetCpf();
      else if (current === "pixKey") await savePixKey();
      else if (current === "vehicle") await saveVehicle();
      else if (current === "serviceType") await saveServiceType();
      advance();
    } catch (e) {
      // Prioriza a mensagem amigável do BE (response.data.message). AxiosError também é
      // instanceof Error, então e.message seria o genérico "Request failed with status code 409".
      const apiMsg = extractMsg(e, "");
      setError(apiMsg || (e instanceof Error ? e.message : "Não foi possível continuar."));
    } finally {
      setLoading(false);
    }
  };

  const stepNumber = sequence.indexOf(current) + 1;
  const totalSteps = sequence.length;

  return (
    <div style={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div style={styles.card}>
        <div style={styles.progressTrack}>
          <div style={{ ...styles.progressFill, width: `${(stepNumber / totalSteps) * 100}%` }} />
        </div>

        {current === "role" && (
          <>
            <h2 style={styles.title}>Bem-vindo{name ? `, ${name.split(" ")[0]}` : ""}! 👋</h2>
            <p style={styles.subtitle}>Como você vai usar o <BrandName />?</p>
            <div style={styles.optionsList}>
              {USER_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  style={{ ...styles.option, ...(role === opt.value ? styles.optionSelected : {}) }}
                  onClick={() => setRole(opt.value)}
                >
                  <span style={styles.optionIcon}>{opt.icon}</span>
                  <span style={styles.optionContent}>
                    <span style={styles.optionLabel}>{opt.label}</span>
                    <span style={styles.optionDesc}>{opt.description}</span>
                  </span>
                </button>
              ))}
            </div>
          </>
        )}

        {current === "cpf" && (
          <>
            <h2 style={styles.title}>Seus dados</h2>
            <p style={styles.subtitle}>Precisamos do seu CPF e telefone para concluir o cadastro e liberar pedidos.</p>
            <label style={styles.fieldLabel}>CPF</label>
            <input
              autoFocus
              inputMode="numeric"
              placeholder="000.000.000-00"
              value={cpf}
              onChange={(e) => setCpf(maskCPF(e.target.value))}
              maxLength={14}
              style={styles.input}
            />
            <label style={styles.fieldLabel}>Telefone (com DDD)</label>
            <input
              inputMode="numeric"
              value={phone}
              onChange={(e) => setPhone(maskPhone(e.target.value))}
              maxLength={15}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleNext()}
              style={styles.input}
            />
          </>
        )}

        {current === "pixKey" && (
          <>
            <h2 style={styles.title}>Sua chave PIX</h2>
            <p style={styles.subtitle}>É por onde você recebe seus repasses na plataforma.</p>
            <label style={styles.fieldLabel}>Tipo de chave</label>
            <select value={pixKeyType} onChange={(e) => setPixKeyType(e.target.value)} style={styles.input}>
              {PIX_KEY_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <label style={styles.fieldLabel}>Chave PIX</label>
            <input
              autoFocus
              placeholder="Digite sua chave PIX"
              value={pixKey}
              onChange={(e) => setPixKey(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !loading && handleNext()}
              style={styles.input}
            />
          </>
        )}

        {current === "vehicle" && (
          <>
            <h2 style={styles.title}>Seu veículo</h2>
            <p style={styles.subtitle}>Com que você vai fazer as entregas/corridas?</p>
            <label style={styles.fieldLabel}>Tipo</label>
            <select value={vehicle.type} onChange={(e) => setVehicle({ ...vehicle, type: e.target.value })} style={styles.input}>
              {VEHICLE_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
            <label style={styles.fieldLabel}>Placa</label>
            <input placeholder="ABC1D23" value={vehicle.plate}
              onChange={(e) => setVehicle({ ...vehicle, plate: e.target.value })} style={styles.input} />
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={styles.fieldLabel}>Marca</label>
                <input placeholder="Honda" value={vehicle.brand}
                  onChange={(e) => setVehicle({ ...vehicle, brand: e.target.value })} style={styles.input} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.fieldLabel}>Modelo</label>
                <input placeholder="CG 160" value={vehicle.model}
                  onChange={(e) => setVehicle({ ...vehicle, model: e.target.value })} style={styles.input} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label style={styles.fieldLabel}>Cor</label>
                <select value={vehicle.color} onChange={(e) => setVehicle({ ...vehicle, color: e.target.value })} style={styles.input}>
                  {VEHICLE_COLORS.map((c) => <option key={c} value={c}>{VEHICLE_COLOR_LABELS[c]}</option>)}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label style={styles.fieldLabel}>Ano (opcional)</label>
                <input inputMode="numeric" placeholder="2022" value={vehicle.year}
                  onChange={(e) => setVehicle({ ...vehicle, year: e.target.value })} style={styles.input} />
              </div>
            </div>
          </>
        )}

        {current === "serviceType" && (
          <>
            <h2 style={styles.title}>Tipo de serviço</h2>
            <p style={styles.subtitle}>O que você vai fazer na plataforma?</p>
            <div style={styles.optionsList}>
              {SERVICE_TYPES.map((s) => (
                <button key={s.value} type="button"
                  style={{ ...styles.option, ...(serviceType === s.value ? styles.optionSelected : {}) }}
                  onClick={() => setServiceType(s.value)}>
                  <span style={styles.optionLabel}>{s.label}</span>
                </button>
              ))}
            </div>
          </>
        )}

        {current === "done" && <DoneStep onComplete={onComplete} />}

        {error && <div style={styles.errorBox}>{error}</div>}

        {current !== "done" && (
          <button onClick={handleNext} disabled={loading} style={styles.primaryButton}>
            {loading ? "Salvando..." : current === "role" ? "Continuar" : "Continuar"}
          </button>
        )}
      </div>
    </div>
  );
}

// Step final: confirma ativação no BE e entra no app.
interface ActivationStatus { enabled: boolean; missing: string[]; messages: Record<string, string> }

function DoneStep({ onComplete }: { onComplete: () => void }) {
  const [status, setStatus] = useState<ActivationStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const r = await api.get<ActivationStatus>("/users/me/activation-status");
        if (!cancelled) setStatus(r.data);
      } catch {
        if (!cancelled) setStatus(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  if (loading) return <p style={styles.subtitle}>Finalizando seu cadastro...</p>;

  const enabled = status?.enabled ?? true;
  const pending = (status?.missing || []).map((k) => status?.messages?.[k] || k);

  return (
    <>
      <h2 style={styles.title}>{enabled ? "Tudo pronto! 🎉" : "Cadastro criado!"}</h2>
      <p style={styles.subtitle}>
        {enabled
          ? (
            <>Sua conta está ativa. Aproveite o <BrandName />!</>
          )
          : "Sua conta foi criada. Você ainda pode completar os itens abaixo no app:"}
      </p>
      {!enabled && pending.length > 0 && (
        <ul style={{ textAlign: "left", color: "#6b7280", fontSize: "0.9rem", marginBottom: 16 }}>
          {pending.map((m, i) => <li key={i}>{m}</li>)}
        </ul>
      )}
      <button onClick={onComplete} style={styles.primaryButton}>Entrar</button>
    </>
  );
}

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
    display: "flex", alignItems: "center", justifyContent: "center", zIndex: 2000, padding: 16,
  },
  card: {
    background: "#fff", borderRadius: 16, padding: 24, width: "100%", maxWidth: 440,
    maxHeight: "90vh", overflowY: "auto", boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
  },
  progressTrack: { height: 4, background: "#e5e7eb", borderRadius: 2, marginBottom: 20, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #5b4cfa, #4c9aff)", transition: "width 0.3s" },
  title: { margin: "0 0 6px", fontSize: "1.3rem", color: "#111827", fontWeight: 700 },
  subtitle: { margin: "0 0 18px", fontSize: "0.92rem", color: "#6b7280" },
  optionsList: { display: "flex", flexDirection: "column", gap: 10, marginBottom: 8 },
  option: {
    display: "flex", alignItems: "center", gap: 14, padding: 14, background: "#f9fafb",
    border: "2px solid #e5e7eb", borderRadius: 12, cursor: "pointer", textAlign: "left", width: "100%",
  },
  optionSelected: { background: "#eff6ff", borderColor: "#3b82f6" },
  optionIcon: { fontSize: "1.6rem", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", background: "#fff", borderRadius: 8, boxShadow: "0 1px 3px rgba(0,0,0,0.1)", flexShrink: 0 },
  optionContent: { display: "flex", flexDirection: "column", flex: 1 },
  optionLabel: { fontSize: "1rem", fontWeight: 600, color: "#111827" },
  optionDesc: { fontSize: "0.82rem", color: "#6b7280", marginTop: 2 },
  fieldLabel: { display: "block", textAlign: "left", fontSize: "0.82rem", color: "#374151", fontWeight: 500, margin: "10px 0 4px" },
  input: {
    width: "100%", padding: "12px 14px", borderRadius: 10, border: "1px solid #d1d5db",
    fontSize: "1rem", boxSizing: "border-box", background: "#fff",
  },
  primaryButton: {
    width: "100%", marginTop: 18, padding: "13px 0", borderRadius: 10, border: "none",
    background: "linear-gradient(90deg, #5b4cfa, #4c9aff)", color: "#fff", fontWeight: 600,
    fontSize: "1rem", cursor: "pointer",
  },
  errorBox: {
    color: "#ef4444", textAlign: "center", fontSize: "0.9rem", padding: 12, marginTop: 12,
    background: "#fef2f2", borderRadius: 8, border: "1px solid #fecaca",
  },
};
