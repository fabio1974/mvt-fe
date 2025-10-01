import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { hasOrganization, getOrganizationId } from "../../utils/auth";
import { FiCalendar } from "react-icons/fi";
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormSelect,
  FormActions,
  FormButton,
  FormDatePicker,
  FormDateRangePicker,
  CityTypeahead,
} from "../Common/FormComponents";

export default function CreateEventForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState<Date | null>(null);
  const [registrationStart, setRegistrationStart] = useState<Date | null>(null);
  const [registrationEnd, setRegistrationEnd] = useState<Date | null>(null);
  const [location, setLocation] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("Brasil");
  const [maxParticipants, setMaxParticipants] = useState("");
  const [eventType, setEventType] = useState("RUNNING");
  const [status, setStatus] = useState("DRAFT");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Verificar se o usuário tem uma organização ao carregar o componente
  useEffect(() => {
    const userHasOrganization = hasOrganization();
    if (!userHasOrganization) {
      navigate("/organizacao?from=create-event");
    }
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Obter o organizationId do token ou localStorage
      const organizationId = getOrganizationId();

      if (!organizationId) {
        setError(
          "Organization ID não encontrado. Verifique se sua organização está configurada."
        );
        setLoading(false);
        return;
      }

      const eventData = {
        name,
        description,
        eventDate: eventDate?.toISOString(),
        registrationStart: registrationStart?.toISOString(),
        registrationEnd: registrationEnd?.toISOString(),
        location,
        city,
        state,
        country,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        eventType,
        status,
        organizationId, // Adicionar organizationId ao payload
      };

      await api.post("/events", eventData);
      setSuccess("Evento criado com sucesso!");
      setTimeout(() => {
        navigate("/meus-eventos");
      }, 2000);
    } catch (err) {
      setError("Erro ao criar evento.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const eventTypeOptions = [
    { value: "RUNNING", label: "Corrida" },
    { value: "CYCLING", label: "Ciclismo" },
    { value: "TRIATHLON", label: "Triathlon" },
    { value: "SWIMMING", label: "Natação" },
    { value: "OTHER", label: "Outro" },
  ];

  const statusOptions = [
    { value: "DRAFT", label: "Rascunho" },
    { value: "PUBLISHED", label: "Publicado" },
    { value: "CANCELLED", label: "Cancelado" },
  ];

  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        padding: "40px 20px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <FormContainer
          title="Criar Novo Evento Esportivo"
          icon={<FiCalendar />}
        >
          <form onSubmit={handleSubmit}>
            {/* Nome e Descrição */}
            <FormRow columns={1}>
              <FormField label="Nome do Evento" required>
                <FormInput
                  type="text"
                  placeholder="Digite o nome do evento"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </FormField>
            </FormRow>

            <FormRow columns={1}>
              <FormField label="Descrição" required>
                <textarea
                  className="form-input"
                  placeholder="Descreva o evento"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  required
                />
              </FormField>
            </FormRow>

            {/* Data do Evento e Tipo */}
            <FormRow columns={2}>
              <FormField label="Data do Evento" required>
                <FormDatePicker
                  selected={eventDate}
                  onChange={(date) => setEventDate(date)}
                  placeholder="Selecione a data"
                  minDate={new Date()}
                  required
                />
              </FormField>
              <FormField label="Tipo de Evento" required>
                <FormSelect
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  options={eventTypeOptions}
                  required
                />
              </FormField>
            </FormRow>

            {/* Período das Inscrições */}
            <FormRow columns={1}>
              <FormField label="Período das Inscrições" required>
                <FormDateRangePicker
                  startDate={registrationStart}
                  endDate={registrationEnd}
                  onStartDateChange={setRegistrationStart}
                  onEndDateChange={setRegistrationEnd}
                  startPlaceholder="Início das inscrições"
                  endPlaceholder="Fim das inscrições"
                  minDate={new Date()}
                  maxDate={eventDate || undefined}
                  required
                />
              </FormField>
            </FormRow>

            {/* Local do Evento */}
            <FormRow columns={1}>
              <FormField label="Local do Evento" required>
                <FormInput
                  type="text"
                  placeholder="Endereço ou local do evento"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
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
                    setCity(selectedCity.name);
                    setState(selectedCity.state);
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
                  disabled
                  required
                />
              </FormField>
            </FormRow>

            {/* País */}
            <FormRow columns={1}>
              <FormField label="País" required>
                <FormInput
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  required
                />
              </FormField>
            </FormRow>

            {/* Máximo de Participantes e Status */}
            <FormRow columns={2}>
              <FormField label="Máximo de Participantes">
                <FormInput
                  type="number"
                  placeholder="Ex: 500"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  min="1"
                />
              </FormField>
              <FormField label="Status" required>
                <FormSelect
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={statusOptions}
                  required
                />
              </FormField>
            </FormRow>

            {/* Mensagens de erro e sucesso */}
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

            {/* Botão de Submit */}
            <FormActions>
              <FormButton type="submit" disabled={loading} variant="primary">
                {loading ? "Criando..." : "Criar Evento"}
              </FormButton>
            </FormActions>
          </form>
        </FormContainer>
      </div>
    </div>
  );
}
