import { useState } from "react";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { getUserId } from "../../utils/auth";

interface OrganizationFormProps {
  fromCreateEvent?: boolean;
}

interface OrganizationResponse {
  id: number;
  name: string;
  slug: string;
  contactEmail: string;
  phone?: string;
  website?: string;
  description: string;
  logoUrl?: string;
}

export default function OrganizationForm({
  fromCreateEvent = false,
}: OrganizationFormProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // Função para gerar slug automaticamente a partir do nome
  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "") // Remove caracteres especiais
      .replace(/\s+/g, "-") // Substitui espaços por hífens
      .replace(/-+/g, "-") // Remove hífens duplicados
      .replace(/^-+|-+$/g, ""); // Remove hífens do início e fim
  };

  // Atualizar slug quando o nome mudar
  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      // 1. Criar a organização
      const response = await api.post<OrganizationResponse>("/organizations", {
        name,
        slug,
        contactEmail,
        phone,
        website,
        description,
        logoUrl,
      });

      // 2. Salvar o ID da organização no localStorage
      if (response.data && response.data.id) {
        const organizationId = response.data.id;
        localStorage.setItem("organizationId", organizationId.toString());

        // 3. Atualizar o usuário no backend para vincular à organização
        try {
          const userId = getUserId();
          if (userId) {
            await api.put(`/users/${userId}/organization`, {
              organizationId: organizationId,
            });
          } else {
            console.error("User ID não encontrado no token");
          }
        } catch (updateErr) {
          console.error(
            "Erro ao atualizar usuário com organizationId:",
            updateErr
          );
          // Não falha o processo principal, mas loga o erro
        }
      }

      setSuccess("Organização cadastrada com sucesso!");
    } catch (err) {
      setError("Erro ao cadastrar organização.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 160px)",
        padding: "40px 20px",
        backgroundColor: "#f8f9fa",
      }}
    >
      <h2
        style={{
          color: "#0099ff",
          fontSize: "1.8rem",
          marginBottom: 32,
          textAlign: "center",
        }}
      >
        Cadastro de Organização
      </h2>

      {fromCreateEvent && (
        <div
          style={{
            maxWidth: 600,
            margin: "0 auto 24px auto",
            padding: "20px",
            backgroundColor: "#e3f2fd",
            borderRadius: 8,
            border: "1px solid #bbdefb",
            textAlign: "center",
          }}
        >
          <p
            style={{
              margin: 0,
              color: "#1565c0",
              fontSize: "1rem",
              lineHeight: 1.5,
            }}
          >
            Para criar seu primeiro evento, precisamos conhecer alguns dados
            básicos sobre sua organização. Essas informações ajudarão os
            participantes a conhecer melhor quem está organizando o evento.
          </p>
        </div>
      )}

      <form
        style={{
          maxWidth: 600,
          margin: "0 auto",
          padding: "40px",
          backgroundColor: "white",
          borderRadius: 12,
          boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
        onSubmit={handleSubmit}
      >
        <label style={{ textAlign: "left", fontWeight: 500, marginBottom: 4 }}>
          Nome da Organização *
          <input
            type="text"
            placeholder="Nome da sua organização"
            required
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 4,
              borderRadius: 8,
              border: "1px solid #ddd",
            }}
          />
        </label>

        <label style={{ textAlign: "left", fontWeight: 500, marginBottom: 4 }}>
          Slug (URL amigável) *
          <input
            type="text"
            placeholder="slug-da-organizacao"
            required
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 4,
              borderRadius: 8,
              border: "1px solid #ddd",
              backgroundColor: "#f8f9fa",
            }}
          />
          <small style={{ color: "#666", fontSize: "0.875rem" }}>
            Gerado automaticamente a partir do nome. Você pode editá-lo se
            desejar.
          </small>
        </label>

        <label style={{ textAlign: "left", fontWeight: 500, marginBottom: 4 }}>
          Descrição *
          <textarea
            placeholder="Descreva sua organização"
            required
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              width: "100%",
              padding: 12,
              marginTop: 4,
              borderRadius: 8,
              border: "1px solid #ddd",
              resize: "vertical",
              fontFamily: "inherit",
            }}
          />
        </label>

        <div style={{ display: "flex", gap: 12 }}>
          <label
            style={{
              textAlign: "left",
              fontWeight: 500,
              marginBottom: 4,
              flex: 1,
            }}
          >
            E-mail de Contato *
            <input
              type="email"
              placeholder="contato@organizacao.com"
              required
              value={contactEmail}
              onChange={(e) => setContactEmail(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 4,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </label>

          <label
            style={{
              textAlign: "left",
              fontWeight: 500,
              marginBottom: 4,
              flex: 1,
            }}
          >
            Telefone
            <input
              type="tel"
              placeholder="(11) 99999-9999"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 4,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </label>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          <label
            style={{
              textAlign: "left",
              fontWeight: 500,
              marginBottom: 4,
              flex: 1,
            }}
          >
            Website
            <input
              type="url"
              placeholder="https://www.suaorganizacao.com"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 4,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </label>

          <label
            style={{
              textAlign: "left",
              fontWeight: 500,
              marginBottom: 4,
              flex: 1,
            }}
          >
            URL do Logo
            <input
              type="url"
              placeholder="https://exemplo.com/logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              style={{
                width: "100%",
                padding: 12,
                marginTop: 4,
                borderRadius: 8,
                border: "1px solid #ddd",
              }}
            />
          </label>
        </div>

        <button
          type="submit"
          style={{
            background: "#0099ff",
            color: "#fff",
            fontWeight: 600,
            border: "none",
            borderRadius: 24,
            padding: "14px 0",
            fontSize: "1.1rem",
            marginTop: 24,
            cursor: "pointer",
          }}
          disabled={loading}
        >
          {loading ? "Cadastrando..." : "Cadastrar Organização"}
        </button>

        {error && (
          <div style={{ color: "#e74c3c", textAlign: "center" }}>{error}</div>
        )}
        {success && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginTop: 16,
            }}
          >
            <div style={{ color: "#2ecc40", fontSize: "1rem" }}>{success}</div>
            <button
              onClick={() => navigate("/criar-evento")}
              style={{
                background: "#0099ff",
                color: "#fff",
                fontWeight: 600,
                border: "none",
                borderRadius: 20,
                padding: "8px 16px",
                fontSize: "0.9rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
              }}
            >
              Cadastrar Evento
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
