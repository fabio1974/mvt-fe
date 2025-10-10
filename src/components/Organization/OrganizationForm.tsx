import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useNavigate } from "react-router-dom";
import { getUserId, getOrganizationId } from "../../utils/auth";
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormTextarea,
  FormActions,
  FormButton,
} from "../Common/FormComponents";
import { FiSettings, FiSave, FiEdit, FiPlus } from "react-icons/fi";

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
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [website, setWebsite] = useState("");
  const [description, setDescription] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [organizationId, setOrganizationId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Carregar organização existente ao montar o componente
  useEffect(() => {
    const loadOrganization = async () => {
      const orgId = getOrganizationId();
      const userId = getUserId();

      // Tentar carregar por organizationId primeiro
      if (orgId) {
        try {
          const response = await api.get<OrganizationResponse>(
            `/organizations/${orgId}`
          );
          const org = response.data;

          // Preencher formulário com dados existentes
          setOrganizationId(org.id);
          setName(org.name);
          setSlug(org.slug);
          setContactEmail(org.contactEmail);
          setPhone(org.phone || "");
          setWebsite(org.website || "");
          setDescription(org.description);
          setLogoUrl(org.logoUrl || "");

          // Inicia em modo visualização (campos desabilitados)
          setIsEditMode(false);
          setLoadingData(false);
          return;
        } catch (err) {
          console.error("Erro ao carregar organização pelo ID:", err);
        }
      }

      // Se não encontrou por orgId, tentar carregar pelo userId
      if (userId) {
        try {
          const response = await api.get<OrganizationResponse>(
            `/organizations/user/${userId}`
          );
          const org = response.data;

          // Preencher formulário com dados existentes
          setOrganizationId(org.id);
          setName(org.name);
          setSlug(org.slug);
          setContactEmail(org.contactEmail);
          setPhone(org.phone || "");
          setWebsite(org.website || "");
          setDescription(org.description);
          setLogoUrl(org.logoUrl || "");

          // Salvar organizationId no localStorage para próximas vezes
          localStorage.setItem("organizationId", org.id.toString());

          // Inicia em modo visualização (campos desabilitados)
          setIsEditMode(false);
        } catch (err) {
          console.error("Erro ao carregar organização pelo userId:", err);
          // Se não encontrar por nenhum dos dois, mantém em modo criação
          setIsEditMode(true);
        }
      } else {
        // Sem organização e sem userId, modo criação
        setIsEditMode(true);
      }

      setLoadingData(false);
    };

    loadOrganization();
  }, []);

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
      if (organizationId) {
        // Atualizar organização existente
        await api.put(`/organizations/${organizationId}`, {
          name,
          slug,
          contactEmail,
          phone,
          website,
          description,
          logoUrl,
        });

        setSuccess("Organização atualizada com sucesso!");
        // Após salvar, volta para modo visualização
        setIsEditMode(false);
      } else {
        // Criar nova organização
        const userId = getUserId();

        if (!userId) {
          setError("Erro: Usuário não identificado. Faça login novamente.");
          setLoading(false);
          return;
        }

        const response = await api.post<OrganizationResponse>(
          "/organizations",
          {
            name,
            slug,
            contactEmail,
            phone,
            website,
            description,
            logoUrl,
            userId, // Enviar userId no payload para vincular organização ao usuário
          }
        );

        // Salvar o ID da organização no localStorage
        if (response.data && response.data.id) {
          const newOrgId = response.data.id;
          setOrganizationId(newOrgId);
          localStorage.setItem("organizationId", newOrgId.toString());
        }

        setSuccess("Organização cadastrada com sucesso!");
        // Após cadastrar, desabilita campos e muda para modo visualização
        setIsEditMode(false);
      }
    } catch (err) {
      console.error(err);

      // Extrair mensagem de erro do backend
      let errorMessage = organizationId
        ? "Erro ao atualizar organização."
        : "Erro ao cadastrar organização.";

      if (err && typeof err === "object" && "response" in err) {
        const response = (
          err as {
            response?: {
              data?: {
                fieldErrors?: Record<string, string>;
                message?: string;
                error?: string;
              };
            };
          }
        ).response;

        if (response?.data) {
          const { fieldErrors, message, error } = response.data;

          // Prioridade: fieldErrors > message > error > mensagem padrão
          if (fieldErrors && Object.keys(fieldErrors).length > 0) {
            errorMessage = Object.entries(fieldErrors)
              .map(([field, msg]) => `${field}: ${msg}`)
              .join("; ");
          } else if (message) {
            errorMessage = message;
          } else if (error) {
            errorMessage = error;
          }
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleEditClick = () => {
    setIsEditMode(true);
    setSuccess("");
    setError("");
  };

  if (loadingData) {
    return (
      <div
        style={{
          minHeight: "calc(100vh - 160px)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <p>Carregando...</p>
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
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
                />
              </FormField>

              <FormField label="Telefone">
                <FormInput
                  type="tel"
                  placeholder="(11) 99999-9999"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditMode}
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
                  disabled={!isEditMode}
                />
              </FormField>

              <FormField label="URL do Logo">
                <FormInput
                  type="url"
                  placeholder="https://exemplo.com/logo.png"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  disabled={!isEditMode}
                />
              </FormField>
            </FormRow>

            {/* Ações e Mensagens */}
            <FormActions error={error} success={success}>
              {/* Botão de Editar - só aparece quando acessa pelo menu Organização (!fromCreateEvent) */}
              {organizationId && !isEditMode && !fromCreateEvent && (
                <FormButton
                  type="button"
                  variant="secondary"
                  icon={<FiEdit />}
                  onClick={handleEditClick}
                >
                  Editar Organização
                </FormButton>
              )}

              {/* Botão Gerenciar Eventos - só aparece quando vem do fluxo de criação de evento */}
              {organizationId && !isEditMode && fromCreateEvent && (
                <FormButton
                  type="button"
                  variant="primary"
                  icon={<FiPlus />}
                  onClick={() => navigate("/eventos")}
                >
                  Gerenciar Eventos
                </FormButton>
              )}

              {/* Botão de Salvar - aparece sempre que está em modo edição (novo cadastro ou editando) */}
              {(!organizationId || isEditMode) && (
                <FormButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  icon={<FiSave />}
                >
                  {loading
                    ? organizationId
                      ? "Salvando..."
                      : "Cadastrando..."
                    : organizationId
                    ? "Salvar Organização"
                    : "Cadastrar Organização"}
                </FormButton>
              )}
            </FormActions>
          </form>
        </FormContainer>
      </div>
    </div>
  );
}
