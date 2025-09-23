import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { hasOrganization, getOrganizationId } from "../../utils/auth";

export default function CreateEventForm() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [eventDate, setEventDate] = useState("");
  const [registrationStart, setRegistrationStart] = useState("");
  const [registrationEnd, setRegistrationEnd] = useState("");
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
        eventDate,
        registrationStart,
        registrationEnd,
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

  const inputStyle = {
    width: "100%",
    padding: 12,
    marginTop: 4,
    borderRadius: 8,
    border: "1px solid #ddd",
    fontSize: "1rem",
  };

  const labelStyle = {
    textAlign: "left" as const,
    fontWeight: 500,
    marginBottom: 4,
    display: "block",
  };

  return (
    <div style={{ maxWidth: 600, margin: "0 auto", padding: "20px" }}>
      <h2
        style={{
          textAlign: "center",
          marginBottom: 32,
          color: "#0099ff",
          fontSize: "1.8rem",
        }}
      >
        Criar Novo Evento Esportivo
      </h2>

      <form
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        onSubmit={handleSubmit}
      >
        <label style={labelStyle}>
          Nome do Evento *
          <input
            type="text"
            placeholder="Digite o nome do evento"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            style={inputStyle}
          />
        </label>

        <label style={labelStyle}>
          Descrição *
          <textarea
            placeholder="Descreva o evento"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={inputStyle}
          />
        </label>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <label style={labelStyle}>
            Data do Evento *
            <input
              type="datetime-local"
              required
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Tipo de Evento *
            <select
              required
              value={eventType}
              onChange={(e) => setEventType(e.target.value)}
              style={inputStyle}
            >
              <option value="RUNNING">Corrida</option>
              <option value="CYCLING">Ciclismo</option>
              <option value="TRIATHLON">Triathlon</option>
              <option value="SWIMMING">Natação</option>
              <option value="OTHER">Outro</option>
            </select>
          </label>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <label style={labelStyle}>
            Início das Inscrições *
            <input
              type="datetime-local"
              required
              value={registrationStart}
              onChange={(e) => setRegistrationStart(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Fim das Inscrições *
            <input
              type="datetime-local"
              required
              value={registrationEnd}
              onChange={(e) => setRegistrationEnd(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <label style={labelStyle}>
          Local do Evento *
          <input
            type="text"
            placeholder="Endereço ou local do evento"
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            style={inputStyle}
          />
        </label>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr 1fr",
            gap: 16,
          }}
        >
          <label style={labelStyle}>
            Cidade *
            <input
              type="text"
              placeholder="Cidade"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            Estado *
            <input
              type="text"
              placeholder="Estado/UF"
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={labelStyle}>
            País *
            <input
              type="text"
              required
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              style={inputStyle}
            />
          </label>
        </div>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <label style={labelStyle}>
            Máximo de Participantes
            <input
              type="number"
              placeholder="Ex: 500"
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(e.target.value)}
              style={inputStyle}
              min="1"
            />
          </label>

          <label style={labelStyle}>
            Status *
            <select
              required
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              style={inputStyle}
            >
              <option value="DRAFT">Rascunho</option>
              <option value="PUBLISHED">Publicado</option>
              <option value="CANCELLED">Cancelado</option>
            </select>
          </label>
        </div>

        {error && (
          <div
            style={{
              padding: 12,
              backgroundColor: "#ffe6e6",
              color: "#d32f2f",
              borderRadius: 8,
              border: "1px solid #ffcdd2",
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
            }}
          >
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: 16,
            backgroundColor: loading ? "#ccc" : "#0099ff",
            color: "white",
            border: "none",
            borderRadius: 8,
            fontSize: "1rem",
            fontWeight: 600,
            cursor: loading ? "not-allowed" : "pointer",
            transition: "background-color 0.2s",
            marginTop: 8,
          }}
        >
          {loading ? "Criando..." : "Criar Evento"}
        </button>
      </form>
    </div>
  );
}
