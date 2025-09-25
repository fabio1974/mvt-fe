import { useState } from "react";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { getUserId } from "../../utils/auth";
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormTextarea,
  FormActions,
  FormButton,
} from "../Common/FormComponents";
import { FiSettings, FiSave } from "react-icons/fi";

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

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <FormContainer title="Informações da Organização" icon={<FiSettings />}>
          <form onSubmit={handleSubmit}>
            <FormRow columns={1}>
              <FormField label="Nome da Organização" required>
                <FormInput
                  type="text"
                  placeholder="Nome da sua organização"
                  required
                  value={name}
                  onChange={(e) => handleNameChange(e.target.value)}
                />
              </FormField>
            </FormRow>

            <FormRow columns={1}>
              <FormField label="Slug (URL amigável)" required>
                <FormInput
                  type="text"
                  placeholder="slug-da-organizacao"
                  required
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  style={{ backgroundColor: "#f8f9fa" }}
                />
                <small
                  style={{ color: "#666", fontSize: "0.875rem", marginTop: 2 }}
                >
                  Gerado automaticamente a partir do nome. Você pode editá-lo se
                  desejar.
                </small>
              </FormField>
            </FormRow>

            <FormRow columns={1}>
              <FormField label="Descrição" required>
                <FormTextarea
                  placeholder="Descreva sua organização"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                />
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField label="E-mail de Contato" required>
                <FormInput
                  type="email"
                  placeholder="contato@organizacao.com"
                  required
                  value={contactEmail}
                  onChange={(e) => setContactEmail(e.target.value)}
                />
              </FormField>

              <FormField label="Telefone">
                <FormInput
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField label="Website">
                <FormInput
                  type="url"
                  placeholder="https://www.suaorganizacao.com"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                />
              </FormField>

              <FormField label="URL do Logo">
                <FormInput
                  type="url"
                  placeholder="https://exemplo.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                />
              </FormField>
            </FormRow>

            <FormActions>
              <FormButton
                type="submit"
                variant="primary"
                disabled={loading}
                icon={<FiSave />}
              >
                {loading ? "Cadastrando..." : "Cadastrar Organização"}
              </FormButton>
            </FormActions>

            {error && (
              <div
                style={{ color: "#ef4444", textAlign: "center", marginTop: 16 }}
              >
                {error}
              </div>
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
                <div style={{ color: "#10b981", fontSize: "1rem" }}>
                  {success}
                </div>
                <FormButton
                  type="button"
                  variant="secondary"
                  onClick={() => navigate("/criar-evento")}
                >
                  Cadastrar Evento
                </FormButton>
              </div>
            )}
          </form>
        </FormContainer>
      </div>
    </div>
  );
}
