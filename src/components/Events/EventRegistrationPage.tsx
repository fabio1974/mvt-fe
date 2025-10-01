import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import { extractIdFromSlug } from "../../utils/slug";
import {
  getUserId,
  getUserEmail,
  getUserName,
  getUserAdditionalData,
} from "../../utils/auth";
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormActions,
  FormButton,
  FormBirthDatePicker,
  CityTypeahead,
} from "../Common/FormComponents";
import { FiUser, FiSave } from "react-icons/fi";
import PaymentProcessor from "../Payment/PaymentProcessor";
import "./EventRegistrationPage.css";

interface Event {
  id: number;
  name: string;
  description: string;
  eventDate: string;
  registrationEnd: string;
  location: string;
  city: string;
  state: string;
  country: string;
  maxParticipants?: number;
  eventType: string;
  status: string;
}

export default function EventRegistrationPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Dados do usuário
  const userId = getUserId();
  const userEmail = getUserEmail();
  const userName = getUserName();
  const userAdditionalData = getUserAdditionalData();

  // Estados do formulário - pré-preenchidos com dados do token
  const [birthDate, setBirthDate] = useState<Date | null>(null);
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");

  const genderOptions = [
    { value: "M", label: "Masculino" },
    { value: "F", label: "Feminino" },
    { value: "O", label: "Outro" },
    { value: "N", label: "Prefiro não informar" },
  ];

  // Verificar se usuário está logado
  useEffect(() => {
    if (!userId) {
      navigate("/login");
      return;
    }
  }, [userId, navigate]);

  // Pré-preencher dados do usuário do token
  useEffect(() => {
    if (userAdditionalData) {
      if (userAdditionalData.birthDate) {
        setBirthDate(new Date(userAdditionalData.birthDate));
      }
      if (userAdditionalData.gender) {
        // Mapear valores do token para os valores do select
        const genderMapping: { [key: string]: string } = {
          MALE: "M",
          FEMALE: "F",
          OTHER: "O",
          NOT_INFORMED: "N",
        };
        setGender(
          genderMapping[userAdditionalData.gender] || userAdditionalData.gender
        );
      }
      if (userAdditionalData.city) {
        setCity(userAdditionalData.city);
      }
      if (userAdditionalData.state) {
        setState(userAdditionalData.state);
      }
      if (userAdditionalData.cpf) {
        setCpf(userAdditionalData.cpf);
      }
      if (userAdditionalData.phone) {
        setPhone(userAdditionalData.phone);
      }
    }
  }, [userAdditionalData]);

  // Debug: Monitorar mudanças no estado 'state'
  useEffect(() => {
    console.log("Estado mudou para:", state);
  }, [state]);

  // Carregar dados do evento
  useEffect(() => {
    const fetchEvent = async () => {
      if (!slug) return;

      setLoading(true);
      try {
        // Extrair ID do slug
        const eventId = extractIdFromSlug(slug);
        if (!eventId) {
          setError("URL inválida");
          setLoading(false);
          return;
        }

        const response = await api.get(`/events/public/${eventId}`);
        const eventData = response.data as Event;
        setEvent(eventData);

        // Verificar se ainda é possível se inscrever
        const registrationEndDate = new Date(eventData.registrationEnd);
        if (registrationEndDate < new Date()) {
          setError(
            "O período de inscrições para este evento já foi encerrado."
          );
        }
      } catch (err) {
        setError("Erro ao carregar dados do evento.");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [slug]);

  const [showPayment, setShowPayment] = useState(false);
  const [registrationId, setRegistrationId] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event || !userId) return;

    setSubmitting(true);
    setError("");
    setSuccess("");

    try {
      // 1. Primeiro, atualizar informações do usuário se necessário
      const hasDataToUpdate =
        (!userAdditionalData?.birthDate && birthDate) ||
        (!userAdditionalData?.gender && gender) ||
        (!userAdditionalData?.city && city) ||
        (!userAdditionalData?.state && state) ||
        (!userAdditionalData?.cpf && cpf) ||
        (!userAdditionalData?.phone && phone);

      if (hasDataToUpdate) {
        const userUpdateData = {
          ...(userAdditionalData?.birthDate
            ? {}
            : { birthDate: birthDate?.toISOString().split("T")[0] }),
          ...(userAdditionalData?.gender ? {} : { gender }),
          ...(userAdditionalData?.city ? {} : { city }),
          ...(userAdditionalData?.state ? {} : { state }),
          ...(userAdditionalData?.cpf ? {} : { cpf }),
          ...(userAdditionalData?.phone ? {} : { phone }),
        };

        // Atualizar dados do usuário
        await api.put(`/users/${userId}`, userUpdateData);
      }

      // 2. Fazer a inscrição no evento
      const registrationData = {
        user: {
          id: userId,
        },
        event: {
          id: event.id,
        },
        status: "PENDING",
      };

      const registrationResponse = await api.post(
        "/registrations",
        registrationData
      );
      const newRegistrationId = (registrationResponse.data as { id: number })
        .id;

      setRegistrationId(newRegistrationId);
      setSuccess(
        "Dados salvos com sucesso! Agora escolha a forma de pagamento."
      );

      // Mostrar o formulário de pagamento
      setShowPayment(true);
    } catch (err) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 409) {
        setError("Usuário já está inscrito neste evento.");
      } else if (error.response?.status === 400) {
        setError(
          "Não foi possível realizar a inscrição. Verifique os dados informados."
        );
      } else {
        setError("Erro ao realizar inscrição. Tente novamente.");
      }
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSuccess("Pagamento realizado com sucesso! Inscrição confirmada!");
    setTimeout(() => {
      navigate(`/evento/${slug}`);
    }, 2000);
  };

  const handlePaymentCancel = () => {
    setShowPayment(false);
    setSuccess("");
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <div>Carregando dados do evento...</div>
      </div>
    );
  }

  if (!event) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "50vh",
        }}
      >
        <div>Evento não encontrado.</div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        padding: "40px 20px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {/* Informações do Evento */}
        <div
          style={{
            backgroundColor: "white",
            padding: "24px",
            borderRadius: "8px",
            marginBottom: "24px",
            border: "1px solid #e5e7eb",
          }}
        >
          <h2
            style={{
              color: "#0099ff",
              fontSize: "1.5rem",
              marginBottom: "12px",
            }}
          >
            {event.name}
          </h2>
          <p style={{ color: "#6b7280", marginBottom: "8px" }}>
            <strong>Data:</strong>{" "}
            {new Date(event.eventDate).toLocaleDateString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
          <p style={{ color: "#6b7280", marginBottom: "8px" }}>
            <strong>Local:</strong> {event.location}, {event.city} -{" "}
            {event.state}
          </p>
          <p style={{ color: "#6b7280" }}>
            <strong>Modalidade:</strong> {event.eventType}
          </p>
        </div>

        <FormContainer title="Dados para Inscrição" icon={<FiUser />}>
          <form onSubmit={handleSubmit}>
            {/* Dados do usuário (só leitura) */}
            <FormRow columns={2}>
              <FormField label="Nome">
                <FormInput type="text" value={userName || ""} disabled />
              </FormField>
              <FormField label="E-mail">
                <FormInput type="email" value={userEmail || ""} disabled />
              </FormField>
            </FormRow>

            {/* Data de nascimento e Sexo */}
            <FormRow columns={2}>
              <FormField label="Data de Nascimento" required>
                <FormBirthDatePicker
                  selected={birthDate}
                  onChange={(date) => setBirthDate(date)}
                  placeholder="Selecione sua data de nascimento"
                  required
                />
              </FormField>
              <FormField label="Sexo" required>
                <FormSelect
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  options={genderOptions}
                  placeholder="Selecione"
                  required
                />
              </FormField>
            </FormRow>

            {/* Cidade e Estado */}
            <FormRow columns={2}>
              <FormField label="Cidade" required>
                <CityTypeahead
                  value={city}
                  onCitySelect={(selectedCity) => {
                    console.log("=== CITY SELECTION DEBUG ===");
                    console.log("Cidade selecionada:", selectedCity);
                    console.log("selectedCity.name:", selectedCity.name);
                    console.log("selectedCity.state:", selectedCity.state);
                    console.log(
                      "selectedCity.stateCode:",
                      selectedCity.stateCode
                    );

                    setCity(selectedCity.name);
                    const newState =
                      selectedCity.state || selectedCity.stateCode || "";
                    console.log("newState calculado:", newState);
                    console.log("Estado ANTES de setState:", state);
                    setState(newState);
                    console.log("setState chamado com:", newState);
                    console.log("=== FIM DEBUG ===");
                  }}
                  placeholder="Digite o nome da cidade..."
                  required
                />
              </FormField>
              <FormField label="Estado" required>
                <FormInput
                  type="text"
                  placeholder="Estado será preenchido automaticamente"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  style={{ backgroundColor: "#f9f9f9" }}
                  required
                />
              </FormField>
            </FormRow>

            {/* CPF e Telefone */}
            <FormRow columns={2}>
              <FormField label="CPF" required>
                <FormInput
                  type="text"
                  placeholder="000.000.000-00"
                  value={cpf}
                  onChange={(e) => setCpf(e.target.value)}
                  maxLength={14}
                  required
                />
              </FormField>
              <FormField label="Telefone" required>
                <FormInput
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                />
              </FormField>
            </FormRow>

            {/* Mensagens */}
            {error && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: "#ffe6e6",
                  color: "#d32f2f",
                  borderRadius: 8,
                  border: "1px solid #ffcdd2",
                  marginTop: "1rem",
                }}
              >
                {error}
              </div>
            )}

            {success && (
              <div
                style={{
                  padding: 12,
                  backgroundColor: "#e8f5e8",
                  color: "#2e7d32",
                  borderRadius: 8,
                  border: "1px solid #c8e6c9",
                  marginTop: "1rem",
                }}
              >
                {success}
              </div>
            )}

            {/* Botões de ação */}
            <FormActions>
              <FormButton
                type="button"
                variant="secondary"
                onClick={() => navigate(`/evento/${slug}`)}
              >
                Cancelar
              </FormButton>
              <FormButton
                type="submit"
                variant="primary"
                disabled={submitting}
                icon={<FiSave />}
              >
                {submitting ? "Inscrevendo..." : "Confirmar Inscrição"}
              </FormButton>
            </FormActions>
          </form>
        </FormContainer>

        {/* Seção de Pagamento */}
        {showPayment && registrationId && (
          <div
            style={{
              backgroundColor: "white",
              padding: "24px",
              borderRadius: "8px",
              marginTop: "24px",
              border: "1px solid #e5e7eb",
            }}
          >
            <PaymentProcessor
              registrationId={registrationId}
              amount={50.0} // Valor padrão - pode ser dinâmico baseado no evento
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentCancel={handlePaymentCancel}
            />
          </div>
        )}
      </div>
    </div>
  );
}
