import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import { useNavigate, useParams } from "react-router-dom";
import {
  hasOrganization,
  getOrganizationId,
  getUserRole,
} from "../../utils/auth";
import {
  FiCalendar,
  FiPlus,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
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
  FormTextarea,
} from "../Common/FormComponents";

interface EventCategory {
  id?: number; // ← ID da categoria (quando estiver editando)
  name: string;
  minAge: string;
  maxAge: string;
  gender: string;
  distance: string;
  distanceUnit: string;
  price: string;
  maxParticipants: string;
  observations: string;
}

interface EventData {
  id: number;
  name: string;
  description: string;
  eventDate: string;
  eventType: string;
  location: string;
  address: string;
  maxParticipants: number;
  registrationStartDate: string;
  registrationEndDate: string;
  price: number;
  status: string;
  categories?: Array<{
    id?: number;
    name: string;
    minAge?: number | null;
    maxAge?: number | null;
    gender?: string | null;
    distance?: number | null;
    distanceUnit?: string | null;
    price?: number | null;
    maxParticipants?: number | null;
    observations?: string | null;
  }>;
}

export default function CreateEventForm() {
  const { id } = useParams<{ id: string }>();
  const userRole = getUserRole();
  const isAdmin = userRole === "ROLE_ADMIN";

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
  const [price, setPrice] = useState("0");
  const [eventType, setEventType] = useState("RUNNING");
  const [status, setStatus] = useState("DRAFT");
  const [categories, setCategories] = useState<EventCategory[]>([]);
  const [collapsedCategories, setCollapsedCategories] = useState<boolean[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingEvent, setLoadingEvent] = useState(false);
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

  // Carregar dados do evento se estiver em modo de edição
  useEffect(() => {
    const loadEvent = async () => {
      if (!id) return;

      try {
        setLoadingEvent(true);
        const response = await api.get<EventData>(`/events/${id}`);
        const event = response.data;

        // Preencher formulário com dados do evento
        setName(event.name || "");
        setDescription(event.description || "");
        setEventDate(event.eventDate ? new Date(event.eventDate) : null);
        setRegistrationStart(
          event.registrationStartDate
            ? new Date(event.registrationStartDate)
            : null
        );
        setRegistrationEnd(
          event.registrationEndDate ? new Date(event.registrationEndDate) : null
        );
        setLocation(event.location || "");

        // Extrair cidade, estado e país do endereço
        if (event.address) {
          const addressParts = event.address.split(", ");
          if (addressParts.length >= 3) {
            setCity(addressParts[0]);
            setState(addressParts[1]);
            setCountry(addressParts[2]);
          }
        }

        setMaxParticipants(event.maxParticipants?.toString() || "");
        setPrice(event.price?.toString() || "0");
        setEventType(event.eventType || "RUNNING");
        setStatus(event.status || "DRAFT");

        // Carregar categorias se existirem
        console.log("Categorias recebidas do backend:", event.categories);

        if (
          event.categories &&
          Array.isArray(event.categories) &&
          event.categories.length > 0
        ) {
          const formattedCategories = event.categories.map((cat) => ({
            id: cat.id, // ← Preservar ID da categoria
            name: cat.name || "",
            minAge:
              cat.minAge !== null && cat.minAge !== undefined
                ? cat.minAge.toString()
                : "",
            maxAge:
              cat.maxAge !== null && cat.maxAge !== undefined
                ? cat.maxAge.toString()
                : "",
            gender: cat.gender || "MIXED",
            distance:
              cat.distance !== null && cat.distance !== undefined
                ? cat.distance.toString()
                : "",
            distanceUnit: cat.distanceUnit || "KM",
            price:
              cat.price !== null && cat.price !== undefined
                ? cat.price.toString()
                : "0",
            maxParticipants:
              cat.maxParticipants !== null && cat.maxParticipants !== undefined
                ? cat.maxParticipants.toString()
                : "",
            observations: cat.observations || "",
          }));

          console.log(
            "Categorias formatadas para o estado:",
            formattedCategories
          );
          setCategories(formattedCategories);
          // Inicializar todas as categorias como colapsadas
          setCollapsedCategories(
            new Array(formattedCategories.length).fill(true)
          );
        } else {
          console.log("Nenhuma categoria encontrada ou array vazio");
          setCategories([]);
          setCollapsedCategories([]);
        }
      } catch (err) {
        console.error("Erro ao carregar evento:", err);
        setError("Erro ao carregar dados do evento");
      } finally {
        setLoadingEvent(false);
      }
    };

    loadEvent();
  }, [id]);

  // Função para gerar o nome da categoria automaticamente
  const generateCategoryName = (category: EventCategory): string => {
    const parts: string[] = [];

    // Adicionar distância (ex: "5KM")
    if (category.distance && category.distanceUnit) {
      parts.push(`${category.distance}${category.distanceUnit}`);
    }

    // Adicionar gênero
    const genderMap: Record<string, string> = {
      MALE: "Masculino",
      FEMALE: "Feminino",
      MIXED: "Misto",
    };
    if (category.gender) {
      parts.push(genderMap[category.gender] || category.gender);
    }

    // Adicionar faixa etária (ex: "18-29 anos")
    if (category.minAge || category.maxAge) {
      if (category.minAge && category.maxAge) {
        parts.push(`${category.minAge}-${category.maxAge} anos`);
      } else if (category.minAge) {
        parts.push(`${category.minAge}+ anos`);
      } else if (category.maxAge) {
        parts.push(`até ${category.maxAge} anos`);
      }
    }

    return parts.join(" - ") || "Nova Categoria";
  };

  // Funções para gerenciar categorias
  const addCategory = () => {
    const newCategory: EventCategory = {
      name: "",
      minAge: "",
      maxAge: "",
      gender: "MIXED",
      distance: "",
      distanceUnit: "KM",
      price: price, // Usa o preço do evento como padrão
      maxParticipants: "",
      observations: "",
    };
    setCategories([...categories, newCategory]);
    setCollapsedCategories([...collapsedCategories, false]); // Nova categoria expandida
  };

  const removeCategory = (index: number) => {
    setCategories(categories.filter((_, i) => i !== index));
    setCollapsedCategories(collapsedCategories.filter((_, i) => i !== index));
  };

  const toggleCategory = (index: number) => {
    const newCollapsed = [...collapsedCategories];
    newCollapsed[index] = !newCollapsed[index];
    setCollapsedCategories(newCollapsed);
  };

  const updateCategory = (
    index: number,
    field: keyof EventCategory,
    value: string | Date | null
  ) => {
    const updatedCategories = [...categories];
    updatedCategories[index] = { ...updatedCategories[index], [field]: value };

    // Atualizar o nome automaticamente
    updatedCategories[index].name = generateCategoryName(
      updatedCategories[index]
    );

    setCategories(updatedCategories);
  };

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

      // Preparar categorias para envio
      const formattedCategories = categories.map((cat) => ({
        ...(cat.id && { id: cat.id }), // ← Incluir ID apenas se existir (spread condicional)
        name: cat.name,
        minAge: cat.minAge ? parseInt(cat.minAge) : null,
        maxAge: cat.maxAge ? parseInt(cat.maxAge) : null,
        gender: cat.gender || null,
        distance: cat.distance ? parseFloat(cat.distance) : null,
        distanceUnit: cat.distanceUnit || "KM",
        price: cat.price ? parseFloat(cat.price) : 0,
        maxParticipants: cat.maxParticipants
          ? parseInt(cat.maxParticipants)
          : null,
        isActive: true,
        observations: cat.observations || null,
      }));

      const eventData = {
        organizationId,
        name,
        slug: name
          .toLowerCase()
          .replace(/\s+/g, "-")
          .replace(/[^\w-]/g, ""),
        description,
        eventType,
        eventDate: eventDate?.toISOString().split("T")[0], // Apenas data (YYYY-MM-DD)
        eventTime:
          eventDate?.toISOString().split("T")[1]?.substring(0, 8) || "07:00:00", // HH:mm:ss
        location,
        address: `${city}, ${state}, ${country}`,
        maxParticipants: maxParticipants ? parseInt(maxParticipants) : null,
        registrationOpen: true,
        registrationStartDate:
          registrationStart?.toISOString().split("T")[0] || null,
        registrationEndDate:
          registrationEnd?.toISOString().split("T")[0] || null,
        price: price ? parseFloat(price) : 0,
        currency: "BRL",
        platformFeePercentage: 5.0,
        status,
        categories: formattedCategories, // Incluir categorias no payload
      };

      // Criar ou atualizar o evento
      if (id) {
        // Modo edição - PUT
        await api.put(`/events/${id}`, eventData);
        setSuccess("Evento atualizado com sucesso!");
      } else {
        // Modo criação - POST
        await api.post("/events", eventData);
        setSuccess("Evento criado com sucesso!");
      }

      setTimeout(() => {
        navigate("/meus-eventos");
      }, 2000);
    } catch (err) {
      console.error("Erro ao salvar evento:", err);

      let errorMessage = id
        ? "Erro ao atualizar evento."
        : "Erro ao criar evento.";

      if (err && typeof err === "object" && "response" in err) {
        const response = (err as { response?: { data?: { message?: string } } })
          .response;
        if (response?.data?.message) {
          errorMessage = response.data.message;
        }
      } else if (err && typeof err === "object" && "message" in err) {
        errorMessage = (err as { message: string }).message;
      }

      setError(errorMessage);
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
    { value: "DRAFT", label: "Pendente" },
    { value: "PUBLISHED", label: "Publicado" },
    { value: "CANCELLED", label: "Cancelado" },
  ];

  const genderOptions = [
    { value: "MALE", label: "Masculino" },
    { value: "FEMALE", label: "Feminino" },
    { value: "MIXED", label: "Misto" },
    { value: "OTHER", label: "Outro" },
  ];

  const distanceUnitOptions = [
    { value: "KM", label: "KM" },
    { value: "MI", label: "MI" },
    { value: "METERS", label: "Metros" },
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
          title={id ? "Editar Evento Esportivo" : "Criar Novo Evento Esportivo"}
          icon={<FiCalendar />}
        >
          {loadingEvent ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <p>Carregando dados do evento...</p>
            </div>
          ) : (
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

              {/* Máximo de Participantes, Valor da Inscrição e Status */}
              <FormRow columns={3}>
                <FormField label="Máximo de Participantes">
                  <FormInput
                    type="number"
                    placeholder="Ex: 500"
                    value={maxParticipants}
                    onChange={(e) => setMaxParticipants(e.target.value)}
                    min="1"
                  />
                </FormField>
                <FormField label="Valor da Inscrição (R$)" required>
                  <FormInput
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    min="0"
                    required
                  />
                </FormField>
                <FormField label="Status" required>
                  {isAdmin ? (
                    <FormSelect
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      options={statusOptions}
                      required
                    />
                  ) : (
                    <FormInput
                      type="text"
                      value="Pendente"
                      disabled
                      required
                      style={{
                        backgroundColor: "#f9fafb",
                        cursor: "not-allowed",
                      }}
                    />
                  )}
                </FormField>
              </FormRow>

              {/* Seção de Categorias */}
              <div
                style={{
                  marginTop: 40,
                  paddingTop: 24,
                  borderTop: "2px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 20,
                  }}
                >
                  <h3
                    style={{ margin: 0, color: "#0099ff", fontSize: "1.3rem" }}
                  >
                    Categorias do Evento
                  </h3>
                  <FormButton
                    type="button"
                    variant="secondary"
                    icon={<FiPlus />}
                    onClick={addCategory}
                  >
                    Adicionar Categoria
                  </FormButton>
                </div>

                {categories.length === 0 && (
                  <div
                    style={{
                      padding: 24,
                      backgroundColor: "#f8f9fa",
                      borderRadius: 8,
                      textAlign: "center",
                      color: "#6c757d",
                    }}
                  >
                    Nenhuma categoria cadastrada. Adicione categorias para
                    organizar as inscrições do evento.
                  </div>
                )}

                {categories.map((category, index) => {
                  const isCollapsed = collapsedCategories[index] ?? true;

                  return (
                    <div
                      key={index}
                      style={{
                        marginBottom: 16,
                        backgroundColor: "#ffffff",
                        borderRadius: 8,
                        border: "1px solid #e5e7eb",
                        overflow: "hidden",
                        transition: "all 0.3s ease",
                      }}
                    >
                      {/* Header - Sempre visível */}
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "16px 20px",
                          backgroundColor: isCollapsed ? "#f8f9fa" : "#e3f2fd",
                          cursor: "pointer",
                          transition: "background-color 0.3s ease",
                        }}
                        onClick={() => toggleCategory(index)}
                      >
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 12,
                            flex: 1,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              width: 32,
                              height: 32,
                              borderRadius: "50%",
                              backgroundColor: isCollapsed
                                ? "#e5e7eb"
                                : "#0099ff",
                              color: isCollapsed ? "#6b7280" : "#ffffff",
                              transition: "all 0.3s ease",
                            }}
                          >
                            {isCollapsed ? (
                              <FiChevronDown size={18} />
                            ) : (
                              <FiChevronUp size={18} />
                            )}
                          </div>
                          <div>
                            <h4
                              style={{
                                margin: 0,
                                color: "#374151",
                                fontSize: "1rem",
                                fontWeight: 600,
                              }}
                            >
                              {category.name || `Categoria ${index + 1}`}
                            </h4>
                            {isCollapsed && (
                              <p
                                style={{
                                  margin: "4px 0 0 0",
                                  fontSize: "0.875rem",
                                  color: "#6b7280",
                                }}
                              >
                                Clique para expandir e editar
                              </p>
                            )}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // Previne toggle ao clicar em remover
                            removeCategory(index);
                          }}
                          style={{
                            padding: "8px 12px",
                            backgroundColor: "#ef4444",
                            color: "white",
                            border: "none",
                            borderRadius: 6,
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: 6,
                            transition: "background-color 0.2s ease",
                          }}
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#dc2626")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#ef4444")
                          }
                        >
                          <FiTrash2 size={16} />
                          Remover
                        </button>
                      </div>

                      {/* Body - Mostra quando expandido */}
                      <div
                        style={{
                          maxHeight: isCollapsed ? 0 : "2000px",
                          opacity: isCollapsed ? 0 : 1,
                          overflow: "hidden",
                          transition:
                            "max-height 0.4s ease, opacity 0.3s ease, padding 0.3s ease",
                          padding: isCollapsed ? "0 20px" : "20px",
                        }}
                      >
                        {!isCollapsed && (
                          <>
                            <FormRow columns={1}>
                              <FormField label="Nome da Categoria" required>
                                <FormInput
                                  type="text"
                                  placeholder="Ex: 5KM - Masculino - 18-29 anos"
                                  value={
                                    category.name || "Preencha os campos abaixo"
                                  }
                                  disabled
                                  style={{
                                    backgroundColor: "#f5f5f5",
                                    cursor: "not-allowed",
                                  }}
                                />
                              </FormField>
                            </FormRow>

                            {/* Faixa Etária e Gênero */}
                            <FormRow columns={3}>
                              <FormField label="Idade Mínima">
                                <FormInput
                                  type="number"
                                  placeholder="Ex: 18"
                                  value={category.minAge}
                                  onChange={(e) =>
                                    updateCategory(
                                      index,
                                      "minAge",
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                />
                              </FormField>
                              <FormField label="Idade Máxima">
                                <FormInput
                                  type="number"
                                  placeholder="Ex: 29"
                                  value={category.maxAge}
                                  onChange={(e) =>
                                    updateCategory(
                                      index,
                                      "maxAge",
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                />
                              </FormField>
                              <FormField label="Gênero">
                                <FormSelect
                                  value={category.gender}
                                  onChange={(e) =>
                                    updateCategory(
                                      index,
                                      "gender",
                                      e.target.value
                                    )
                                  }
                                  options={genderOptions}
                                />
                              </FormField>
                            </FormRow>

                            {/* Distância e Unidade */}
                            <FormRow columns={2}>
                              <FormField label="Distância">
                                <FormInput
                                  type="number"
                                  step="0.01"
                                  placeholder="Ex: 5"
                                  value={category.distance}
                                  onChange={(e) =>
                                    updateCategory(
                                      index,
                                      "distance",
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                />
                              </FormField>
                              <FormField label="Unidade">
                                <FormSelect
                                  value={category.distanceUnit}
                                  onChange={(e) =>
                                    updateCategory(
                                      index,
                                      "distanceUnit",
                                      e.target.value
                                    )
                                  }
                                  options={distanceUnitOptions}
                                />
                              </FormField>
                            </FormRow>

                            {/* Preço e Vagas */}
                            <FormRow columns={2}>
                              <FormField
                                label="Valor da Inscrição (R$)"
                                required
                              >
                                <FormInput
                                  type="number"
                                  step="0.01"
                                  placeholder="0.00"
                                  value={category.price}
                                  onChange={(e) =>
                                    updateCategory(
                                      index,
                                      "price",
                                      e.target.value
                                    )
                                  }
                                  min="0"
                                  required
                                />
                              </FormField>
                              <FormField label="Máximo de Participantes">
                                <FormInput
                                  type="number"
                                  placeholder="Deixe vazio para ilimitado"
                                  value={category.maxParticipants}
                                  onChange={(e) =>
                                    updateCategory(
                                      index,
                                      "maxParticipants",
                                      e.target.value
                                    )
                                  }
                                  min="1"
                                />
                              </FormField>
                            </FormRow>

                            {/* Observações */}
                            <FormRow columns={1}>
                              <FormField label="Observações">
                                <FormTextarea
                                  placeholder="Informações adicionais sobre esta categoria..."
                                  value={category.observations}
                                  onChange={(e) =>
                                    updateCategory(
                                      index,
                                      "observations",
                                      e.target.value
                                    )
                                  }
                                  rows={2}
                                />
                              </FormField>
                            </FormRow>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Ações e Mensagens */}
              <FormActions error={error} success={success}>
                <FormButton type="submit" disabled={loading} variant="primary">
                  {loading
                    ? id
                      ? "Atualizando..."
                      : "Criando..."
                    : id
                    ? "Atualizar Evento"
                    : "Criar Evento"}
                </FormButton>
              </FormActions>
            </form>
          )}
        </FormContainer>
      </div>
    </div>
  );
}
