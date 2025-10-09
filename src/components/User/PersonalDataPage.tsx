import { useState, useEffect } from "react";
import { api } from "../../services/api";
import { getUserId } from "../../utils/auth";
import {
  FormContainer,
  FormRow,
  FormField,
  FormInput,
  FormActions,
  FormButton,
} from "../Common/FormComponents";
import { FormDatePicker } from "../Common/DateComponents";
import { CityTypeahead } from "../Common/CityTypeahead";
import { FiUser, FiSave, FiEdit } from "react-icons/fi";

interface City {
  id: number;
  name: string;
  state: string;
  stateCode: string;
  ibgeCode?: string;
}

interface UserDataResponse {
  id: number;
  name: string;
  username?: string; // Email pode vir como username
  email?: string;
  cpf: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  city?: string;
  state?: string;
}

export default function PersonalDataPage() {
  // Data padrão: 01/01/1990
  const defaultDate = new Date(1990, 0, 1); // Mês 0 = Janeiro

  // Dados do usuário
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [phone, setPhone] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [gender, setGender] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");

  // Estados de controle
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [userId, setUserId] = useState<number | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Carregar dados do usuário ao montar o componente
  useEffect(() => {
    const loadUserData = async () => {
      const userIdFromToken = getUserId();
      if (userIdFromToken) {
        try {
          const response = await api.get<UserDataResponse>(
            `/users/${userIdFromToken}`
          );
          const user = response.data;

          // Preencher formulário com dados existentes
          setUserId(user.id);
          setName(user.name);
          setEmail(user.username || user.email || ""); // Prioriza username, depois email
          setCpf(user.cpf);
          setPhone(user.phone || "");
          setDateOfBirth(user.dateOfBirth ? new Date(user.dateOfBirth) : null);
          setGender(user.gender || "");
          setCity(user.city || "");
          setState(user.state || "");

          // Inicia em modo visualização (campos desabilitados)
          setIsEditMode(false);
        } catch (err) {
          console.error("Erro ao carregar dados do usuário:", err);
          setError("Erro ao carregar dados do usuário");
        }
      }
      setLoadingData(false);
    };

    loadUserData();
  }, []);

  const handleEditClick = () => {
    setIsEditMode(true);
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (userId) {
        // Atualizar dados do usuário
        await api.put(`/users/${userId}`, {
          name,
          phone,
          dateOfBirth: dateOfBirth
            ? dateOfBirth.toISOString().split("T")[0]
            : null,
          gender,
          city,
          state,
        });

        setSuccess("Dados atualizados com sucesso!");
        // Após salvar, volta para modo visualização
        setIsEditMode(false);
      }
    } catch (err) {
      const error = err as { response?: { data?: { message?: string } } };
      setError(
        error.response?.data?.message ||
          "Erro ao atualizar dados. Tente novamente."
      );
    } finally {
      setLoading(false);
    }
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
        Meus Dados Pessoais
      </h2>

      <div style={{ maxWidth: 600, margin: "0 auto" }}>
        <FormContainer title="Informações Pessoais" icon={<FiUser />}>
          <form onSubmit={handleSubmit}>
            <FormRow columns={1}>
              <FormField label="Nome Completo" required>
                <FormInput
                  type="text"
                  placeholder="Seu nome completo"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={!isEditMode}
                />
              </FormField>
            </FormRow>

            <FormRow columns={1}>
              <FormField label="E-mail" required>
                <FormInput
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  disabled={true}
                  style={{
                    backgroundColor: "#e9ecef",
                    cursor: "not-allowed",
                  }}
                />
                <small style={{ color: "#6c757d", fontSize: "0.85rem" }}>
                  O e-mail não pode ser alterado
                </small>
              </FormField>
            </FormRow>

            <FormRow columns={1}>
              <FormField label="CPF" required>
                <FormInput
                  type="text"
                  placeholder="000.000.000-00"
                  required
                  value={cpf}
                  disabled={true}
                  style={{
                    backgroundColor: "#e9ecef",
                    cursor: "not-allowed",
                  }}
                />
                <small style={{ color: "#6c757d", fontSize: "0.85rem" }}>
                  O CPF não pode ser alterado
                </small>
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField label="Telefone">
                <FormInput
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={!isEditMode}
                />
              </FormField>

              <FormField label="Data de Nascimento">
                <div
                  className={!isEditMode ? "form-input-disabled" : ""}
                  style={{ width: "100%" }}
                >
                  <FormDatePicker
                    selected={dateOfBirth || defaultDate}
                    onChange={(date) => setDateOfBirth(date)}
                    placeholder="Selecione sua data de nascimento"
                    showTimeSelect={false}
                    dateFormat="dd/MM/yyyy"
                    maxDate={new Date()}
                    showYearDropdown={true}
                    showMonthDropdown={true}
                    yearDropdownItemNumber={100}
                    scrollableYearDropdown={true}
                  />
                </div>
              </FormField>
            </FormRow>

            <FormRow columns={1}>
              <FormField label="Gênero">
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  disabled={!isEditMode}
                  style={{
                    width: "100%",
                    padding: "10px 12px",
                    fontSize: "1rem",
                    border: "1px solid #ddd",
                    borderRadius: 4,
                    backgroundColor: !isEditMode ? "#e9ecef" : "white",
                    cursor: !isEditMode ? "not-allowed" : "pointer",
                  }}
                >
                  <option value="">Selecione...</option>
                  <option value="M">Masculino</option>
                  <option value="F">Feminino</option>
                  <option value="O">Outro</option>
                  <option value="N">Prefiro não informar</option>
                </select>
              </FormField>
            </FormRow>

            <FormRow columns={2}>
              <FormField label="Cidade" required>
                <div
                  className={!isEditMode ? "form-input-disabled" : ""}
                  style={{ width: "100%" }}
                >
                  <CityTypeahead
                    value={city}
                    onCitySelect={(selectedCity: City) => {
                      setCity(selectedCity.name);
                      setState(selectedCity.state);
                    }}
                    placeholder="Digite o nome da cidade..."
                    required
                  />
                </div>
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

            {/* Ações e Mensagens */}
            <FormActions error={error} success={success}>
              {/* Botão de Editar - só aparece quando está em modo visualização */}
              {!isEditMode && (
                <FormButton
                  type="button"
                  variant="secondary"
                  icon={<FiEdit />}
                  onClick={handleEditClick}
                >
                  Editar Dados
                </FormButton>
              )}

              {/* Botão de Salvar - aparece quando está em modo edição */}
              {isEditMode && (
                <FormButton
                  type="submit"
                  variant="primary"
                  disabled={loading}
                  icon={<FiSave />}
                >
                  {loading ? "Salvando..." : "Salvar Alterações"}
                </FormButton>
              )}
            </FormActions>
          </form>
        </FormContainer>
      </div>
    </div>
  );
}
