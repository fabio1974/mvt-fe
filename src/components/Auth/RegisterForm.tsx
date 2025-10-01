import { useForm } from "react-hook-form";
import { api } from "../../services/api";
import { useState } from "react";
import {
  FormField,
  FormInput,
  FormSelect,
  FormActions,
  FormButton,
} from "../Common/FormComponents";

interface RegisterFormData {
  name: string;
  username: string;
  password: string;
  role: string;
}

export default function RegisterForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    defaultValues: {
      role: "USER",
    },
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const onSubmit = async (data: RegisterFormData) => {
    setError("");
    setSuccess("");
    try {
      await api.post("/auth/register", {
        name: data.name,
        username: data.username,
        password: data.password,
        role: data.role || "USER",
      });
      setSuccess("Usuário registrado com sucesso!");
    } catch (err) {
      setError("Erro ao registrar usuário.");
      console.error(err);
    }
  };

  const roleOptions = [
    { value: "USER", label: "Atleta" },
    { value: "ORGANIZER", label: "Organizador" },
  ];

  return (
    <form
      style={{
        maxWidth: 400,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 16,
      }}
      onSubmit={handleSubmit(onSubmit)}
    >
      <FormField label="Nome" required error={errors.name?.message}>
        <FormInput
          type="text"
          placeholder="Digite seu nome completo"
          {...register("name", {
            required: "Nome é obrigatório",
            minLength: {
              value: 3,
              message: "Nome deve ter no mínimo 3 caracteres",
            },
          })}
        />
      </FormField>

      <FormField label="E-mail" required error={errors.username?.message}>
        <FormInput
          type="email"
          placeholder="Digite seu e-mail"
          {...register("username", {
            required: "E-mail é obrigatório",
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: "E-mail inválido",
            },
          })}
        />
      </FormField>

      <FormField label="Senha" required error={errors.password?.message}>
        <FormInput
          type="password"
          placeholder="Digite sua senha"
          {...register("password", {
            required: "Senha é obrigatória",
            minLength: {
              value: 6,
              message: "Senha deve ter no mínimo 6 caracteres",
            },
          })}
        />
      </FormField>

      <FormField label="Tipo de Usuário" error={errors.role?.message}>
        <FormSelect
          options={roleOptions}
          placeholder="Selecione o tipo de usuário"
          {...register("role")}
        />
      </FormField>

      <FormActions align="center">
        <FormButton
          type="submit"
          variant="primary"
          disabled={isSubmitting}
          style={{
            width: "100%",
            background: "linear-gradient(90deg, #0099ff, #006dc7)",
            color: "#fff",
            padding: "14px 0",
            borderRadius: "14px",
            fontWeight: 600,
            fontSize: "1rem",
            border: "none",
            cursor: isSubmitting ? "not-allowed" : "pointer",
            boxShadow: "0 8px 22px -6px rgba(0,153,255,0.5)",
            transition: "transform 0.25s ease, box-shadow 0.25s ease",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onMouseEnter={(e) => {
            if (!isSubmitting) {
              e.currentTarget.style.transform = "translateY(-3px)";
              e.currentTarget.style.boxShadow =
                "0 12px 26px -6px rgba(0,153,255,0.55)";
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)";
            e.currentTarget.style.boxShadow =
              "0 8px 22px -6px rgba(0,153,255,0.5)";
          }}
        >
          {isSubmitting ? "Enviando..." : "Cadastrar"}
        </FormButton>
      </FormActions>

      {error && (
        <div
          style={{ color: "#e74c3c", textAlign: "center", fontSize: "0.9rem" }}
        >
          {error}
        </div>
      )}
      {success && (
        <div
          style={{ color: "#0099ff", textAlign: "center", fontSize: "0.9rem" }}
        >
          {success}
        </div>
      )}
    </form>
  );
}
